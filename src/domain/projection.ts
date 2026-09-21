import { canUserSee } from "../permissions/authority";
import type { Article, Author, Category, Issue, MasterState, NewsSettings, Page, PageBlock, Publication, PublishedProjection, ReaderIdentity } from "./model";

function publicPublication(value: Publication): PublishedProjection["publications"][number] {
  return {
    id: value.id, name: value.name, shortName: value.shortName, description: value.description, logo: value.logo,
    icon: value.icon, themeId: value.themeId, enabled: value.enabled, sort: value.sort,
    defaultIssueLayout: value.defaultIssueLayout, primaryColor: value.primaryColor, secondaryColor: value.secondaryColor,
    editorName: value.editorName, location: value.location, price: value.price, slogan: value.slogan, periodicity: value.periodicity
  };
}

function publicIssue(value: Issue): PublishedProjection["issues"][number] {
  return {
    id: value.id, publicationId: value.publicationId, number: value.number, title: value.title, inWorldDate: value.inWorldDate,
    status: value.status, publishedAt: value.publishedAt, archivedAt: value.archivedAt, coverPageId: value.coverPageId,
    pageIds: [...value.pageIds], sort: value.sort
  };
}

function publicArticle(value: Article): PublishedProjection["articles"][number] {
  return {
    id: value.id, issueId: value.issueId, publicationId: value.publicationId, title: value.title, subtitle: value.subtitle,
    kicker: value.kicker, body: value.body, authorId: value.authorId, author: value.author, authorTitle: value.authorTitle,
    categoryId: value.categoryId, category: value.category, tags: [...value.tags], heroImage: value.heroImage,
    heroImageAlt: value.heroImageAlt, thumbnail: value.thumbnail, inWorldDate: value.inWorldDate, inWorldTime: value.inWorldTime,
    status: value.status, featured: value.featured, breaking: value.breaking, badge: value.badge, publicViews: value.publicViews,
    relatedArticleIds: [...value.relatedArticleIds], updates: value.updates.map((update) => ({ time: update.time, title: update.title, body: update.body })),
    sort: value.sort, publishedAt: value.publishedAt, archivedAt: value.archivedAt
  };
}

function publicBlock(value: PageBlock): PageBlock {
  return {
    id: value.id, type: value.type, sort: value.sort, articleId: value.articleId, authorId: value.authorId,
    title: value.title, body: value.body, image: value.image, alt: value.alt, link: value.link,
    emphasis: value.emphasis, span: value.span
  };
}

function publicPage(value: Page, visibleArticleIds: Set<string>): Page {
  return {
    id: value.id, issueId: value.issueId, pageNumber: value.pageNumber, title: value.title, layout: value.layout, sort: value.sort,
    blocks: value.blocks.filter((block) => !block.articleId || visibleArticleIds.has(block.articleId)).sort((a, b) => a.sort - b.sort).map(publicBlock)
  };
}

function publicAuthor(value: Author): Author {
  return { id: value.id, name: value.name, title: value.title, portrait: value.portrait, portraitAlt: value.portraitAlt, bio: value.bio, sort: value.sort };
}

function publicCategory(value: Category): Category {
  return { id: value.id, name: value.name, color: value.color, sort: value.sort };
}

function publicSettings(value: NewsSettings): NewsSettings {
  return {
    defaultPublicationId: value.defaultPublicationId, showViews: value.showViews, showAuthors: value.showAuthors,
    showDates: value.showDates, showArchive: value.showArchive, allowSearch: value.allowSearch, showBadges: value.showBadges,
    openLatestAutomatically: value.openLatestAutomatically, markAsRead: value.markAsRead, locale: value.locale
  };
}

export function buildPublishedProjection(state: MasterState, user: ReaderIdentity, at = Date.now()): PublishedProjection {
  const publications = state.publications
    .filter((value) => value.enabled && canUserSee(value.visibility, user))
    .sort((a, b) => a.sort - b.sort)
    .map(publicPublication);
  const publicationIds = new Set(publications.map((value) => value.id));
  const issues = state.issues
    .filter((value) => publicationIds.has(value.publicationId) && (value.status === "published" || value.status === "archived") && canUserSee(value.visibility, user))
    .sort((a, b) => b.number - a.number || a.sort - b.sort)
    .map(publicIssue);
  const issueIds = new Set(issues.map((value) => value.id));
  const candidateArticles = state.articles
    .filter((value) => issueIds.has(value.issueId) && (value.status === "published" || value.status === "archived") && canUserSee(value.visibility, user))
    .sort((a, b) => a.sort - b.sort)
    .map(publicArticle);
  const articleIds = new Set(candidateArticles.map((value) => value.id));
  const articles = candidateArticles.map((article) => ({ ...article, relatedArticleIds: article.relatedArticleIds.filter((id) => articleIds.has(id)) }));
  const pages = state.pages
    .filter((value) => issueIds.has(value.issueId))
    .sort((a, b) => a.sort - b.sort)
    .map((page) => publicPage(page, articleIds));
  const authorIds = new Set([
    ...articles.map((value) => value.authorId).filter((value): value is string => Boolean(value)),
    ...pages.flatMap((page) => page.blocks.map((block) => block.authorId).filter((value): value is string => Boolean(value)))
  ]);
  const categoryIds = new Set(articles.map((value) => value.categoryId).filter((value): value is string => Boolean(value)));
  const categoryNames = new Set(articles.map((article) => article.category).filter(Boolean));
  return {
    schemaVersion: state.schemaVersion,
    revision: state.projectionVersion,
    generatedAt: at,
    publications,
    issues,
    pages,
    articles,
    authors: state.authors.filter((value) => authorIds.has(value.id)).sort((a, b) => a.sort - b.sort).map(publicAuthor),
    categories: state.categories.filter((value) => categoryIds.has(value.id) || categoryNames.has(value.name)).sort((a, b) => a.sort - b.sort).map(publicCategory),
    settings: publicSettings(state.settings)
  };
}
