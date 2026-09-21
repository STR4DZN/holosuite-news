import { MODULE_ID, READ_SIGNAL_FLAG, SOCKET_NAME, TEMPLATE_ROOT } from "../constants";
import type { HoloNewsApi } from "../api/public-api";
import type { PublicArticle, PublishedProjection } from "../domain/model";
import { countUnread, getLocalReadState, isArticleRead, markArticleRead, markIssueRead } from "../services/read-state";
import { getClientPreferences } from "../settings";
import { enrichSafeHtml, formatViews, safeCssColor, stripHtml } from "../utils/format";
import { HoloNewsApplication } from "./base";

export interface ReaderRoute { view: "home" | "issue" | "article" | "archive" | "search" | "category"; publicationId?: string; issueId?: string; pageId?: string; articleId?: string; categoryId?: string; query?: string; }

export class NewspaperReaderApp extends HoloNewsApplication {
  static override DEFAULT_OPTIONS = {
    ...HoloNewsApplication.DEFAULT_OPTIONS,
    id: "holosuite-news-reader",
    classes: ["hsn-window", "hsn-reader-window"],
    window: { title: "HoloNews", icon: "fa-solid fa-newspaper", resizable: true },
    position: { width: 430, height: 760 }
  };
  static PARTS = { main: { template: `${TEMPLATE_ROOT}/reader/reader.hbs` } };

  private route: ReaderRoute = { view: "home" };
  private backStack: ReaderRoute[] = [];
  private forwardStack: ReaderRoute[] = [];
  constructor(private readonly api: HoloNewsApi, route?: Partial<ReaderRoute>, options: object = {}) {
    super(options);
    if (route?.view) this.route = { view: route.view as ReaderRoute["view"], publicationId: route.publicationId, issueId: route.issueId, pageId: route.pageId, articleId: route.articleId, categoryId: route.categoryId, query: route.query };
  }

  navigate(route: ReaderRoute, push = true): void {
    if (push) { this.backStack.push(this.route); this.forwardStack = []; }
    this.route = route;
    void this.rerender();
  }

  async openRoute(route?: Partial<ReaderRoute>): Promise<this> {
    if (route?.view) this.route = { view: route.view as ReaderRoute["view"], publicationId: route.publicationId, issueId: route.issueId, pageId: route.pageId, articleId: route.articleId, categoryId: route.categoryId, query: route.query };
    await (this as any).render({ force: true });
    return this;
  }

