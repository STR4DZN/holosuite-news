import {
  hasChanges,
  statusOf,
  type Article,
  type NewsItem,
  type PortalBrand,
} from "../domain/model";
import { enrichSafeHtml, formatViews } from "../utils/format";
import { channelTone, readingLabel, authorInitials } from "./identity";
import { motionOptions, PRIORITIES, validateNewsMotion } from "../domain/news-motion";
export interface PortalRoute {
  articleId?: string;
  query: string;
  category: string;
  page: number;
}
export function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}
export async function articleContext(
  article: Article,
): Promise<Record<string, unknown>> {
  const motion = validateNewsMotion(article.motion, article.urgent);
  return {
    ...article,
    motion,
    priorityLabel: motion.priority === "normal" ? "" : PRIORITIES[motion.priority],
    tone: channelTone(article.category),
    readingLabel: readingLabel(article.body),
    authorInitials: authorInitials(article.author),
    bodyHtml: await enrichSafeHtml(article.body),
    viewsLabel: `${formatViews(article.views)} visualizações`,
  };
}
export async function portalContext(
  articles: Article[],
  brand: PortalBrand,
  route: PortalRoute,
): Promise<Record<string, unknown>> {
  const categories = [
    ...new Set(articles.map((article) => article.category).filter(Boolean)),
  ].sort((a, b) => a.localeCompare(b));
  const query = normalize(route.query);
  const filtered = articles.filter(
    (a) =>
      (!route.category || a.category === route.category) &&
      (!query ||
        normalize(
          [a.title, a.summary, a.category, a.author, ...a.tags].join(" "),
        ).includes(query)),
  );
  const pages = Math.max(1, Math.ceil(filtered.length / 12)),
    page = Math.max(1, Math.min(route.page, pages));
  const ordered =
    !route.query && !route.category
      ? [
          ...filtered.filter((a) => a.featured),
          ...filtered.filter((a) => !a.featured),
        ]
      : filtered;
  const sliced = ordered.slice((page - 1) * 12, page * 12);
  const card = (a: Article) => ({
    id: a.id,
    title: a.title,
    summary: a.summary,
    cover: a.cover,
    coverAlt: a.coverAlt,
    category: a.category,
    tone: channelTone(a.category),
    readingLabel: readingLabel(a.body),
    author: a.author,
    date: a.date,
    urgent: a.urgent,
    viewsLabel: formatViews(a.views),
  });
  const opened = route.articleId
    ? articles.find((a) => a.id === route.articleId)
    : null;
  return {
    brand: { ...brand, isHoloNews: brand.name === "HoloNews" },
    categories: categories.map((name) => ({
      name,
      tone: channelTone(name),
      active: name === route.category,
    })),
    allActive: !route.category,
    query: route.query,
    category: route.category,
    article: opened ? { ...(await articleContext(opened)), broadcastName: brand.name } : null,
    unavailable: !!route.articleId && !opened,
    isList: !route.articleId,
    lead:
      page === 1 && !route.query && !route.category && sliced[0]
        ? card(sliced[0])
        : null,
    cards: sliced
      .slice(page === 1 && !route.query && !route.category ? 1 : 0)
      .map(card),
    total: filtered.length,
    empty: !filtered.length,
    page,
    pages,
    pagination: pages > 1,
    hasPrev: page > 1,
    hasNext: page < pages,
    filtered: !!route.query || !!route.category,
  };
}
export function managerContext(
  items: NewsItem[],
  query: string,
  filter: string,
): Record<string, unknown> {
  const needle = normalize(query);
  const filtered = items.filter(
    (i) =>
      (!needle ||
        normalize(
          `${i.draft.title} ${i.draft.category} ${i.draft.author}`,
        ).includes(needle)) &&
      (filter === "all" ||
        (filter === "draft" && !i.published) ||
        (filter === "published" && !!i.published) ||
        (filter === "revision" && !!i.published && hasChanges(i)) ||
        (filter === "pending" && i.pending)),
  );
  filtered.sort((a, b) => b.updatedAt - a.updatedAt);
  return {
    query,
    filter,
    total: items.length,
    publishedCount: items.filter((i) => i.published).length,
    draftCount: items.filter((i) => !i.published).length,
    items: filtered.map((i) => ({
      id: i.id,
      title: i.draft.title || "Notícia sem título",
      category: i.draft.category,
      tone: channelTone(i.draft.category),
      cover: i.draft.cover,
      status: statusOf(i),
      published: !!i.published,
      pending: i.pending,
      views: formatViews(i.draft.views),
      date: i.draft.date,
    })),
    empty: !filtered.length,
  };
}
export function editorContext(
  item: NewsItem,
  users: Array<{ id: string; name: string }>,
  categories: string[],
): Record<string, unknown> {
  return {
    ...motionOptions(validateNewsMotion(item.draft.motion, item.draft.urgent)),
    item,
    article: { ...item.draft, notify: item.draft.notify !== false && validateNewsMotion(item.draft.motion, item.draft.urgent).alert !== "none" },
    notes: item.notes,
    status: statusOf(item),
    published: !!item.published,
    categories,
    users: users.map((u) => ({
      ...u,
      checked: item.draft.audience.users.includes(u.id),
    })),
  };
}
