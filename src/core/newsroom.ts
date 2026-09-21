import { HoloNewsError } from "../domain/errors";
import { createArticle, createAuthor, createCategory, createIssue, createIssueTemplate, createPage, createPublication, createId } from "../domain/factories";
import type { Article, Author, Category, Issue, IssueTemplate, MasterState, Page, Publication, ReadRecord, ReaderIdentity, NewsSettings } from "../domain/model";
import { buildPublishedProjection } from "../domain/projection";
import { MAX_AUDIT_RECORDS, validateImport, validateMasterState } from "../domain/validation";
import type { Authority } from "../permissions/authority";
import type { MasterStore, PublishedStore } from "../storage/contracts";

export interface NewsroomDependencies {
  master: MasterStore;
  published: PublishedStore;
  authority: Authority;
  listReaders: () => ReaderIdentity[];
  now?: () => number;
  onEvent?: (action: string, result: unknown, state: MasterState) => void | Promise<void>;
}

export class Newsroom {
  private readonly now: () => number;
  constructor(private readonly deps: NewsroomDependencies) { this.now = deps.now ?? (() => Date.now()); }

  async getMasterState(): Promise<MasterState> { this.deps.authority.assertGM(); return this.deps.master.load(); }

  private async mutate<T>(action: string, entityType: string, mutation: (state: MasterState) => T, rebuild = false): Promise<T> {
    this.deps.authority.assertGM();
    const current = await this.deps.master.load();
    const next = structuredClone(current);
    const result = mutation(next);
    next.auditLog.push({ id: createId("audit"), action, entityType, entityId: typeof result === "object" && result && "id" in result ? String(result.id) : "", userId: this.deps.authority.currentUser().id, at: this.now() });
    if (next.auditLog.length > MAX_AUDIT_RECORDS) next.auditLog.splice(0, next.auditLog.length - MAX_AUDIT_RECORDS);
    if (rebuild) next.projectionVersion = current.projectionVersion + 1;
    validateMasterState(next);
    const saved = await this.deps.master.save(next, current.revision);
    if (rebuild) await this.deps.published.rebuild(saved, this.deps.listReaders().filter((user) => !user.isGM));
    await this.deps.onEvent?.(action, structuredClone(result), structuredClone(saved));
    return structuredClone(result);
  }

  async createPublication(input: Partial<Publication>): Promise<Publication> {
    return this.mutate("CREATE_PUBLICATION", "publication", (state) => {
      const publication = createPublication(input);
      state.publications.push(publication);
      state.settings.defaultPublicationId ??= publication.id;
      return publication;
    });
  }

  async createIssue(input: Partial<Issue> & Pick<Issue, "publicationId">): Promise<Issue> {
    return this.mutate("CREATE_ISSUE", "issue", (state) => {
      if (!state.publications.some((value) => value.id === input.publicationId)) throw new HoloNewsError("NEWSPAPER_NOT_FOUND", `Publication ${input.publicationId} was not found.`);
      const issue = createIssue(input);
      state.issues.push(issue);
      const page = createPage({ issueId: issue.id, pageNumber: 1, title: "Capa" });
      state.pages.push(page);
      issue.pageIds.push(page.id);
      issue.coverPageId = page.id;
      return issue;
    });
  }

  async createArticle(input: Partial<Article> & Pick<Article, "publicationId" | "issueId">): Promise<Article> {
    return this.mutate("CREATE_ARTICLE", "article", (state) => {
      const issue = state.issues.find((value) => value.id === input.issueId);
      if (!issue || issue.publicationId !== input.publicationId) throw new HoloNewsError("NEWSPAPER_NOT_FOUND", "The Issue and Publication pair was not found.");
      const article = createArticle(input);
      state.articles.push(article);
      const cover = state.pages.find((value) => value.id === issue.coverPageId);
      if (cover) cover.blocks.push({ id: createId("block"), type: cover.blocks.length === 0 ? "headline" : "article-preview", articleId: article.id, sort: cover.blocks.length, emphasis: cover.blocks.length === 0 ? "headline" : "standard" });
      return article;
    }, true);
  }

