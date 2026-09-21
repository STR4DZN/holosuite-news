import { MODULE_ID, TEMPLATE_ROOT } from "../constants";
import type { Newsroom } from "../core/newsroom";
import { createId, createPublication as createPublicationDefaults } from "../domain/factories";
import type { Article, Author, Category, Issue, Page, PageBlock, Publication, Visibility, NewsSettings } from "../domain/model";
import { assertEditorialAccess, HoloNewsApplication } from "./base";

type SavedCallback = () => void | Promise<void>;

abstract class EditorialFormApp extends HoloNewsApplication {
  protected autosaveTimer: ReturnType<typeof setTimeout> | null = null;
  private saveQueue: Promise<void> = Promise.resolve();
  constructor(protected readonly newsroom: Newsroom, protected readonly entityId: string | null, protected readonly onSaved: SavedCallback, options: object = {}) {
    assertEditorialAccess();
    super(options);
  }

  protected override bind(root: HTMLElement): void {
    const form = root.querySelector<HTMLFormElement>("form");
    form?.addEventListener("submit", (event) => { event.preventDefault(); void this.saveForm(form); });
    root.querySelectorAll<HTMLElement>("[data-hsn-editor-action]").forEach((element) => element.addEventListener("click", (event) => void this.onEditorAction(event, form)));
    if (this.entityId && form?.dataset.autosave === "true") {
      form.addEventListener("input", () => {
        if (this.autosaveTimer) clearTimeout(this.autosaveTimer);
        this.autosaveTimer = setTimeout(() => void this.saveForm(form, true), 900);
      });
    }
  }

  protected async onEditorAction(event: Event, form: HTMLFormElement | null): Promise<void> {
    const target = event.currentTarget as HTMLElement;
    if (target.dataset.hsnEditorAction === "file" && target.dataset.target) {
      const named = form?.elements.namedItem(target.dataset.target);
      const input = named instanceof HTMLInputElement ? named : target.closest("[data-block-id]")?.querySelector<HTMLInputElement>(`[name="${target.dataset.target}"]`) ?? null;
      const picker = new FilePicker({ type: "image", current: input?.value ?? "", callback: (path: string) => { if (input) { input.value = path; input.dispatchEvent(new Event("input", { bubbles: true })); } } });
      picker.render(true);
    }
    if (target.dataset.hsnEditorAction === "views-preset" && form) {
      const input = form.elements.namedItem("publicViews") as HTMLInputElement | null;
      if (input) {
        input.value = String(Math.max(0, Number(target.dataset.value ?? 0)));
        input.dispatchEvent(new Event("input", { bubbles: true }));
      }
    }
    if (target.dataset.hsnEditorAction === "views-adjust" && form) {
      const input = form.elements.namedItem("publicViews") as HTMLInputElement | null;
      if (input) {
        input.value = String(Math.max(0, Number(input.value || 0) + Number(target.dataset.delta ?? 0)));
        input.dispatchEvent(new Event("input", { bubbles: true }));
      }
    }
  }

  protected async saveForm(form: HTMLFormElement, silent = false): Promise<void> {
    this.saveQueue = this.saveQueue.then(async () => {
      try {
        await this.persist(new FormData(form), form);
        await this.onSaved();
        if (!silent) {
          ui.notifications?.info?.("HoloNews | Alterações salvas.");
          await (this as any).close();
        }
      } catch (error) { this.report(error); }
    });
    await this.saveQueue;
  }

  override async close(options?: object): Promise<void> {
    if (this.autosaveTimer) clearTimeout(this.autosaveTimer);
    this.autosaveTimer = null;
    await super.close(options);
  }

  protected abstract persist(data: FormData, form?: HTMLFormElement): Promise<unknown> | unknown;
}

