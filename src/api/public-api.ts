import { MODULE_ID } from "../constants";
import type { Newsroom } from "../core/newsroom";
import type { Article, Issue, IssueTemplate, MasterState, Page, Publication, PublishedProjection } from "../domain/model";
import { buildPublishedProjection } from "../domain/projection";
import type { PublishedStore } from "../storage/contracts";

export interface AppController {
  openReader(route?: { view?: string; publicationId?: string; issueId?: string; pageId?: string; articleId?: string; categoryId?: string; query?: string }): unknown;
  openManager(): unknown;
}

export interface HoloNewsApi {
  open(): unknown;
  openReader(): unknown;
  openLatestIssue(): unknown;
  openIssue(id: string): unknown;
  openArticle(id: string): unknown;
  openManager(): unknown;
  getProjection(userId?: string): Promise<PublishedProjection | null>;
  getPublications(): Promise<PublishedProjection["publications"]>;
  getPublishedIssues(): Promise<PublishedProjection["issues"]>;
  getPublishedArticles(): Promise<PublishedProjection["articles"]>;
  createPublication(input?: Partial<Publication>): ReturnType<Newsroom["createPublication"]>;
  createIssue(input: Partial<Issue> & Pick<Issue, "publicationId">): ReturnType<Newsroom["createIssue"]>;
  createArticle(input: Partial<Article> & Pick<Article, "publicationId" | "issueId">): ReturnType<Newsroom["createArticle"]>;
  updatePublication(id: string, patch: Partial<Publication>): ReturnType<Newsroom["updatePublication"]>;
  deletePublication(id: string, cascade?: boolean): ReturnType<Newsroom["deletePublication"]>;
  updateIssue(id: string, patch: Partial<Issue>): ReturnType<Newsroom["updateIssue"]>;
  updateArticle(id: string, patch: Partial<Article>): ReturnType<Newsroom["updateArticle"]>;
  createPage(issueId: string, input?: Partial<Page>): ReturnType<Newsroom["createPage"]>;
  updatePage(id: string, patch: Partial<Page>): ReturnType<Newsroom["updatePage"]>;
  publishIssue(id: string): ReturnType<Newsroom["publishIssue"]>;
  unpublishIssue(id: string): ReturnType<Newsroom["unpublishIssue"]>;
  archiveIssue(id: string): ReturnType<Newsroom["archiveIssue"]>;
  deleteIssue(id: string): ReturnType<Newsroom["deleteIssue"]>;
  deleteArticle(id: string): ReturnType<Newsroom["deleteArticle"]>;
  setPublicViews(id: string, value: number): ReturnType<Newsroom["setPublicViews"]>;
  duplicateIssue(id: string): ReturnType<Newsroom["duplicateIssue"]>;
  duplicateArticle(id: string): ReturnType<Newsroom["duplicateArticle"]>;
  deletePage(id: string): ReturnType<Newsroom["deletePage"]>;
  duplicatePage(id: string): ReturnType<Newsroom["duplicatePage"]>;
  createTemplate(input: Partial<IssueTemplate>): ReturnType<Newsroom["createTemplate"]>;
  createTemplateFromIssue(issueId: string, name?: string): ReturnType<Newsroom["createTemplateFromIssue"]>;
  createIssueFromTemplate(templateId: string, input?: Partial<Issue>): ReturnType<Newsroom["createIssueFromTemplate"]>;
  deleteTemplate(id: string): ReturnType<Newsroom["deleteTemplate"]>;
  exportBackup(): ReturnType<Newsroom["exportBackup"]>;
  importBackup(value: unknown, expectedRevision: number): ReturnType<Newsroom["importBackup"]>;
}

export function createPublicApi(newsroom: Newsroom, published: PublishedStore, apps: AppController): HoloNewsApi {
  const projection = async (userId = String(game.user?.id ?? "")): Promise<PublishedProjection | null> => {
    if (game.user?.isGM) {
      const state: MasterState = await newsroom.getMasterState();
      return buildPublishedProjection(state, { id: userId, isGM: false });
    }
    return published.read(String(game.user?.id ?? ""));
  };
  return {
    open: () => game.user?.isGM ? apps.openManager() : apps.openReader(),
    openReader: () => apps.openReader(),
    openLatestIssue: () => apps.openReader({ view: "home" }),
    openIssue: (id) => apps.openReader({ view: "issue", issueId: id }),
    openArticle: (id) => apps.openReader({ view: "article", articleId: id }),
    openManager: () => apps.openManager(),
    getProjection: projection,
    getPublications: async () => (await projection())?.publications ?? [],
    getPublishedIssues: async () => (await projection())?.issues ?? [],
    getPublishedArticles: async () => (await projection())?.articles ?? [],
    createPublication: (input = {}) => newsroom.createPublication(input),
    createIssue: (input) => newsroom.createIssue(input),
    createArticle: (input) => newsroom.createArticle(input),
    updatePublication: (id, patch) => newsroom.updatePublication(id, patch),
    deletePublication: (id, cascade) => newsroom.deletePublication(id, cascade),
    updateIssue: (id, patch) => newsroom.updateIssue(id, patch),
    updateArticle: (id, patch) => newsroom.updateArticle(id, patch),
    createPage: (issueId, input) => newsroom.createPage(issueId, input),
    updatePage: (id, patch) => newsroom.updatePage(id, patch),
    publishIssue: (id) => newsroom.publishIssue(id),
    unpublishIssue: (id) => newsroom.unpublishIssue(id),
    archiveIssue: (id) => newsroom.archiveIssue(id),
    deleteIssue: (id) => newsroom.deleteIssue(id),
    deleteArticle: (id) => newsroom.deleteArticle(id),
    setPublicViews: (id, value) => newsroom.setPublicViews(id, value),
    duplicateIssue: (id) => newsroom.duplicateIssue(id),
    duplicateArticle: (id) => newsroom.duplicateArticle(id),
    deletePage: (id) => newsroom.deletePage(id),
    duplicatePage: (id) => newsroom.duplicatePage(id),
    createTemplate: (input) => newsroom.createTemplate(input),
    createTemplateFromIssue: (issueId, name) => newsroom.createTemplateFromIssue(issueId, name),
    createIssueFromTemplate: (templateId, input) => newsroom.createIssueFromTemplate(templateId, input),
    deleteTemplate: (id) => newsroom.deleteTemplate(id),
    exportBackup: () => newsroom.exportBackup(),
    importBackup: (value, expectedRevision) => newsroom.importBackup(value, expectedRevision)
  };
}

export function exposePublicApi(api: HoloNewsApi): void {
  game.holosuiteNews = api;
  const module = game.modules.get(MODULE_ID);
  if (module) module.api = api;
  (globalThis as any).HoloNews = api;
}