  async publishIssue(issueId: string): Promise<Issue> {
    return this.mutate("PUBLISH_ISSUE", "issue", (state) => {
      const issue = state.issues.find((value) => value.id === issueId);
      if (!issue) throw new HoloNewsError("NEWSPAPER_NOT_FOUND", `Issue ${issueId} was not found.`);
      const articles = state.articles.filter((value) => value.issueId === issueId && value.status !== "hidden");
      if (articles.length === 0) throw new HoloNewsError("NEWSPAPER_INVALID_DATA", "An Issue needs at least one Article before publication.");
      const at = this.now();
      issue.status = "published";
      issue.publishedAt = at;
      issue.archivedAt = null;
      issue.updatedAt = at;
      for (const article of articles) {
        if (article.status === "draft" || article.status === "scheduled") article.status = "published";
        article.publishedAt ??= at;
        article.updatedAt = at;
      }
      for (const sibling of state.issues) {
        if (sibling.id !== issue.id && sibling.publicationId === issue.publicationId && sibling.status === "published") {
          sibling.status = "archived";
          sibling.archivedAt = at;
        }
      }
      return issue;
    }, true);
  }

  async updatePublication(id: string, patch: Partial<Publication>): Promise<Publication> {
    return this.mutate("UPDATE_PUBLICATION", "publication", (state) => {
      const item = state.publications.find((value) => value.id === id);
      if (!item) throw new HoloNewsError("NEWSPAPER_NOT_FOUND", `Publication ${id} was not found.`);
      Object.assign(item, patch, { id: item.id, updatedAt: this.now() });
      return item;
    }, true);
  }

  async deletePublication(id: string, cascade = false): Promise<void> {
    await this.mutate("DELETE_PUBLICATION", "publication", (state) => {
      const index = state.publications.findIndex((value) => value.id === id);
      if (index < 0) throw new HoloNewsError("NEWSPAPER_NOT_FOUND", `Publication ${id} was not found.`);
      const issueIds = new Set(state.issues.filter((value) => value.publicationId === id).map((value) => value.id));
      if (issueIds.size > 0 && !cascade) throw new HoloNewsError("NEWSPAPER_INVALID_DATA", "Archive or explicitly cascade-delete the Publication's Issues first.");
      state.publications.splice(index, 1);
      state.issues = state.issues.filter((value) => !issueIds.has(value.id));
      state.pages = state.pages.filter((value) => !issueIds.has(value.issueId));
      const removedArticleIds = new Set(state.articles.filter((value) => issueIds.has(value.issueId)).map((value) => value.id));
      state.articles = state.articles.filter((value) => !issueIds.has(value.issueId));
      for (const articleId of removedArticleIds) delete state.readership[articleId];
      for (const article of state.articles) article.relatedArticleIds = article.relatedArticleIds.filter((relatedId) => !removedArticleIds.has(relatedId));
      for (const template of state.templates) if (template.publicationId === id) template.publicationId = null;
      if (state.settings.defaultPublicationId === id) state.settings.defaultPublicationId = state.publications[0]?.id ?? null;
    }, true);
  }

  async updateIssue(id: string, patch: Partial<Issue>): Promise<Issue> {
    return this.mutate("UPDATE_ISSUE", "issue", (state) => {
      const item = state.issues.find((value) => value.id === id);
      if (!item) throw new HoloNewsError("NEWSPAPER_NOT_FOUND", `Issue ${id} was not found.`);
      if (patch.status && patch.status !== item.status) {
        if (patch.status === "published") throw new HoloNewsError("NEWSPAPER_INVALID_DATA", "Use publishIssue() to publish an Issue atomically.");
        if (patch.status === "archived") throw new HoloNewsError("NEWSPAPER_INVALID_DATA", "Use archiveIssue() to archive an Issue atomically.");
        if (item.status === "published") throw new HoloNewsError("NEWSPAPER_INVALID_DATA", "Use unpublishIssue() before changing a published Issue.");
      }
      const publicationId = patch.publicationId ?? item.publicationId;
      if (!state.publications.some((value) => value.id === publicationId)) throw new HoloNewsError("NEWSPAPER_NOT_FOUND", `Publication ${publicationId} was not found.`);
      Object.assign(item, patch, { id: item.id, publicationId, updatedAt: this.now() });
      for (const article of state.articles.filter((value) => value.issueId === id)) article.publicationId = publicationId;
      return item;
    }, itemNeedsProjection(patch));
  }