export class NewspaperPublicationEditorApp extends EditorialFormApp {
  static override DEFAULT_OPTIONS = { ...HoloNewsApplication.DEFAULT_OPTIONS, id: "holosuite-news-publication-editor", classes: ["hsn-window", "hsn-editor-window"], window: { title: "HoloNews — Publicação", icon: "fa-solid fa-building-columns", resizable: true }, position: { width: 620, height: 720 } };
  static PARTS = { main: { template: `${TEMPLATE_ROOT}/gm/publication-editor.hbs` } };
  override async _prepareContext() { const state = await this.newsroom.getMasterState(); const publication = state.publications.find((value) => value.id === this.entityId) ?? createPublicationDefaults(); return { publication, isNew: !this.entityId, themes: ["classic", "modern", "corporate", "military", "underground", "tabloid", "terminal"], visibilityUsers: visibilityUserChoices(publication.visibility) }; }
  protected override persist(data: FormData) {
    const input: Partial<Publication> = { name: text(data, "name"), shortName: text(data, "shortName"), description: text(data, "description"), logo: text(data, "logo"), icon: text(data, "icon") || "fa-solid fa-newspaper", themeId: text(data, "themeId") as Publication["themeId"], enabled: checked(data, "enabled"), slogan: text(data, "slogan"), location: text(data, "location"), price: text(data, "price"), periodicity: text(data, "periodicity"), editorName: text(data, "editorName"), defaultIssueLayout: text(data, "defaultIssueLayout") || "frontpage-a", sort: integer(data, "sort", 0), primaryColor: text(data, "primaryColor"), secondaryColor: text(data, "secondaryColor"), visibility: visibility(data) };
    return this.entityId ? this.newsroom.updatePublication(this.entityId, input) : this.newsroom.createPublication(input);
  }
}

export class NewspaperIssueEditorApp extends EditorialFormApp {
  static override DEFAULT_OPTIONS = { ...HoloNewsApplication.DEFAULT_OPTIONS, id: "holosuite-news-issue-editor", classes: ["hsn-window", "hsn-editor-window"], window: { title: "HoloNews — Edição", icon: "fa-solid fa-copy", resizable: true }, position: { width: 620, height: 690 } };
  static PARTS = { main: { template: `${TEMPLATE_ROOT}/gm/issue-editor.hbs` } };
  constructor(newsroom: Newsroom, entityId: string | null, onSaved: SavedCallback, private readonly initialPublicationId?: string) { super(newsroom, entityId, onSaved); }
  override async _prepareContext() { const state = await this.newsroom.getMasterState(); const issue = state.issues.find((value) => value.id === this.entityId) ?? { publicationId: this.initialPublicationId ?? state.settings.defaultPublicationId, number: Math.max(0, ...state.issues.map((value) => value.number)) + 1, status: "draft", scheduledAt: null, visibility: { mode: "all", users: [] } }; return { issue, scheduledLocal: dateTimeLocal(issue.scheduledAt), publications: state.publications, visibilityUsers: visibilityUserChoices(issue.visibility), isNew: !this.entityId }; }
  protected override persist(data: FormData) {
    const input: Partial<Issue> & Pick<Issue, "publicationId"> = { publicationId: text(data, "publicationId"), number: integer(data, "number", 1), title: text(data, "title"), inWorldDate: text(data, "inWorldDate"), status: text(data, "status") as Issue["status"], scheduledAt: timestamp(data, "scheduledAt"), sort: integer(data, "sort", 0), visibility: visibility(data) };
    return this.entityId ? this.newsroom.updateIssue(this.entityId, input) : this.newsroom.createIssue(input);
  }
}