  override async _prepareContext(): Promise<Record<string, unknown>> {
    const projection = await this.api.getProjection();
    const preferences = getClientPreferences();
    if (!projection || projection.publications.length === 0 || projection.issues.length === 0) {
      return { empty: true, route: this.route, isGMPreview: game.user?.isGM === true, preferences };
    }
    if (this.route.view === "archive" && !projection.settings.showArchive) this.route = { view: "home", publicationId: this.route.publicationId };
    if (this.route.view === "search" && !projection.settings.allowSearch) this.route = { view: "home", publicationId: this.route.publicationId };
    const state = getLocalReadState();
    const routedIssue = projection.issues.find((value) => value.id === this.route.issueId);
    const preferredPublicationId = routedIssue?.publicationId ?? this.route.publicationId ?? projection.settings.defaultPublicationId;
    let publication = projection.publications.find((value) => value.id === preferredPublicationId) ?? projection.publications[0]!;
    if (!projection.issues.some((value) => value.publicationId === publication.id)) {
      const fallbackPublicationId = projection.issues[0]?.publicationId;
      publication = projection.publications.find((value) => value.id === fallbackPublicationId) ?? publication;
    }
    const publicationIssues = projection.issues.filter((value) => value.publicationId === publication.id);
    const latestIssue = publicationIssues.find((value) => value.status === "published") ?? publicationIssues[0];
    const issue = projection.issues.find((value) => value.id === this.route.issueId) ?? latestIssue;
    const issueArticles = projection.articles.filter((value) => value.issueId === issue?.id).map((article) => decorateArticle(article, projection, state));
    const article = projection.articles.find((value) => value.id === this.route.articleId);
    const decoratedArticle = article ? decorateArticle(article, projection, state) : null;
    const currentPage = projection.pages.find((value) => value.id === this.route.pageId && value.issueId === issue?.id) ?? projection.pages.find((value) => value.id === issue?.coverPageId) ?? projection.pages.find((value) => value.issueId === issue?.id);
    const headlineId = currentPage?.blocks.find((value) => value.type === "headline")?.articleId;
    const headline = issueArticles.find((value) => value.id === headlineId) ?? issueArticles.find((value) => value.featured) ?? issueArticles[0];
    const query = projection.settings.allowSearch ? (this.route.query ?? "").trim().toLocaleLowerCase(projection.settings.locale) : "";
    const searchResults = query ? projection.articles.filter((value) => value.status !== "hidden" && [value.title, value.subtitle, stripHtml(value.body), value.author, value.category, value.tags.join(" ")].join(" ").toLocaleLowerCase(projection.settings.locale).includes(query)).map((value) => decorateArticle(value, projection, state)) : [];
    const categoryArticles = this.route.categoryId ? projection.articles.filter((value) => value.categoryId === this.route.categoryId).map((value) => decorateArticle(value, projection, state)) : [];
    const related = decoratedArticle ? decoratedArticle.relatedArticleIds.map((id) => projection.articles.find((value) => value.id === id)).filter((value): value is PublicArticle => Boolean(value)).map((value) => decorateArticle(value, projection, state)) : [];
    const bodyHtml = decoratedArticle ? await enrichSafeHtml(decoratedArticle.body) : "";
    const updates = decoratedArticle ? await Promise.all(decoratedArticle.updates.map(async (value) => ({ ...value, bodyHtml: await enrichSafeHtml(value.body) }))) : [];
    const pageBlocks = await Promise.all((currentPage?.blocks ?? []).map(async (block) => {
      const linked = block.articleId ? projection.articles.find((value) => value.id === block.articleId) : null;
      const author = block.authorId ? projection.authors.find((value) => value.id === block.authorId) : null;
      return {
        ...block,
        span: block.span ?? 1,
        article: linked ? decorateArticle(linked, projection, state) : null,
        author,
        authorBioHtml: author?.bio ? await enrichSafeHtml(author.bio) : "",
        bodyHtml: block.body ? await enrichSafeHtml(block.body) : "",
        linkHtml: block.link ? await enrichSafeHtml(block.link) : ""
      };
    }));
    const category = projection.categories.find((value) => value.id === this.route.categoryId) ?? null;
    return {
      empty: false, route: this.route, projection, publication, publications: projection.publications, hasMultiplePublications: projection.publications.length > 1, issue, latestIssue, issues: publicationIssues,
      pages: projection.pages.filter((value) => value.issueId === issue?.id).sort((left, right) => left.sort - right.sort), currentPage, pageBlocks,
      articles: issueArticles, headline, secondary: issueArticles.filter((value) => value.id !== headline?.id),
      article: decoratedArticle ? { ...decoratedArticle, bodyHtml, updates } : null, related,
      searchResults, categoryArticles, category, categories: projection.categories, preferences,
      unreadCount: projection.settings.markAsRead && latestIssue && !state.issues[latestIssue.id] ? countUnread(projection.articles.filter((value) => value.issueId === latestIssue.id).map((value) => value.id), state) : 0,
      canBack: this.backStack.length > 0, canForward: this.forwardStack.length > 0,
      isGMPreview: game.user?.isGM === true,
      readerStyle: `--hsn-font-scale:${preferences.fontScale};--hsn-signal:${safeCssColor(publication.primaryColor, "#8f1d1d")};--hsn-rule:${safeCssColor(publication.secondaryColor, "#28251f")}`,
      readerClasses: `${preferences.reduceMotion ? "hsn-reduce-motion" : ""} ${preferences.highContrast ? "hsn-high-contrast" : ""}`
    };
  }