  async unpublishIssue(id: string): Promise<Issue> {
    return this.mutate("UNPUBLISH_ISSUE", "issue", (state) => {
      const item = state.issues.find((value) => value.id === id);
      if (!item) throw new HoloNewsError("NEWSPAPER_NOT_FOUND", `Issue ${id} was not found.`);
      item.status = "draft";
      item.publishedAt = null;
      item.updatedAt = this.now();
      return item;
    }, true);
  }

  async archiveIssue(id: string): Promise<Issue> {
    return this.mutate("ARCHIVE_ISSUE", "issue", (state) => {
      const item = state.issues.find((value) => value.id === id);
      if (!item) throw new HoloNewsError("NEWSPAPER_NOT_FOUND", `Issue ${id} was not found.`);
      item.status = "archived";
      item.archivedAt = this.now();
      item.updatedAt = this.now();
      for (const article of state.articles.filter((value) => value.issueId === id && value.status === "published")) {
        article.status = "archived";
        article.archivedAt = item.archivedAt;
      }
      return item;
    }, true);
  }

  async deleteIssue(id: string): Promise<void> {
    await this.mutate("DELETE_ISSUE", "issue", (state) => {
      const index = state.issues.findIndex((value) => value.id === id);
      if (index < 0) throw new HoloNewsError("NEWSPAPER_NOT_FOUND", `Issue ${id} was not found.`);
      state.issues.splice(index, 1);
      state.pages = state.pages.filter((value) => value.issueId !== id);
      const articleIds = new Set(state.articles.filter((value) => value.issueId === id).map((value) => value.id));
      state.articles = state.articles.filter((value) => value.issueId !== id);
      for (const articleId of articleIds) delete state.readership[articleId];
      for (const article of state.articles) article.relatedArticleIds = article.relatedArticleIds.filter((relatedId) => !articleIds.has(relatedId));
    }, true);
  }

  async duplicateIssue(id: string): Promise<Issue> {
    return this.mutate("DUPLICATE_ISSUE", "issue", (state) => {
      const source = state.issues.find((value) => value.id === id);
      if (!source) throw new HoloNewsError("NEWSPAPER_NOT_FOUND", `Issue ${id} was not found.`);
      const issue = createIssue({ ...structuredClone(source), id: createId("issue"), number: Math.max(0, ...state.issues.filter((value) => value.publicationId === source.publicationId).map((value) => value.number)) + 1, title: `${source.title} — cópia`, status: "draft", publishedAt: null, archivedAt: null, pageIds: [], coverPageId: null });
      const articleMap = new Map<string, string>();
      for (const sourceArticle of state.articles.filter((value) => value.issueId === source.id)) {
        const article = createArticle({ ...structuredClone(sourceArticle), id: createId("article"), issueId: issue.id, status: "draft", publishedAt: null, archivedAt: null, title: sourceArticle.title });
        articleMap.set(sourceArticle.id, article.id);
        state.articles.push(article);
      }
      for (const article of state.articles.filter((value) => value.issueId === issue.id)) article.relatedArticleIds = article.relatedArticleIds.map((relatedId) => articleMap.get(relatedId) ?? relatedId);
      for (const sourcePage of state.pages.filter((value) => value.issueId === source.id)) {
        const page = createPage({ ...structuredClone(sourcePage), id: createId("page"), issueId: issue.id, blocks: sourcePage.blocks.map((block) => ({ ...block, id: createId("block"), articleId: block.articleId ? articleMap.get(block.articleId) : undefined })) });
        state.pages.push(page);
        issue.pageIds.push(page.id);
        if (source.coverPageId === sourcePage.id) issue.coverPageId = page.id;
      }
      state.issues.push(issue);
      return issue;
    }, true);
  }