export class NewspaperArticleEditorApp extends EditorialFormApp {
  static override DEFAULT_OPTIONS = { ...HoloNewsApplication.DEFAULT_OPTIONS, id: "holosuite-news-article-editor", classes: ["hsn-window", "hsn-editor-window", "hsn-article-editor-window"], window: { title: "HoloNews — Matéria", icon: "fa-solid fa-file-lines", resizable: true }, position: { width: 780, height: 820 } };
  static PARTS = { main: { template: `${TEMPLATE_ROOT}/gm/article-editor.hbs` } };
  constructor(newsroom: Newsroom, entityId: string | null, onSaved: SavedCallback, private readonly initialIssueId?: string) { super(newsroom, entityId, onSaved); }
  override async _prepareContext() {
    const state = await this.newsroom.getMasterState();
    const initialIssue = state.issues.find((value) => value.id === this.initialIssueId) ?? state.issues[0];
    const article = state.articles.find((value) => value.id === this.entityId) ?? { issueId: initialIssue?.id, publicationId: initialIssue?.publicationId, status: "draft", publicViews: 0, visibility: { mode: "all", users: [] }, tags: [], relatedArticleIds: [], updates: [] };
    return { article, updatesJson: JSON.stringify(article.updates ?? [], null, 2), issues: state.issues, authors: state.authors, categories: state.categories, articles: state.articles.filter((value) => value.id !== this.entityId), visibilityUsers: visibilityUserChoices(article.visibility), isNew: !this.entityId };
  }
  protected override async persist(data: FormData) {
    const issueId = text(data, "issueId");
    const state = await this.newsroom.getMasterState();
    const publicationId = state.issues.find((issue) => issue.id === issueId)?.publicationId ?? "";
    const input: Partial<Article> & Pick<Article, "issueId" | "publicationId"> = { issueId, publicationId, title: text(data, "title"), subtitle: text(data, "subtitle"), kicker: text(data, "kicker"), body: text(data, "body"), authorId: nullable(data, "authorId"), author: text(data, "author"), authorTitle: text(data, "authorTitle"), categoryId: nullable(data, "categoryId"), category: text(data, "category"), tags: csv(data, "tags"), heroImage: text(data, "heroImage"), heroImageAlt: text(data, "heroImageAlt"), thumbnail: text(data, "thumbnail"), inWorldDate: text(data, "inWorldDate"), inWorldTime: text(data, "inWorldTime"), status: text(data, "status") as Article["status"], featured: checked(data, "featured"), breaking: checked(data, "breaking"), badge: text(data, "badge"), visibility: visibility(data), publicViews: integer(data, "publicViews", 0), relatedArticleIds: values(data, "relatedArticleIds"), updates: updates(data, "updatesJson"), gmNotes: text(data, "gmNotes"), sort: integer(data, "sort", 0) };
    return this.entityId ? this.newsroom.updateArticle(this.entityId, input) : this.newsroom.createArticle(input);
  }
}

