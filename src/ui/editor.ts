import type { Newsroom } from "../core/newsroom";
import { statusOf, type Article, type NewsItem } from "../domain/model";
import { articleContext } from "./context";
import { MotionScene } from "./motion";

export function readForm(
  form: HTMLFormElement,
  id: string,
): { draft: Article; notes: string } {
  const data = new FormData(form),
    text = (name: string) => String(data.get(name) ?? "");
  const rich = form.querySelector<any>('prose-mirror[name="body"]');
  return {
    draft: {
      id,
      title: text("title"),
      summary: text("summary"),
      body: rich ? String(rich.value ?? "") : text("body"),
      cover: text("cover"),
      coverAlt: text("coverAlt"),
      category: text("category").trim() || "Geral",
      author: text("author"),
      date: text("date"),
      tags: text("tags")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      featured: data.has("featured"),
      urgent: data.has("urgent"),
      views: Number(text("views") || 0),
      audience: {
        mode: text("audience") as Article["audience"]["mode"],
        users: data.getAll("users").map(String),
      },
    },
    notes: text("notes"),
  };
}
export interface EditorPorts {
  preview(context: Record<string, unknown>): Promise<string>;
  confirm(title: string, content: string): Promise<boolean>;
  error(error: unknown): void;
  changed(): void;
  pickImage(current: string): Promise<string | null>;
}
export class EditorSession {
  private root?: HTMLElement;
  private timer?: ReturnType<typeof setTimeout>;
  private previewTimer?: ReturnType<typeof setTimeout>;
  private chain: Promise<unknown> = Promise.resolve();
  private dirty = false;
  private generation = 0;
  private previewGeneration = 0;
  private busy = false;
  private listeners?: AbortController;
  constructor(
    public item: NewsItem,
    private readonly newsroom: Newsroom,
    private readonly ports: EditorPorts,
    private readonly motion = new MotionScene(),
  ) {}
  bind(root: HTMLElement): void {
    this.listeners?.abort();
    this.listeners = new AbortController();
    const options = { signal: this.listeners.signal };
    this.root = root;
    this.motion.mount(root, "creator");
    const form = this.form();
    if (!form) return;
    const input = () => {
      if (this.root !== root || options.signal.aborted) return;
      this.dirty = true;
      this.generation++;
      this.label("Alterações não salvas", "editing");
      this.schedule();
    };
    form.addEventListener("input", input, options);
    form.addEventListener("change", input, options);
    form.addEventListener("submit", (event) => event.preventDefault(), options);
    // ProseMirror emits save when its toolbar/keyboard save command is used.
    form.querySelector('prose-mirror[name="body"]')?.addEventListener("save", input, options);
    root
      .querySelector("[data-save]")
      ?.addEventListener(
        "click",
        () => void this.flush().catch(this.ports.error),
        options,
      );
    root
      .querySelector("[data-publish]")
      ?.addEventListener(
        "click",
        () => void this.publish().catch(this.ports.error),
        options,
      );
    root
      .querySelector("[data-preview]")
      ?.addEventListener(
        "click",
        () => void this.updatePreview().catch(this.ports.error),
        options,
      );
    root
      .querySelector("[data-unpublish]")
      ?.addEventListener(
        "click",
        () => void this.unpublish().catch(this.ports.error),
        options,
      );
    root
      .querySelector("[data-pick]")
      ?.addEventListener(
        "click",
        () => void this.pick().catch(this.ports.error),
        options,
      );
    form
      .querySelector('[name="audience"]')
      ?.addEventListener("change", () => this.updateAudience(), options);
    this.updateAudience();
    void this.updatePreview().catch(this.ports.error);
  }
  private form(): HTMLFormElement | null {
    return this.root?.querySelector<HTMLFormElement>("form[data-editor]") ?? null;
  }
  private label(text: string, state = "saved"): void {
    const node = this.root?.querySelector("[data-save-state]");
    if (node) {
      node.textContent = text;
      (node as HTMLElement).dataset.state = state;
      if (state === "published" || state === "unpublished")
        this.motion.feedback(node);
    }
  }
  private updateAudience(): void {
    const form = this.form();
    const selected = this.root?.querySelector<HTMLElement>(
      "[data-user-selection]",
    );
    if (selected)
      selected.hidden =
        form ? new FormData(form).get("audience") !== "selected" : true;
  }
  private schedule(): void {
    clearTimeout(this.timer);
    clearTimeout(this.previewTimer);
    this.timer = setTimeout(() => {
      void this.flush().catch(this.ports.error);
    }, 1000);
    this.previewTimer = setTimeout(() => {
      void this.updatePreview().catch(this.ports.error);
    }, 300);
  }
  async updatePreview(): Promise<void> {
    const root = this.root, form = this.form();
    if (!root || !form) return;
    const generation = ++this.previewGeneration,
      draft = readForm(form, this.item.id).draft;
    const html = await this.ports.preview(await articleContext(draft));
    const target = this.root?.querySelector<HTMLElement>("[data-live-preview]");
    if (target && this.root === root && generation === this.previewGeneration) {
      const changed = target.innerHTML !== html;
      target.innerHTML = html;
      if (changed) this.motion.pulsePreview(target);
    }
  }
  flush(): Promise<void> {
    clearTimeout(this.timer);
    const action = this.chain.then(async () => {
      const form = this.form();
      if (!this.dirty || !form) return;
      const generation = this.generation,
        values = readForm(form, this.item.id);
      this.label("Salvando rascunho…", "saving");
      try {
        this.item = await this.newsroom.save(
          this.item.id,
          values.draft,
          values.notes,
          this.item.revision,
        );
        if (generation === this.generation) this.dirty = false;
        this.label(this.dirty ? "Alterações não salvas" : "Rascunho salvo");
        this.updateStatus();
        this.ports.changed();
      } catch (error) {
        this.label("Falha ao salvar · tente novamente", "error");
        throw error;
      }
    });
    this.chain = action.catch(() => {});
    return action;
  }
  private updateStatus(): void {
    const status = this.root?.querySelector("[data-status]");
    if (status) status.textContent = statusOf(this.item);
    const unpublish =
      this.root?.querySelector<HTMLButtonElement>("[data-unpublish]");
    if (unpublish) unpublish.hidden = !this.item.published;
    const publish =
      this.root?.querySelector<HTMLButtonElement>("[data-publish]");
    if (publish)
      publish.textContent = this.item.published
        ? "Publicar revisão"
        : "Publicar notícia";
  }
  private async operation(action: () => Promise<NewsItem>): Promise<void> {
    if (this.busy || !this.form()) return;
    this.busy = true;
    const controls = this.root?.querySelectorAll<HTMLButtonElement>(
      "[data-publish], [data-unpublish], [data-save]",
    );
    controls?.forEach((b) => {
      b.disabled = true;
    });
    let flushed = false;
    try {
      await this.flush();
      flushed = true;
      this.item = await action();
      this.updateStatus();
      this.label("Rascunho salvo");
      this.ports.changed();
    } catch (error) {
      // A failed public write remains durable and retryable in the GM workspace.
      if (flushed) {
        this.item = await this.newsroom.get(this.item.id);
        this.updateStatus();
      }
      throw error;
    } finally {
      this.busy = false;
      controls?.forEach((b) => {
        b.disabled = false;
      });
    }
  }
  private async publish(): Promise<void> {
    await this.operation(() =>
      this.newsroom.publish(this.item.id, this.item.revision),
    );
    this.label("Notícia publicada", "published");
  }
  private async unpublish(): Promise<void> {
    if (
      !(await this.ports.confirm(
        "Retirar do portal",
        "A notícia deixará de aparecer para os jogadores. Seu rascunho será mantido.",
      ))
    )
      return;
    await this.operation(() =>
      this.newsroom.unpublish(this.item.id, this.item.revision),
    );
    this.label("Notícia retirada do portal", "unpublished");
  }
  private async pick(): Promise<void> {
    const form = this.form();
    if (!form) return;
    const input =
      form.querySelector<HTMLInputElement>('[name="cover"]')!;
    const path = await this.ports.pickImage(input.value);
    if (path !== null && this.form() === form) {
      input.value = path;
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }
  async beforeClose(): Promise<boolean> {
    clearTimeout(this.timer);
    clearTimeout(this.previewTimer);
    try {
      await this.flush();
      this.dispose();
      return true;
    } catch (error) {
      this.ports.error(error);
      const discard = await this.ports.confirm(
        "Rascunho não salvo",
        "Não foi possível salvar. Fechar e descartar as alterações desta janela?",
      );
      if (discard) this.dispose();
      return discard;
    }
  }
  dispose(): void {
    this.listeners?.abort();
    clearTimeout(this.timer);
    clearTimeout(this.previewTimer);
    this.previewGeneration++;
    this.dirty = false;
    this.motion.dispose();
    this.root = undefined;
  }
}