  async updateArticle(id: string, patch: Partial<Article>): Promise<Article> {
    return this.mutate("UPDATE_ARTICLE", "article", (state) => {
      const item = state.articles.find((value) => value.id === id);
      if (!item) throw new HoloNewsError("NEWSPAPER_NOT_FOUND", `Article ${id} was not found.`);
      const issueId = patch.issueId ?? item.issueId;
      const issue = state.issues.find((value) => value.id === issueId);
      if (!issue) throw new HoloNewsError("NEWSPAPER_NOT_FOUND", `Issue ${issueId} was not found.`);
      const previousIssueId = item.issueId;
      Object.assign(item, patch, { id: item.id, issueId, publicationId: issue.publicationId, updatedAt: this.now() });
      if (previousIssueId !== issueId) {
        for (const page of state.pages.filter((value) => value.issueId === previousIssueId)) page.blocks = page.blocks.filter((block) => block.articleId !== id);
        const cover = state.pages.find((value) => value.id === issue.coverPageId);
        if (cover && !cover.blocks.some((block) => block.articleId === id)) cover.blocks.push({ id: createId("block"), type: "article-preview", articleId: id, sort: cover.blocks.length, emphasis: "standard" });
      }
      return item;
    }, itemNeedsProjection(patch));
  }

  async setPublicViews(id: string, value: number): Promise<Article> {
    if (!Number.isSafeInteger(value) || value < 0) throw new HoloNewsError("NEWSPAPER_INVALID_DATA", "Narrative views must be a non-negative integer.");
    return this.updateArticle(id, { publicViews: value });
  }

  async deleteArticle(id: string): Promise<void> {
    await this.mutate("DELETE_ARTICLE", "article", (state) => {
      const index = state.articles.findIndex((value) => value.id === id);
      if (index < 0) throw new HoloNewsError("NEWSPAPER_NOT_FOUND", `Article ${id} was not found.`);
      state.articles.splice(index, 1);
      for (const page of state.pages) page.blocks = page.blocks.filter((block) => block.articleId !== id);
      for (const article of state.articles) article.relatedArticleIds = article.relatedArticleIds.filter((relatedId) => relatedId !== id);
      delete state.readership[id];
    }, true);
  }

  async duplicateArticle(id: string): Promise<Article> {
    return this.mutate("DUPLICATE_ARTICLE", "article", (state) => {
      const source = state.articles.find((value) => value.id === id);
      if (!source) throw new HoloNewsError("NEWSPAPER_NOT_FOUND", `Article ${id} was not found.`);
      const article = createArticle({ ...structuredClone(source), id: createId("article"), title: `${source.title} — cópia`, status: "draft", publishedAt: null, archivedAt: null });
      state.articles.push(article);
      return article;
    });
  }

  async createPage(issueId: string, input: Partial<Page> = {}): Promise<Page> {
    return this.mutate("CREATE_PAGE", "page", (state) => {
      const issue = state.issues.find((value) => value.id === issueId);
      if (!issue) throw new HoloNewsError("NEWSPAPER_NOT_FOUND", `Issue ${issueId} was not found.`);
      const page = createPage({ ...input, issueId, pageNumber: input.pageNumber ?? issue.pageIds.length + 1 });
      state.pages.push(page);
      issue.pageIds.push(page.id);
      return page;
    }, true);
  }

