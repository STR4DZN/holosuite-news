export const SCHEMA_VERSION = 1 as const;

export type VisibilityMode = "all" | "gm-only" | "specific-users" | "exclude-users";
export type IssueStatus = "draft" | "scheduled" | "published" | "archived" | "hidden";
export type ArticleStatus = "draft" | "scheduled" | "published" | "archived" | "hidden";
export type ThemeId = "classic" | "modern" | "corporate" | "military" | "underground" | "tabloid" | "terminal";
export type BlockType = "headline" | "article-preview" | "article" | "image" | "quote" | "short-news" | "breaking-news" | "advertisement" | "classified" | "editorial" | "author-card" | "stat-box" | "timeline" | "related-news" | "divider" | "custom-html";

export interface Visibility {
  mode: VisibilityMode;
  users: string[];
}

export interface Publication {
  id: string;
  name: string;
  shortName: string;
  description: string;
  logo: string;
  icon: string;
  themeId: ThemeId;
  enabled: boolean;
  sort: number;
  defaultIssueLayout: string;
  primaryColor: string;
  secondaryColor: string;
  editorName: string;
  location: string;
  price: string;
  slogan: string;
  periodicity: string;
  visibility: Visibility;
  createdAt: number;
  updatedAt: number;
}

export interface Issue {
  id: string;
  publicationId: string;
  number: number;
  title: string;
  inWorldDate: string;
  status: IssueStatus;
  publishedAt: number | null;
  archivedAt: number | null;
  scheduledAt: number | null;
  coverPageId: string | null;
  pageIds: string[];
  visibility: Visibility;
  sort: number;
  createdAt: number;
  updatedAt: number;
}

export interface PageBlock {
  id: string;
  type: BlockType;
  sort: number;
  articleId?: string;
  authorId?: string;
  title?: string;
  body?: string;
  image?: string;
  alt?: string;
  link?: string;
  emphasis?: "headline" | "secondary" | "tertiary" | "standard";
  span?: 1 | 2 | 3;
}

export interface Page {
  id: string;
  issueId: string;
  pageNumber: number;
  title: string;
  layout: string;
  blocks: PageBlock[];
  sort: number;
}

export interface ArticleUpdate {
  time: string;
  title: string;
  body: string;
}

export interface Article {
  id: string;
  issueId: string;
  publicationId: string;
  title: string;
  subtitle: string;
  kicker: string;
  body: string;
  authorId: string | null;
  author: string;
  authorTitle: string;
  categoryId: string | null;
  category: string;
  tags: string[];
  heroImage: string;
  heroImageAlt: string;
  thumbnail: string;
  inWorldDate: string;
  inWorldTime: string;
  status: ArticleStatus;
  featured: boolean;
  breaking: boolean;
  badge: string;
  visibility: Visibility;
  publicViews: number;
  relatedArticleIds: string[];
  updates: ArticleUpdate[];
  gmNotes: string;
  sort: number;
  createdAt: number;
  updatedAt: number;
  publishedAt: number | null;
  archivedAt: number | null;
}

export interface Author {
  id: string;
  name: string;
  title: string;
  portrait: string;
  portraitAlt: string;
  bio: string;
  sort: number;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  sort: number;
}

export interface IssueTemplate {
  id: string;
  name: string;
  publicationId: string | null;
  layout: string;
  pages: Array<Omit<Page, "id" | "issueId">>;
}

export interface ReadRecord {
  firstReadAt: number;
  lastReadAt: number;
  readCount: number;
}

export interface AuditRecord {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  at: number;
}

export interface NewsSettings {
  defaultPublicationId: string | null;
  showViews: boolean;
  showAuthors: boolean;
  showDates: boolean;
  showArchive: boolean;
  allowSearch: boolean;
  showBadges: boolean;
  openLatestAutomatically: boolean;
  markAsRead: boolean;
  locale: string;
}

export interface MasterState {
  schemaVersion: typeof SCHEMA_VERSION;
  revision: number;
  projectionVersion: number;
  publications: Publication[];
  issues: Issue[];
  pages: Page[];
  articles: Article[];
  authors: Author[];
  categories: Category[];
  templates: IssueTemplate[];
  readership: Record<string, Record<string, ReadRecord>>;
  auditLog: AuditRecord[];
  settings: NewsSettings;
}

export interface PublicPublication extends Omit<Publication, "visibility" | "createdAt" | "updatedAt"> {}
export interface PublicIssue extends Omit<Issue, "visibility" | "scheduledAt" | "createdAt" | "updatedAt"> {}
export interface PublicArticle extends Omit<Article, "visibility" | "gmNotes" | "createdAt" | "updatedAt"> {}

export interface PublishedProjection {
  schemaVersion: typeof SCHEMA_VERSION;
  revision: number;
  generatedAt: number;
  publications: PublicPublication[];
  issues: PublicIssue[];
  pages: Page[];
  articles: PublicArticle[];
  authors: Author[];
  categories: Category[];
  settings: NewsSettings;
}

export interface ReaderIdentity {
  id: string;
  isGM: boolean;
  name?: string;
}
