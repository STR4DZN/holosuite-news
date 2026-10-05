import type { Newsroom } from "../core/newsroom";
import { statusOf, type Article, type NewsItem } from "../domain/model";
import { articleContext } from "./context";
import { MotionScene } from "./motion";
import { validateNewsMotion } from "../domain/news-motion";
import { NewsEffects } from "./news-effects";
import { alertElement } from "./alerts";

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
      motion: validateNewsMotion({
        cover: text("motionCover") || undefined, reading: text("motionReading") || undefined,
        entry: text("motionEntry") || undefined, alert: text("motionAlert") || undefined,
        strength: text("motionStrength") || undefined, pace: text("motionPace") || undefined,
        priority: text("motionPriority") || (data.has("urgent") ? "urgent" : "normal"),
      }, data.has("urgent")),
    },
    notes: text("notes"),
  };
}
export interface EditorPorts {
  preview(context: Record<string, unknown>): Promise<string>;
  confirm(title: string, content: string): Promise<boolean>;
  error(error: unknown): void;
  changed(): void;
  broadcasted?(article: Article): void;
  pickImage(current: string): Promise<string | null>;
}
export class EditorSession {
  private readonly previewEffects = new NewsEffects();
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
    form.querySelector('[name="motionPriority"]')?.addEventListener("change", e => {
      const urgent = form.querySelector<HTMLInputElement>('[name="urgent"]');
      if (urgent) urgent.checked = (e.target as HTMLSelectElement).value === "urgent";
    }, options);
    form.querySelector('[name="urgent"]')?.addEventListener("change", e => {
      const priority = form.querySelector<HTMLSelectElement>('[name="motionPriority"]');
      if (priority) priority.value = (e.target as HTMLInputElement).checked ? "urgent" : "normal";
    }, options);
    root.querySelectorAll<HTMLButtonElement>("[data-writing-tab]").forEach(button => button.addEventListener("click", () => {
      const tab = button.dataset.writingTab;
      root.querySelectorAll<HTMLElement>("[data-writing-panel]").forEach(panel => panel.hidden = panel.dataset.writingPanel !== tab);
      this.motion.panel(root.querySelector(`[data-writing-panel="${tab}"]`));
      root.querySelectorAll<HTMLElement>("[data-writing-tab]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.writingTab === tab)));
    }, options));
    root.querySelector("[data-focus-editor]")?.addEventListener("click", e => {
      const creator = root.querySelector(".hn-creator");
      const focused = creator?.classList.toggle("hn-focus-editor");
      (e.currentTarget as HTMLElement).setAttribute("aria-pressed", String(!!focused));
    }, options);
    root.addEventListener("keydown", e => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); void this.flush().catch(this.ports.error); }
    }, options);
    root.querySelector("[data-test-entry]")?.addEventListener("click", () => void this.testEntry().catch(this.ports.error), options);
    root.querySelector("[data-test-alert]")?.addEventListener("click", () => this.testAlert(), options);
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
    root.querySelector("[data-broadcast-urgent]")?.addEventListener("click",()=>void this.broadcastUrgent().catch(this.ports.error),options);
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
      if (changed) {
        const scroll = target.scrollTop;
        this.previewEffects.stop();
        target.innerHTML = html;
        target.scrollTop = scroll;
        this.motion.refreshTheme();
        // Typing updates content without replaying presentation effects.
      }
    }
  }
  private async testEntry(): Promise<void> {
    const root = this.root, form = this.form(); if (!root || !form) return;
    root.querySelector(".hn-creator")?.classList.remove("hn-focus-editor");
    root.querySelector("[data-focus-editor]")?.setAttribute("aria-pressed", "false");
    root.querySelector<HTMLElement>("[data-alert-preview]")?.replaceChildren();
    await this.updatePreview();
    if (this.root !== root) return;
    const article = root.querySelector<HTMLElement>("[data-live-preview] .hn-article");
    if (article) {
      const pane = root.querySelector<HTMLElement>("[data-live-preview]");
      if (pane) pane.scrollTop = 0;
      this.previewEffects.entry(article, readForm(form, this.item.id).draft.motion!);
    }
    root.querySelector("[data-live-preview]")?.scrollIntoView({ block: "nearest", behavior: "instant" });
  }
  private testAlert(): void {
    const form = this.form(), target = this.root?.querySelector<HTMLElement>("[data-alert-preview]"); if (!form || !target) return;
    this.root?.querySelector(".hn-creator")?.classList.remove("hn-focus-editor");
    this.root?.querySelector("[data-focus-editor]")?.setAttribute("aria-pressed", "false");
    this.previewEffects.stop(); target.replaceChildren();
    const draft = readForm(form, this.item.id).draft;
    if (draft.motion!.alert === "none") return;
    const close = () => { this.previewEffects.stop(); target.replaceChildren(); };
    const notice = alertElement(draft, () => { close(); void this.testEntry().catch(this.ports.error); }, close);
    target.append(notice); this.previewEffects.alert(notice, draft.motion!);
    target.scrollIntoView({ block: "nearest", behavior: "instant" });
  }
  updateAppearance(): void { this.previewEffects.preferenceChanged(); }
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
      "[data-publish], [data-unpublish], [data-save], [data-broadcast-urgent]",
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
  private async broadcastUrgent(): Promise<void> {
    if(this.busy) return;
    await this.operation(()=>this.newsroom.broadcastUrgent(this.item.id,this.item.revision));
    const form=this.form();
    if(form){
      const urgent=form.querySelector<HTMLInputElement>('[name="urgent"]');if(urgent) urgent.checked=true;
      const priority=form.querySelector<HTMLSelectElement>('[name="motionPriority"]');if(priority) priority.value='urgent';
      const audience=form.querySelector<HTMLSelectElement>('[name="audience"]');if(audience) audience.value='all';
      this.updateAudience();
      await this.updatePreview();
    }
    this.label('Alerta global enviado', 'published');
    if(this.item.published) this.ports.broadcasted?.(this.item.published);
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
    this.previewEffects.dispose();
    this.listeners?.abort();
    clearTimeout(this.timer);
    clearTimeout(this.previewTimer);
    this.previewGeneration++;
    this.dirty = false;
    this.motion.dispose();
    this.root = undefined;
  }
}
