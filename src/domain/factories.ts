import { SCHEMA_VERSION, type Article, type Author, type Category, type Issue, type IssueTemplate, type MasterState, type Page, type Publication, type Visibility } from "./model";

const now = () => Date.now();

export function createId(prefix: string): string {
  const uuid = globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}-${uuid}`;
}

export function createVisibility(input: Partial<Visibility> = {}): Visibility {
  return { mode: input.mode ?? "all", users: [...(input.users ?? [])] };
}

export function createEmptyState(): MasterState {
  return {
    schemaVersion: SCHEMA_VERSION,
    revision: 0,
    projectionVersion: 0,
    publications: [], issues: [], pages: [], articles: [], authors: [], categories: [], templates: [],
    readership: {}, auditLog: [],
    settings: {
      defaultPublicationId: null,
      showViews: true,
      showAuthors: true,
      showDates: true,
      showArchive: true,
      allowSearch: true,
      showBadges: true,
      openLatestAutomatically: true,
      markAsRead: true,
      locale: "pt-BR"
    }
  };
}

export function createPublication(input: Partial<Publication> = {}): Publication {
  const at = now();
  const name = input.name?.trim() || "Nova publicação";
  return {
    id: input.id ?? createId("publication"), name, shortName: input.shortName?.trim() || name.slice(0, 3).toUpperCase(),
    description: input.description ?? "", logo: input.logo ?? "", icon: input.icon ?? "fa-solid fa-newspaper",
    themeId: input.themeId ?? "classic", enabled: input.enabled ?? true, sort: input.sort ?? 0,
    defaultIssueLayout: input.defaultIssueLayout ?? "frontpage-a", primaryColor: input.primaryColor ?? "#8f1d1d",
    secondaryColor: input.secondaryColor ?? "#171717", editorName: input.editorName ?? "", location: input.location ?? "",
    price: input.price ?? "", slogan: input.slogan ?? "", periodicity: input.periodicity ?? "",
    visibility: createVisibility(input.visibility), createdAt: input.createdAt ?? at, updatedAt: input.updatedAt ?? at
  };
}

export function createIssue(input: Partial<Issue> & Pick<Issue, "publicationId"> = { publicationId: "" }): Issue {
  const at = now();
  const number = Number.isInteger(input.number) ? Number(input.number) : 1;
  return {
    id: input.id ?? createId("issue"), publicationId: input.publicationId, number,
    title: input.title?.trim() || `Edição ${number}`, inWorldDate: input.inWorldDate ?? "", status: input.status ?? "draft",
    publishedAt: input.publishedAt ?? null, archivedAt: input.archivedAt ?? null, scheduledAt: input.scheduledAt ?? null,
    coverPageId: input.coverPageId ?? null, pageIds: [...(input.pageIds ?? [])], visibility: createVisibility(input.visibility),
    sort: input.sort ?? number, createdAt: input.createdAt ?? at, updatedAt: input.updatedAt ?? at
  };
}

export function createPage(input: Partial<Page> & Pick<Page, "issueId"> = { issueId: "" }): Page {
  const pageNumber = Number.isInteger(input.pageNumber) ? Number(input.pageNumber) : 1;
  return {
    id: input.id ?? createId("page"), issueId: input.issueId, pageNumber,
    title: input.title?.trim() || (pageNumber === 1 ? "Capa" : `Página ${pageNumber}`),
    layout: input.layout ?? (pageNumber === 1 ? "frontpage-a" : "two-column"),
    blocks: (input.blocks ?? []).map((block) => ({ ...block })), sort: input.sort ?? pageNumber
  };
}

export function createArticle(input: Partial<Article> & Pick<Article, "publicationId" | "issueId"> = { publicationId: "", issueId: "" }): Article {
  const at = now();
  return {
    id: input.id ?? createId("article"), issueId: input.issueId, publicationId: input.publicationId,
    title: input.title?.trim() || "Nova matéria", subtitle: input.subtitle ?? "", kicker: input.kicker ?? "", body: input.body ?? "",
    authorId: input.authorId ?? null, author: input.author ?? "", authorTitle: input.authorTitle ?? "",
    categoryId: input.categoryId ?? null, category: input.category ?? "", tags: [...(input.tags ?? [])],
    heroImage: input.heroImage ?? "", heroImageAlt: input.heroImageAlt ?? "", thumbnail: input.thumbnail ?? "",
    inWorldDate: input.inWorldDate ?? "", inWorldTime: input.inWorldTime ?? "", status: input.status ?? "draft",
    featured: input.featured ?? false, breaking: input.breaking ?? false, badge: input.badge ?? "",
    visibility: createVisibility(input.visibility), publicViews: input.publicViews ?? 0,
    relatedArticleIds: [...(input.relatedArticleIds ?? [])], updates: (input.updates ?? []).map((update) => ({ ...update })),
    gmNotes: input.gmNotes ?? "", sort: input.sort ?? 0, createdAt: input.createdAt ?? at, updatedAt: input.updatedAt ?? at,
    publishedAt: input.publishedAt ?? null, archivedAt: input.archivedAt ?? null
  };
}

export function createAuthor(input: Partial<Author> = {}): Author {
  return { id: input.id ?? createId("author"), name: input.name?.trim() || "Novo autor", title: input.title ?? "", portrait: input.portrait ?? "", portraitAlt: input.portraitAlt ?? "", bio: input.bio ?? "", sort: input.sort ?? 0 };
}

export function createCategory(input: Partial<Category> = {}): Category {
  return { id: input.id ?? createId("category"), name: input.name?.trim() || "Nova categoria", color: input.color ?? "#8f1d1d", sort: input.sort ?? 0 };
}

export function createIssueTemplate(input: Partial<IssueTemplate> = {}): IssueTemplate {
  return { id: input.id ?? createId("template"), name: input.name?.trim() || "Novo modelo", publicationId: input.publicationId ?? null, layout: input.layout ?? "frontpage-a", pages: (input.pages ?? []).map((page) => structuredClone(page)) };
}