  protected override bind(root: HTMLElement): void {
    root.querySelectorAll<HTMLElement>("[data-hsn-action]").forEach((element) => element.addEventListener("click", (event) => void this.onAction(event)));
    root.querySelector<HTMLFormElement>("[data-hsn-search]")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const query = String(new FormData(event.currentTarget as HTMLFormElement).get("query") ?? "");
      this.navigate({ view: "search", query });
    });
    root.addEventListener("keydown", (event) => { if (event.key === "Escape" && this.backStack.length) { event.preventDefault(); this.goBack(); } });
    root.querySelector<HTMLElement>("[data-hsn-focus]")?.focus({ preventScroll: true });
  }

  private async onAction(event: Event): Promise<void> {
    const target = event.currentTarget as HTMLElement;
    const action = target.dataset.hsnAction;
    if (action === "home") this.navigate({ view: "home", publicationId: this.route.publicationId });
    if (action === "publication" && target.dataset.publicationId) this.navigate({ view: "home", publicationId: target.dataset.publicationId });
    if (action === "archive") this.navigate({ view: "archive", publicationId: this.route.publicationId });
    if (action === "issue" && target.dataset.issueId) { await this.markIssueIfEnabled(target.dataset.issueId); this.navigate({ view: "issue", publicationId: target.dataset.publicationId ?? this.route.publicationId, issueId: target.dataset.issueId }); }
    if (action === "page" && target.dataset.issueId && target.dataset.pageId) { await this.markIssueIfEnabled(target.dataset.issueId); this.navigate({ view: "issue", publicationId: this.route.publicationId, issueId: target.dataset.issueId, pageId: target.dataset.pageId }); }
    if (action === "category" && target.dataset.categoryId) this.navigate({ view: "category", publicationId: this.route.publicationId, categoryId: target.dataset.categoryId });
    if (action === "article" && target.dataset.articleId) await this.openArticle(target.dataset.articleId);
    if (action === "back") this.goBack();
    if (action === "forward") this.goForward();
  }

  private async openArticle(articleId: string): Promise<void> {
    const projection = await this.api.getProjection();
    const article = projection?.articles.find((value) => value.id === articleId);
    if (!article) return;
    if (projection?.settings.markAsRead) await markArticleRead(articleId, article.issueId);
    Hooks.callAll?.("newspaperArticleOpened", article);
    const signal = { articleId, nonce: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`, at: Date.now() };
    if (!game.user?.isGM) {
      try { await game.user.setFlag(MODULE_ID, READ_SIGNAL_FLAG, signal); }
      catch (error) { console.warn(`${MODULE_ID} | Table-read signal will retry when a GM is available.`, error); }
      game.socket?.emit?.(SOCKET_NAME, { type: "ARTICLE_OPENED", articleId, nonce: signal.nonce });
    }
    this.navigate({ view: "article", publicationId: article.publicationId, issueId: article.issueId, articleId });
  }

  private async markIssueIfEnabled(issueId: string): Promise<void> {
    const projection = await this.api.getProjection();
    if (projection?.settings.markAsRead) await markIssueRead(issueId);
  }

  private goBack(): void { const previous = this.backStack.pop(); if (!previous) return; this.forwardStack.push(this.route); this.route = previous; void this.rerender(); }
  private goForward(): void { const next = this.forwardStack.pop(); if (!next) return; this.backStack.push(this.route); this.route = next; void this.rerender(); }
}

function decorateArticle(article: PublicArticle, projection: PublishedProjection, state: ReturnType<typeof getLocalReadState>) {
  const author = article.authorId ? projection.authors.find((value) => value.id === article.authorId) : null;
  const category = article.categoryId ? projection.categories.find((value) => value.id === article.categoryId) : null;
  return { ...article, authorName: author?.name || article.author, authorRole: author?.title || article.authorTitle, categoryName: category?.name || article.category, viewsLabel: formatViews(article.publicViews, projection.settings.locale), isRead: isArticleRead(article.id, state) };
}
