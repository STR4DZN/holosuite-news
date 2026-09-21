import { HoloNewsError } from "./errors";
import { SCHEMA_VERSION, type Article, type MasterState, type PageBlock, type Visibility } from "./model";

const ISSUE_STATUSES = new Set(["draft", "scheduled", "published", "archived", "hidden"]);
const ARTICLE_STATUSES = ISSUE_STATUSES;
const VISIBILITY_MODES = new Set(["all", "gm-only", "specific-users", "exclude-users"]);
const BLOCK_TYPES = new Set(["headline", "article-preview", "article", "image", "quote", "short-news", "breaking-news", "advertisement", "classified", "editorial", "author-card", "stat-box", "timeline", "related-news", "divider", "custom-html"]);
const THEME_IDS = new Set(["classic", "modern", "corporate", "military", "underground", "tabloid", "terminal"]);
const COLOR_PATTERN = /^#[0-9a-f]{6}$/iu;
const URI_SCHEME_PATTERN = /^[a-z][a-z0-9+.-]*:/iu;
const COLLECTION_LIMITS = { publications: 100, issues: 10_000, pages: 20_000, articles: 50_000, authors: 5_000, categories: 5_000, templates: 1_000 } as const;
export const MAX_AUDIT_RECORDS = 10_000;

function invalid(message: string, details?: Record<string, unknown>): never {
  throw new HoloNewsError("NEWSPAPER_INVALID_DATA", message, details);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireString(value: unknown, label: string, max = 100_000): string {
  if (typeof value !== "string" || !value.trim() || value.length > max) invalid(`${label} must be a non-empty string within ${max} characters.`);
  return value;
}

function validateAssetReference(value: unknown, label: string): void {
  if (typeof value !== "string" || value.length > 4_096) invalid(`${label} has an invalid image reference.`);
  if (!value) return;
  const normalized = Array.from(value).filter((character) => (character.codePointAt(0) ?? 0) > 32).join("").toLowerCase();
  if (!normalized || normalized.startsWith("data:") || (URI_SCHEME_PATTERN.test(normalized) && !/^https?:/u.test(normalized))) invalid(`${label} has an invalid image reference.`);
}

function validateVisibility(value: unknown, label: string): asserts value is Visibility {
  if (!isRecord(value) || typeof value.mode !== "string" || !VISIBILITY_MODES.has(value.mode) || !Array.isArray(value.users) || value.users.length > 1_000 || value.users.some((id) => typeof id !== "string" || id.length > 200) || new Set(value.users).size !== value.users.length) invalid(`${label} has an invalid visibility rule.`);
}

function uniqueIds(items: unknown[], label: string): void {
  const ids = new Set<string>();
  for (const value of items) {
    if (!isRecord(value)) invalid(`${label} contains a non-object record.`);
    const id = requireString(value.id, `${label}.id`, 200);
    if (ids.has(id)) invalid(`${label} contains duplicate id ${id}.`);
    ids.add(id);
  }
}

function validateArticle(article: Article): void {
  requireString(article.id, "article.id", 200);
  requireString(article.publicationId, "article.publicationId", 200);
  requireString(article.issueId, "article.issueId", 200);
  requireString(article.title, "article.title", 500);
  if (typeof article.body !== "string" || article.body.length > 500_000) invalid("article.body exceeds the 500000 character limit.");
  if (!ARTICLE_STATUSES.has(article.status)) invalid(`Article ${article.id} has an invalid status.`);
  if (!Number.isSafeInteger(article.publicViews) || article.publicViews < 0) invalid(`Article ${article.id} has invalid Narrative views.`);
  if (!Array.isArray(article.tags) || article.tags.some((value) => typeof value !== "string") || article.tags.length > 100) invalid(`Article ${article.id} has invalid tags.`);
  if (!Array.isArray(article.relatedArticleIds) || article.relatedArticleIds.some((value) => typeof value !== "string")) invalid(`Article ${article.id} has invalid related Articles.`);
  if (!Array.isArray(article.updates) || article.updates.length > 100 || article.updates.some((value) => typeof value?.time !== "string" || typeof value?.title !== "string" || typeof value?.body !== "string" || value.body.length > 100_000)) invalid(`Article ${article.id} has invalid updates.`);
  validateVisibility(article.visibility, `article ${article.id}`);
  validateAssetReference(article.heroImage, `article ${article.id}.heroImage`);
  validateAssetReference(article.thumbnail, `article ${article.id}.thumbnail`);
}

function validateBlockShape(block: PageBlock, label: string): void {
  if (!BLOCK_TYPES.has(block.type) || !Number.isSafeInteger(block.sort) || (block.span !== undefined && ![1, 2, 3].includes(block.span))) invalid(`${label} is invalid.`);
  if (block.body !== undefined && (typeof block.body !== "string" || block.body.length > 100_000)) invalid(`${label} has oversized body content.`);
  if (block.image !== undefined) validateAssetReference(block.image, `${label}.image`);
  if (block.link !== undefined && (typeof block.link !== "string" || block.link.length > 4_096)) invalid(`${label} has an invalid link.`);
}

export function validateMasterState(state: MasterState): MasterState {
  if (state.schemaVersion !== SCHEMA_VERSION) invalid(`Unsupported schema version ${String(state.schemaVersion)}.`);
  for (const key of ["publications", "issues", "pages", "articles", "authors", "categories", "templates"] as const) {
    if (!Array.isArray(state[key])) invalid(`${key} must be an array.`);
    if (state[key].length > COLLECTION_LIMITS[key]) invalid(`${key} exceeds the defensive limit of ${COLLECTION_LIMITS[key]} records.`);
    uniqueIds(state[key] as unknown[], key);
  }
  if (!Number.isSafeInteger(state.revision) || state.revision < 0) invalid("revision must be a non-negative integer.");
  if (!Number.isSafeInteger(state.projectionVersion) || state.projectionVersion < 0) invalid("projectionVersion must be a non-negative integer.");
  for (const publication of state.publications) {
    requireString(publication.name, `publication ${publication.id}.name`, 300);
    if (!COLOR_PATTERN.test(publication.primaryColor) || !COLOR_PATTERN.test(publication.secondaryColor)) invalid(`Publication ${publication.id} has an invalid color.`);
    if (!THEME_IDS.has(publication.themeId)) invalid(`Publication ${publication.id} has an invalid theme.`);
    validateAssetReference(publication.logo, `publication ${publication.id}.logo`);
    validateVisibility(publication.visibility, `publication ${publication.id}`);
  }
  const publicationIds = new Set(state.publications.map((value) => value.id));
  const issueIds = new Set(state.issues.map((value) => value.id));
  const pageIds = new Set(state.pages.map((value) => value.id));
  const issueById = new Map(state.issues.map((value) => [value.id, value]));
  const pageById = new Map(state.pages.map((value) => [value.id, value]));
  const articleById = new Map(state.articles.map((value) => [value.id, value]));
  const authorIds = new Set(state.authors.map((value) => value.id));
  const categoryIds = new Set(state.categories.map((value) => value.id));
  const articleIds = new Set(articleById.keys());
  for (const issue of state.issues) {
    if (!publicationIds.has(issue.publicationId)) invalid(`Issue ${issue.id} references a missing Publication.`);
    if (!ISSUE_STATUSES.has(issue.status)) invalid(`Issue ${issue.id} has an invalid status.`);
    if (!Number.isSafeInteger(issue.number) || issue.number < 0 || (issue.scheduledAt !== null && !Number.isFinite(issue.scheduledAt))) invalid(`Issue ${issue.id} has invalid numbering or scheduling.`);
    if (issue.status === "scheduled" && issue.scheduledAt === null) invalid(`Issue ${issue.id} is scheduled without a publication time.`);
    validateVisibility(issue.visibility, `issue ${issue.id}`);
    if (!Array.isArray(issue.pageIds) || issue.pageIds.length > 500 || new Set(issue.pageIds).size !== issue.pageIds.length) invalid(`Issue ${issue.id} has invalid Page references.`);
    if (issue.pageIds.some((id) => !pageIds.has(id))) invalid(`Issue ${issue.id} references a missing Page.`);
    if (issue.pageIds.some((id) => pageById.get(id)?.issueId !== issue.id)) invalid(`Issue/Page graph is inconsistent for Issue ${issue.id}.`);
    if (issue.coverPageId !== null && (!issue.pageIds.includes(issue.coverPageId) || pageById.get(issue.coverPageId)?.issueId !== issue.id)) invalid(`Issue ${issue.id} has an invalid cover Page.`);
  }
  for (const page of state.pages) {
    if (!issueIds.has(page.issueId)) invalid(`Page ${page.id} references a missing Issue.`);
    const owner = issueById.get(page.issueId);
    if (!owner?.pageIds.includes(page.id)) invalid(`Issue/Page graph is inconsistent for Page ${page.id}.`);
    if (!Number.isSafeInteger(page.pageNumber) || page.pageNumber < 1 || !Array.isArray(page.blocks) || page.blocks.length > 500) invalid(`Page ${page.id} is malformed.`);
    uniqueIds(page.blocks, `page ${page.id}.blocks`);
    for (const block of page.blocks) {
      validateBlockShape(block, `Page ${page.id} block ${block.id}`);
      const linked = block.articleId ? articleById.get(block.articleId) : null;
      if (block.articleId && (!linked || linked.issueId !== page.issueId)) invalid(`Page ${page.id} contains a cross-Issue Article block.`);
    }
  }
  for (const page of state.pages) for (const block of page.blocks) if (block.authorId && !authorIds.has(block.authorId)) invalid(`Page ${page.id} references a missing Author.`);
  for (const article of state.articles) {
    validateArticle(article);
    if (!publicationIds.has(article.publicationId) || !issueIds.has(article.issueId)) invalid(`Article ${article.id} has a missing Publication or Issue.`);
    const issue = issueById.get(article.issueId);
    if (issue?.publicationId !== article.publicationId) invalid(`Article ${article.id} belongs to a mismatched Publication.`);
    if (article.authorId && !authorIds.has(article.authorId)) invalid(`Article ${article.id} references a missing Author.`);
    if (article.categoryId && !categoryIds.has(article.categoryId)) invalid(`Article ${article.id} references a missing Category.`);
    if (article.relatedArticleIds.some((id) => !articleIds.has(id))) invalid(`Article ${article.id} references a missing related Article.`);
  }
  for (const author of state.authors) {
    requireString(author.name, `author ${author.id}.name`, 300);
    validateAssetReference(author.portrait, `author ${author.id}.portrait`);
  }
  for (const category of state.categories) {
    requireString(category.name, `category ${category.id}.name`, 300);
    if (!COLOR_PATTERN.test(category.color)) invalid(`Category ${category.id} has an invalid color.`);
  }
  for (const template of state.templates) {
    requireString(template.name, `template ${template.id}.name`, 300);
    if (template.publicationId !== null && !publicationIds.has(template.publicationId)) invalid(`Template ${template.id} references a missing Publication.`);
    if (!Array.isArray(template.pages) || template.pages.length > 500) invalid(`Template ${template.id} has invalid Pages.`);
    for (const [pageIndex, page] of template.pages.entries()) {
      if (!Array.isArray(page.blocks) || page.blocks.length > 500) invalid(`Template ${template.id} Page ${pageIndex + 1} has invalid blocks.`);
      uniqueIds(page.blocks, `template ${template.id}.page ${pageIndex + 1}.blocks`);
      for (const block of page.blocks) {
        validateBlockShape(block, `Template ${template.id} block ${block.id}`);
        if (block.articleId) invalid(`Template ${template.id} contains a live Article reference.`);
        if (block.authorId && !authorIds.has(block.authorId)) invalid(`Template ${template.id} references a missing Author.`);
        if (block.image !== undefined) validateAssetReference(block.image, `template ${template.id}.block ${block.id}.image`);
      }
    }
  }
  if (!isRecord(state.readership) || !Array.isArray(state.auditLog) || !isRecord(state.settings)) invalid("Administrative state is malformed.");
  const settingKeys = new Set(["defaultPublicationId", "showViews", "showAuthors", "showDates", "showArchive", "allowSearch", "showBadges", "openLatestAutomatically", "markAsRead", "locale"]);
  if (Object.keys(state.settings).some((key) => !settingKeys.has(key))) invalid("Settings contain unknown fields.");
  if (state.settings.defaultPublicationId !== null && !publicationIds.has(state.settings.defaultPublicationId)) invalid("The default Publication does not exist.");
  for (const key of ["showViews", "showAuthors", "showDates", "showArchive", "allowSearch", "showBadges", "openLatestAutomatically", "markAsRead"] as const) if (typeof state.settings[key] !== "boolean") invalid(`Setting ${key} must be boolean.`);
  requireString(state.settings.locale, "settings.locale", 50);
  if (Object.keys(state.readership).length > COLLECTION_LIMITS.articles || state.auditLog.length > MAX_AUDIT_RECORDS) invalid("Administrative state exceeds defensive limits.");
  for (const [articleId, readers] of Object.entries(state.readership)) {
    if (!articleIds.has(articleId) || !isRecord(readers) || Object.keys(readers).length > 10_000) invalid(`Readership for ${articleId} is malformed.`);
    for (const record of Object.values(readers)) {
      if (!isRecord(record) || !Number.isFinite(record.firstReadAt) || !Number.isFinite(record.lastReadAt) || !Number.isSafeInteger(record.readCount) || record.readCount < 1) invalid(`Readership for ${articleId} is malformed.`);
    }
  }
  return state;
}

export function validateImport(value: unknown): MasterState {
  if (!isRecord(value)) invalid("Backup root must be an object.");
  const clone = structuredClone(value) as unknown as MasterState;
  return validateMasterState(clone);
}
