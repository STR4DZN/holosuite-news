import { defaultNewsMotion, type NewsMotion } from "./news-motion";
export interface Audience {
  mode: "all" | "selected" | "gm";
  users: string[];
}
export interface Article {
  id: string;
  title: string;
  summary: string;
  body: string;
  cover: string;
  coverAlt: string;
  category: string;
  author: string;
  date: string;
  tags: string[];
  featured: boolean;
  urgent: boolean;
  views: number;
  audience: Audience;
  motion?: NewsMotion;
}
export interface NewsItem {
  schemaVersion: 2;
  id: string;
  revision: number;
  draft: Article;
  notes: string;
  published: Article | null;
  publishedAt: number | null;
  updatedAt: number;
  pending: boolean;
  sourceId?: string;
}
export interface PortalBrand {
  name: string;
  tagline: string;
  location: string;
}
export interface Backup {
  format: "holonews";
  schemaVersion: 2;
  exportedAt: number;
  items: NewsItem[];
}
export interface Identity {
  id: string;
  isGM: boolean;
}

export function newArticle(id: string): Article {
  return {
    id,
    title: "",
    summary: "",
    body: "",
    cover: "",
    coverAlt: "",
    category: "Geral",
    author: "",
    date: "",
    tags: [],
    featured: false,
    urgent: false,
    views: 0,
    audience: { mode: "all", users: [] },
    motion: defaultNewsMotion(),
  };
}
export function newItem(id: string, now = Date.now()): NewsItem {
  return {
    schemaVersion: 2,
    id,
    revision: 0,
    draft: newArticle(id),
    notes: "",
    published: null,
    publishedAt: null,
    updatedAt: now,
    pending: false,
  };
}
export function canRead(article: Article, user: Identity): boolean {
  return (
    user.isGM ||
    article.audience.mode === "all" ||
    (article.audience.mode === "selected" &&
      article.audience.users.includes(user.id))
  );
}
export function hasChanges(item: NewsItem): boolean {
  return (
    !item.published ||
    JSON.stringify(item.draft) !== JSON.stringify(item.published)
  );
}
export function statusOf(item: NewsItem): string {
  return item.pending
    ? "Sincronização pendente"
    : !item.published
      ? "Rascunho"
      : hasChanges(item)
        ? "Publicada · revisão em rascunho"
        : "Publicada";
}
