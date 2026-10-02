import { HoloNewsApplication, confirmAction } from "./base";
import type { Newsroom } from "../core/newsroom";
import type { NewsItem } from "../domain/model";
import { TEMPLATE_ROOT } from "../constants";
import { managerContext, editorContext } from "../ui/context";
import { EditorSession } from "../ui/editor";
import { legacyState, migrateLegacy } from "../storage/migrations";
import { assertWriter } from "../permissions/authority";

export class CreatorApp extends HoloNewsApplication {
  static override DEFAULT_OPTIONS = {
    ...HoloNewsApplication.DEFAULT_OPTIONS,
    id: "holonews-creator",
    window: {
      title: "HoloNews · Criador",
      icon: "fa-solid fa-pen",
      resizable: true,
    },
    position: { width: 1180, height: 830 },
  };
  static PARTS = { content: { template: `${TEMPLATE_ROOT}/gm/editor.hbs` } };
  private readonly session: EditorSession;
  constructor(
    item: NewsItem,
    private readonly newsroom: Newsroom,
    changed: () => void,
  ) {
    super({ id: `holonews-creator-${item.id}` });
    assertWriter();
    this.session = new EditorSession(
      item,
      newsroom,
      {
        preview: (context) =>
          renderTemplate(`${TEMPLATE_ROOT}/reader/article.hbs`, context),
        confirm: confirmAction,
        error: (error) => this.report(error),
        changed,
        pickImage: (current) =>
          new Promise((resolve) => {
            const Picker =
              foundry?.applications?.apps?.FilePicker?.implementation ??
              FilePicker;
            const picker = new Picker({
              type: "image",
              current,
              callback: (path: string) => resolve(path),
            });
            // Closing the picker leaves the image unchanged; there is no dependent operation.
            picker.browse();
          }),
      },
      this.motion,
    );
  }
  protected override async _prepareContext(): Promise<Record<string, unknown>> {
    assertWriter();
    return editorContext(
      this.session.item,
      [...game.users]
        .filter((u: any) => !u.isGM)
        .map((u: any) => ({ id: u.id, name: u.name })),
      [...new Set((await this.newsroom.list()).map((i) => i.draft.category))],
    );
  }
  protected override bind(root: HTMLElement): void {
    assertWriter();
    const mount = root.querySelector("[data-rich-editor]");
    const Element = foundry?.applications?.elements?.HTMLProseMirrorElement;
    if (mount && Element)
      mount.replaceChildren(
        Element.create({ name: "body", value: this.session.item.draft.body }),
      );
    this.session.bind(root);
  }
  override async close(options: object = {}): Promise<void> {
    if (await this.session.beforeClose()) await super.close(options);
  }
  async revokeAccess(): Promise<void> {
    const root = this.root();
    if (root) root.hidden = true;
    this.session.dispose();
    await super.close();
  }
  updateMotionPreference(reduced: boolean): void {
    this.motion.setReduced(reduced);
  }
}