  async updatePage(id: string, patch: Partial<Page>): Promise<Page> {
    return this.mutate("UPDATE_PAGE", "page", (state) => {
      const item = state.pages.find((value) => value.id === id);
      if (!item) throw new HoloNewsError("NEWSPAPER_NOT_FOUND", `Page ${id} was not found.`);
      const issueId = patch.issueId ?? item.issueId;
      const targetIssue = state.issues.find((value) => value.id === issueId);
      if (!targetIssue) throw new HoloNewsError("NEWSPAPER_NOT_FOUND", `Issue ${issueId} was not found.`);
      if (issueId !== item.issueId) {
        const sourceIssue = state.issues.find((value) => value.id === item.issueId);
        if (sourceIssue && sourceIssue.pageIds.length <= 1) throw new HoloNewsError("NEWSPAPER_INVALID_DATA", "An Issue must keep at least one Page.");
        if (sourceIssue) {
          sourceIssue.pageIds = sourceIssue.pageIds.filter((pageId) => pageId !== id);
          if (sourceIssue.coverPageId === id) sourceIssue.coverPageId = sourceIssue.pageIds[0] ?? null;
        }
        targetIssue.pageIds.push(id);
        targetIssue.coverPageId ??= id;
      }
      Object.assign(item, patch, { id: item.id, issueId });
      const targetArticleIds = new Set(state.articles.filter((article) => article.issueId === issueId).map((article) => article.id));
      item.blocks = item.blocks.filter((block) => !block.articleId || targetArticleIds.has(block.articleId));
      return item;
    }, true);
  }

  async deletePage(id: string): Promise<void> {
    await this.mutate("DELETE_PAGE", "page", (state) => {
      const index = state.pages.findIndex((value) => value.id === id);
      if (index < 0) throw new HoloNewsError("NEWSPAPER_NOT_FOUND", `Page ${id} was not found.`);
      const issue = state.issues.find((value) => value.id === state.pages[index]?.issueId);
      if (issue && issue.pageIds.length <= 1) throw new HoloNewsError("NEWSPAPER_INVALID_DATA", "An Issue must keep at least one Page.");
      state.pages.splice(index, 1);
      if (issue) {
        issue.pageIds = issue.pageIds.filter((pageId) => pageId !== id);
        if (issue.coverPageId === id) issue.coverPageId = issue.pageIds[0] ?? null;
      }
    }, true);
  }

  async duplicatePage(id: string): Promise<Page> {
    return this.mutate("DUPLICATE_PAGE", "page", (state) => {
      const source = state.pages.find((value) => value.id === id);
      if (!source) throw new HoloNewsError("NEWSPAPER_NOT_FOUND", `Page ${id} was not found.`);
      const issue = state.issues.find((value) => value.id === source.issueId);
      if (!issue) throw new HoloNewsError("NEWSPAPER_NOT_FOUND", `Issue ${source.issueId} was not found.`);
      const pageNumber = Math.max(0, ...state.pages.filter((value) => value.issueId === source.issueId).map((value) => value.pageNumber)) + 1;
      const page = createPage({
        ...structuredClone(source),
        id: createId("page"),
        pageNumber,
        title: `${source.title} — cópia`,
        sort: pageNumber,
        blocks: source.blocks.map((block, index) => ({ ...structuredClone(block), id: createId("block"), sort: index }))
      });
      state.pages.push(page);
      issue.pageIds.push(page.id);
      return page;
    }, true);
  }