export class NewspaperPageEditorApp extends EditorialFormApp {
  static override DEFAULT_OPTIONS = { ...HoloNewsApplication.DEFAULT_OPTIONS, id: "holosuite-news-page-editor", classes: ["hsn-window", "hsn-editor-window", "hsn-page-editor-window"], window: { title: "HoloNews — Página", icon: "fa-solid fa-table-columns", resizable: true }, position: { width: 760, height: 780 } };
  static PARTS = { main: { template: `${TEMPLATE_ROOT}/gm/page-editor.hbs` } };
  private draftBlocks: PageBlock[] | null = null;
  constructor(newsroom: Newsroom, entityId: string | null, onSaved: SavedCallback, private readonly initialIssueId?: string) { super(newsroom, entityId, onSaved); }
  protected override bind(root: HTMLElement): void {
    super.bind(root);
    const form = root.querySelector<HTMLFormElement>("form");
    let draggedId = "";
    root.querySelectorAll<HTMLElement>("[data-block-id]").forEach((item) => {
      item.addEventListener("dragstart", () => { draggedId = item.dataset.blockId ?? ""; item.classList.add("is-dragging"); });
      item.addEventListener("dragend", () => item.classList.remove("is-dragging"));
      item.addEventListener("dragover", (event) => event.preventDefault());
      item.addEventListener("drop", (event) => {
        event.preventDefault();
        this.captureBlocks(form);
        const targetId = item.dataset.blockId ?? "";
        const from = this.draftBlocks?.findIndex((block) => block.id === draggedId) ?? -1;
        const to = this.draftBlocks?.findIndex((block) => block.id === targetId) ?? -1;
        if (!this.draftBlocks || from < 0 || to < 0 || from === to) return;
        const [moved] = this.draftBlocks.splice(from, 1);
        if (moved) this.draftBlocks.splice(to, 0, moved);
        this.draftBlocks.forEach((block, index) => { block.sort = index; });
        void this.rerender();
      });
    });
  }
  override async _prepareContext() { const state = await this.newsroom.getMasterState(); const page = state.pages.find((value) => value.id === this.entityId) ?? null; this.draftBlocks ??= structuredClone(page?.blocks ?? []); return { page: page ?? { issueId: this.initialIssueId ?? state.issues[0]?.id, pageNumber: 1, title: "Nova página", layout: "two-column", sort: 0 }, issues: state.issues, articles: state.articles, authors: state.authors, blocks: this.draftBlocks, blockTypes: ["headline", "article-preview", "article", "image", "quote", "short-news", "breaking-news", "advertisement", "classified", "editorial", "author-card", "stat-box", "timeline", "related-news", "divider", "custom-html"], isNew: !this.entityId }; }
  protected override async onEditorAction(event: Event, form: HTMLFormElement | null): Promise<void> {
    await super.onEditorAction(event, form);
    const target = event.currentTarget as HTMLElement;
    const action = target.dataset.hsnEditorAction;
    if (!action?.startsWith("block-")) return;
    this.captureBlocks(form);
    const index = Number(target.dataset.index ?? -1);
    if (action === "block-add") this.draftBlocks?.push({ id: createId("block"), type: "article-preview", sort: this.draftBlocks.length, span: 1 });
    if (action === "block-delete" && index >= 0) this.draftBlocks?.splice(index, 1);
    if (action === "block-duplicate" && index >= 0 && this.draftBlocks?.[index]) this.draftBlocks.splice(index + 1, 0, { ...structuredClone(this.draftBlocks[index]), id: createId("block") });
    if (action === "block-up" && index > 0 && this.draftBlocks) [this.draftBlocks[index - 1], this.draftBlocks[index]] = [this.draftBlocks[index]!, this.draftBlocks[index - 1]!];
    if (action === "block-down" && this.draftBlocks && index >= 0 && index < this.draftBlocks.length - 1) [this.draftBlocks[index], this.draftBlocks[index + 1]] = [this.draftBlocks[index + 1]!, this.draftBlocks[index]!];
    this.draftBlocks?.forEach((block, blockIndex) => { block.sort = blockIndex; });
    await this.rerender();
  }
  private captureBlocks(form: HTMLFormElement | null) {
    if (!form || !this.draftBlocks) return;
    const data = new FormData(form);
    this.draftBlocks = values(data, "blockId").map((id, index) => ({ id, type: (values(data, "blockType")[index] ?? "article-preview") as PageBlock["type"], articleId: values(data, "blockArticleId")[index] || undefined, authorId: values(data, "blockAuthorId")[index] || undefined, title: values(data, "blockTitle")[index] || undefined, body: values(data, "blockBody")[index] || undefined, image: values(data, "blockImage")[index] || undefined, alt: values(data, "blockAlt")[index] || undefined, link: values(data, "blockLink")[index] || undefined, emphasis: (values(data, "blockEmphasis")[index] || "standard") as PageBlock["emphasis"], span: Number(values(data, "blockSpan")[index] ?? 1) as 1 | 2 | 3, sort: index }));
  }
  protected override persist(data: FormData, form?: HTMLFormElement) {
    this.captureBlocks(form ?? null);
    const issueId = text(data, "issueId");
    const input: Partial<Page> = { issueId, pageNumber: integer(data, "pageNumber", 1), title: text(data, "title"), layout: text(data, "layout"), sort: integer(data, "sort", 0), blocks: this.draftBlocks ?? [] };
    return this.entityId ? this.newsroom.updatePage(this.entityId, input) : this.newsroom.createPage(issueId, input);
  }
}

export class NewspaperTaxonomyEditorApp extends EditorialFormApp {
  static override DEFAULT_OPTIONS = { ...HoloNewsApplication.DEFAULT_OPTIONS, id: "holosuite-news-taxonomy-editor", classes: ["hsn-window", "hsn-editor-window"], window: { title: "HoloNews — Cadastro", icon: "fa-solid fa-tags", resizable: true }, position: { width: 520, height: 560 } };
  static PARTS = { main: { template: `${TEMPLATE_ROOT}/gm/taxonomy-editor.hbs` } };
  constructor(newsroom: Newsroom, entityId: string | null, onSaved: SavedCallback, private readonly kind: "author" | "category") { super(newsroom, entityId, onSaved); }
  override async _prepareContext() { const state = await this.newsroom.getMasterState(); return { kind: this.kind, author: this.kind === "author" ? state.authors.find((value) => value.id === this.entityId) : null, category: this.kind === "category" ? state.categories.find((value) => value.id === this.entityId) : null, isNew: !this.entityId }; }
  protected override persist(data: FormData) {
    if (this.kind === "author") { const input: Partial<Author> = { name: text(data, "name"), title: text(data, "title"), portrait: text(data, "portrait"), portraitAlt: text(data, "portraitAlt"), bio: text(data, "bio"), sort: integer(data, "sort", 0) }; return this.entityId ? this.newsroom.updateAuthor(this.entityId, input) : this.newsroom.createAuthor(input); }
    const input: Partial<Category> = { name: text(data, "name"), color: text(data, "color"), sort: integer(data, "sort", 0) }; return this.entityId ? this.newsroom.updateCategory(this.entityId, input) : this.newsroom.createCategory(input);
  }
}