export class ManagerApp extends HoloNewsApplication {
  static override DEFAULT_OPTIONS = {
    ...HoloNewsApplication.DEFAULT_OPTIONS,
    id: "holonews-manager",
    window: {
      title: "HoloNews · Notícias do mestre",
      icon: "fa-solid fa-newspaper",
      resizable: true,
    },
    position: { width: 1020, height: 720 },
  };
  static PARTS = { content: { template: `${TEMPLATE_ROOT}/gm/manager.hbs` } };
  private query = "";
  private filter = "all";
  private readonly creators = new Map<string, CreatorApp>();
  constructor(
    private readonly newsroom: Newsroom,
    private readonly openPortal: () => void,
  ) {
    super();
    assertWriter();
  }
  protected override async _prepareContext(): Promise<Record<string, unknown>> {
    assertWriter();
    const items = await this.newsroom.list();
    const old = legacyState() as any;
    const imported = new Set(items.map((i) => i.sourceId));
    const legacy =
      old?.articles?.some((a: any) => !imported.has(`v1:${a.id}`)) === true;
    return { ...managerContext(items, this.query, this.filter), legacy };
  }
  async edit(id: string): Promise<void> {
    assertWriter();
    const existing = this.creators.get(id);
    if (existing?.rendered) {
      existing.bringToFront();
      return;
    }
    const creator = new CreatorApp(
      await this.newsroom.get(id),
      this.newsroom,
      () => this.refresh(),
    );
    this.creators.set(id, creator);
    await creator.render({ force: true });
  }
  refresh(): void {
    if (this.rendered)
      void this.rerender().catch((error) => this.report(error));
  }
  protected override bind(root: HTMLElement): void {
    assertWriter();
    this.motion.mount(root, "manager");
    const run = (action: () => Promise<unknown>) => {
      void Promise.resolve()
        .then(() => {
          assertWriter();
          return action();
        })
        .catch((error) => this.report(error));
    };
    root
      .querySelectorAll<HTMLButtonElement>("[data-edit]")
      .forEach((b) =>
        b.addEventListener("click", () =>
          run(() => this.edit(b.dataset.edit!)),
        ),
      );
    root
      .querySelectorAll<HTMLButtonElement>("[data-duplicate]")
      .forEach((b) =>
        b.addEventListener("click", () =>
          run(async () =>
            this.edit((await this.newsroom.duplicate(b.dataset.duplicate!)).id),
          ),
        ),
      );
    root
      .querySelectorAll<HTMLButtonElement>("[data-retry]")
      .forEach((b) =>
        b.addEventListener("click", () =>
          run(() => this.newsroom.retry(b.dataset.retry!)),
        ),
      );
    root.querySelectorAll<HTMLButtonElement>("[data-delete]").forEach((b) =>
      b.addEventListener("click", () =>
        run(async () => {
          if (
            !(await confirmAction(
              "Excluir notícia",
              "A notícia e seu rascunho serão excluídos. Exporte um backup se quiser recuperá-los depois.",
            ))
          )
            return;
          const item = await this.newsroom.get(b.dataset.delete!);
          await this.newsroom.remove(item.id, item.revision);
          this.refresh();
        }),
      ),
    );
    root
      .querySelector("[data-manager-search]")
      ?.addEventListener("submit", (event) => {
        event.preventDefault();
        this.query =
          root.querySelector<HTMLInputElement>('input[name="query"]')?.value ??
          "";
        this.refresh();
      });
    root
      .querySelector<HTMLSelectElement>("[data-filter]")
      ?.addEventListener("change", (event) => {
        this.filter = (event.target as HTMLSelectElement).value;
        this.refresh();
      });
    root
      .querySelectorAll<HTMLButtonElement>('[data-action="create"]')
      .forEach((b) =>
        b.addEventListener("click", () =>
          run(async () => this.edit((await this.newsroom.create()).id)),
        ),
      );
    root
      .querySelector('[data-action="portal"]')
      ?.addEventListener("click", this.openPortal);
    root
      .querySelector('[data-action="export"]')
      ?.addEventListener("click", () =>
        run(async () =>
          saveDataToFile(
            JSON.stringify(await this.newsroom.backup(), null, 2),
            "application/json",
            `holonews-backup-${new Date().toISOString().slice(0, 10)}.json`,
          ),
        ),
      );
    const upload = root.querySelector<HTMLInputElement>("[data-import-file]")!;
    root
      .querySelector('[data-action="import"]')
      ?.addEventListener("click", () => upload.click());
    upload.addEventListener("change", () =>
      run(async () => {
        const file = upload.files?.[0];
        if (!file) return;
        if (file.size > 32 * 1024 * 1024)
          throw new Error("Use um backup de até 32 MB.");
        const count = await this.newsroom.importBackup(
          JSON.parse(await file.text()),
        );
        ui.notifications.info(`${count} notícia(s) importadas como rascunhos.`);
        this.refresh();
      }),
    );
    root
      .querySelector('[data-action="migrate"]')
      ?.addEventListener("click", () =>
        run(async () => {
          const count = await migrateLegacy(this.newsroom);
          ui.notifications.info(
            `${count} notícia(s) antigas trazidas como rascunhos. Revise o público antes de publicar.`,
          );
          this.refresh();
        }),
      );
  }
  updateMotionPreference(reduced: boolean): void {
    this.motion.setReduced(reduced);
    for (const creator of this.creators.values())
      creator.updateMotionPreference(reduced);
  }
  async revokeAccess(): Promise<void> {
    const root = this.root();
    if (root) root.hidden = true;
    await Promise.all(
      [...this.creators.values()].map((creator) => creator.revokeAccess()),
    );
    this.creators.clear();
    await super.close();
  }
}