  async createAuthor(input: Partial<Author>): Promise<Author> { return this.mutate("CREATE_AUTHOR", "author", (state) => { const value = createAuthor(input); state.authors.push(value); return value; }); }
  async updateAuthor(id: string, patch: Partial<Author>): Promise<Author> { return this.mutate("UPDATE_AUTHOR", "author", (state) => updateById(state.authors, id, patch, "Author"), true); }
  async deleteAuthor(id: string): Promise<void> { await this.mutate("DELETE_AUTHOR", "author", (state) => { removeById(state.authors, id, "Author"); for (const article of state.articles) if (article.authorId === id) article.authorId = null; for (const page of state.pages) for (const block of page.blocks) if (block.authorId === id) block.authorId = undefined; for (const template of state.templates) for (const page of template.pages) for (const block of page.blocks) if (block.authorId === id) block.authorId = undefined; }, true); }
  async createCategory(input: Partial<Category>): Promise<Category> { return this.mutate("CREATE_CATEGORY", "category", (state) => { const value = createCategory(input); state.categories.push(value); return value; }); }
  async updateCategory(id: string, patch: Partial<Category>): Promise<Category> { return this.mutate("UPDATE_CATEGORY", "category", (state) => updateById(state.categories, id, patch, "Category"), true); }
  async deleteCategory(id: string): Promise<void> { await this.mutate("DELETE_CATEGORY", "category", (state) => { removeById(state.categories, id, "Category"); for (const article of state.articles) if (article.categoryId === id) article.categoryId = null; }, true); }
  async createTemplate(input: Partial<IssueTemplate>): Promise<IssueTemplate> { return this.mutate("CREATE_TEMPLATE", "template", (state) => { const value = createIssueTemplate(input); state.templates.push(value); return value; }); }
  async deleteTemplate(id: string): Promise<void> { await this.mutate("DELETE_TEMPLATE", "template", (state) => removeById(state.templates, id, "Template")); }

  async createTemplateFromIssue(issueId: string, name?: string): Promise<IssueTemplate> {
    return this.mutate("CREATE_TEMPLATE_FROM_ISSUE", "template", (state) => {
      const issue = state.issues.find((value) => value.id === issueId);
      if (!issue) throw new HoloNewsError("NEWSPAPER_NOT_FOUND", `Issue ${issueId} was not found.`);
      const pages = state.pages
        .filter((value) => value.issueId === issueId)
        .sort((left, right) => left.sort - right.sort)
        .map((page) => {
          const { id: _id, issueId: _issueId, ...layout } = structuredClone(page);
          return { ...layout, blocks: layout.blocks.map((block) => ({ ...block, id: createId("block"), articleId: undefined })) };
        });
      const value = createIssueTemplate({ name: name?.trim() || `${issue.title} — modelo`, publicationId: issue.publicationId, layout: pages[0]?.layout ?? "frontpage-a", pages });
      state.templates.push(value);
      return value;
    });
  }

  async createIssueFromTemplate(templateId: string, input: Partial<Issue> = {}): Promise<Issue> {
    return this.mutate("CREATE_ISSUE_FROM_TEMPLATE", "issue", (state) => {
      const template = state.templates.find((value) => value.id === templateId);
      if (!template) throw new HoloNewsError("NEWSPAPER_NOT_FOUND", `Template ${templateId} was not found.`);
      const publicationId = input.publicationId ?? template.publicationId ?? state.settings.defaultPublicationId ?? state.publications[0]?.id;
      if (!publicationId || !state.publications.some((value) => value.id === publicationId)) throw new HoloNewsError("NEWSPAPER_NOT_FOUND", "The Template needs an available Publication.");
      const issue = createIssue({ ...input, publicationId, number: input.number ?? Math.max(0, ...state.issues.filter((value) => value.publicationId === publicationId).map((value) => value.number)) + 1, title: input.title ?? template.name, status: "draft", pageIds: [], coverPageId: null, publishedAt: null, archivedAt: null });
      for (const sourcePage of template.pages) {
        const page = createPage({ ...structuredClone(sourcePage), issueId: issue.id, id: createId("page"), blocks: sourcePage.blocks.map((block, index) => ({ ...structuredClone(block), id: createId("block"), articleId: undefined, sort: index })) });
        state.pages.push(page);
        issue.pageIds.push(page.id);
        issue.coverPageId ??= page.id;
      }
      if (issue.pageIds.length === 0) {
        const page = createPage({ issueId: issue.id, pageNumber: 1, title: "Capa", layout: template.layout });
        state.pages.push(page);
        issue.pageIds.push(page.id);
        issue.coverPageId = page.id;
      }
      state.issues.push(issue);
      return issue;
    });
  }