export class NewspaperSettingsEditorApp extends EditorialFormApp {
  static override DEFAULT_OPTIONS = { ...HoloNewsApplication.DEFAULT_OPTIONS, id: "holosuite-news-settings-editor", classes: ["hsn-window", "hsn-editor-window"], window: { title: "HoloNews — Configurações", icon: "fa-solid fa-sliders", resizable: true }, position: { width: 540, height: 620 } };
  static PARTS = { main: { template: `${TEMPLATE_ROOT}/gm/settings.hbs` } };
  constructor(newsroom: Newsroom, onSaved: SavedCallback) { super(newsroom, "settings", onSaved); }
  override async _prepareContext() { const state = await this.newsroom.getMasterState(); return { settings: state.settings, publications: state.publications }; }
  protected override async persist(data: FormData) {
    const input: Partial<NewsSettings> = { defaultPublicationId: nullable(data, "defaultPublicationId"), showViews: checked(data, "showViews"), showAuthors: checked(data, "showAuthors"), showDates: checked(data, "showDates"), showArchive: checked(data, "showArchive"), allowSearch: checked(data, "allowSearch"), showBadges: checked(data, "showBadges"), openLatestAutomatically: checked(data, "openLatestAutomatically"), markAsRead: checked(data, "markAsRead"), locale: text(data, "locale") || "pt-BR" };
    const saved = await this.newsroom.updateSettings(input);
    await Promise.all(Object.entries(input).filter(([key]) => key !== "defaultPublicationId").map(([key, value]) => game.settings.set(MODULE_ID, key, value)));
    return saved;
  }
}

function text(data: FormData, key: string): string { return String(data.get(key) ?? "").trim(); }
function nullable(data: FormData, key: string): string | null { return text(data, key) || null; }
function checked(data: FormData, key: string): boolean { return data.get(key) === "on" || data.get(key) === "true"; }
function integer(data: FormData, key: string, fallback: number): number { const value = Number(data.get(key)); return Number.isSafeInteger(value) && value >= 0 ? value : fallback; }
function csv(data: FormData, key: string): string[] { return text(data, key).split(",").map((value) => value.trim()).filter(Boolean); }
function values(data: FormData, key: string): string[] { return data.getAll(key).map(String); }
function visibility(data: FormData): Visibility { return { mode: (text(data, "visibilityMode") || "all") as Visibility["mode"], users: [...new Set(values(data, "visibilityUsers").flatMap((value) => value.split(",")).map((value) => value.trim()).filter(Boolean))] }; }
function visibilityUserChoices(rule: Visibility | undefined): Array<{ id: string; name: string; selected: boolean }> { return [...(game.users ?? [])].filter((user: any) => !user.isGM).map((user: any) => ({ id: String(user.id), name: String(user.name ?? user.id), selected: rule?.users.includes(String(user.id)) ?? false })); }
function timestamp(data: FormData, key: string): number | null { const value = text(data, key); if (!value) return null; const parsed = Date.parse(value); return Number.isFinite(parsed) ? parsed : null; }
function dateTimeLocal(value: number | null | undefined): string { if (!value || !Number.isFinite(value)) return ""; const date = new Date(value); const offset = date.getTimezoneOffset() * 60_000; return new Date(value - offset).toISOString().slice(0, 16); }
function updates(data: FormData, key: string): Article["updates"] {
  const raw = text(data, key);
  if (!raw) return [];
  const parsed = JSON.parse(raw) as unknown;
  if (!Array.isArray(parsed) || parsed.some((value) => !value || typeof value !== "object" || typeof value.time !== "string" || typeof value.title !== "string" || typeof value.body !== "string")) throw new Error("Atualizações devem ser um array JSON com time, title e body.");
  return parsed.map((value) => ({ time: String(value.time), title: String(value.title), body: String(value.body) }));
}