  async publishDueIssues(): Promise<string[]> {
    this.deps.authority.assertGM();
    const state = await this.deps.master.load();
    const due = state.issues
      .filter((issue) => issue.status === "scheduled" && issue.scheduledAt !== null && issue.scheduledAt <= this.now())
      .sort((left, right) => Number(left.scheduledAt) - Number(right.scheduledAt));
    const published: string[] = [];
    for (const issue of due) {
      await this.publishIssue(issue.id);
      published.push(issue.id);
    }
    return published;
  }

  async updateSettings(patch: Partial<NewsSettings>): Promise<NewsSettings> {
    return this.mutate("UPDATE_SETTINGS", "settings", (state) => Object.assign(state.settings, patch), true);
  }

  async recordRead(articleId: string, userId: string, at = this.now()): Promise<ReadRecord> {
    return this.mutate("ARTICLE_OPENED", "readership", (state) => {
      const projection = buildPublishedProjection(state, { id: userId, isGM: false }, at);
      if (!projection.articles.some((article) => article.id === articleId)) throw new HoloNewsError("NEWSPAPER_PERMISSION_DENIED", "The Article is not published for this user.");
      state.readership[articleId] ??= {};
      const current = state.readership[articleId]?.[userId];
      const record = current ? { ...current, lastReadAt: at, readCount: current.readCount + 1 } : { firstReadAt: at, lastReadAt: at, readCount: 1 };
      state.readership[articleId]![userId] = record;
      return record;
    });
  }

  async isPublishedFor(articleId: string, userId: string): Promise<boolean> {
    this.deps.authority.assertGM();
    const state = await this.deps.master.load();
    return buildPublishedProjection(state, { id: userId, isGM: false }).articles.some((article) => article.id === articleId);
  }

  async rebuildProjections(): Promise<void> {
    this.deps.authority.assertGM();
    const current = await this.deps.master.load();
    const saved = await this.deps.master.save({ ...current, projectionVersion: current.projectionVersion + 1 }, current.revision);
    await this.deps.published.rebuild(saved, this.deps.listReaders().filter((user) => !user.isGM));
  }

  async exportBackup(): Promise<string> { this.deps.authority.assertGM(); return JSON.stringify(await this.deps.master.load(), null, 2); }

  async importBackup(value: unknown, expectedRevision: number): Promise<MasterState> {
    this.deps.authority.assertGM();
    const imported = validateImport(value);
    const current = await this.deps.master.load();
    if (current.revision !== expectedRevision) throw new HoloNewsError("NEWSPAPER_REVISION_CONFLICT", `Expected revision ${expectedRevision}, found ${current.revision}.`);
    imported.revision = current.revision;
    imported.projectionVersion = current.projectionVersion + 1;
    imported.auditLog.push({ id: createId("audit"), action: "IMPORT_BACKUP", entityType: "system", entityId: "master", userId: this.deps.authority.currentUser().id, at: this.now() });
    if (imported.auditLog.length > MAX_AUDIT_RECORDS) imported.auditLog.splice(0, imported.auditLog.length - MAX_AUDIT_RECORDS);
    const saved = await this.deps.master.save(imported, current.revision);
    await this.deps.published.rebuild(saved, this.deps.listReaders().filter((user) => !user.isGM));
    return saved;
  }
}

function itemNeedsProjection(patch: object): boolean {
  return Object.keys(patch).some((key) => !["gmNotes", "createdAt", "updatedAt"].includes(key));
}

function updateById<T extends { id: string }>(items: T[], id: string, patch: Partial<T>, label: string): T {
  const item = items.find((value) => value.id === id);
  if (!item) throw new HoloNewsError("NEWSPAPER_NOT_FOUND", `${label} ${id} was not found.`);
  Object.assign(item, patch, { id: item.id });
  return item;
}

function removeById<T extends { id: string }>(items: T[], id: string, label: string): void {
  const index = items.findIndex((value) => value.id === id);
  if (index < 0) throw new HoloNewsError("NEWSPAPER_NOT_FOUND", `${label} ${id} was not found.`);
  items.splice(index, 1);
}
