import { TEMPLATE_ROOT } from "../constants";
import type { Newsroom } from "../core/newsroom";
import { formatViews } from "../utils/format";
import { assertEditorialAccess, confirmAction, HoloNewsApplication } from "./base";
import { NewspaperArticleEditorApp, NewspaperIssueEditorApp, NewspaperPageEditorApp, NewspaperPublicationEditorApp, NewspaperSettingsEditorApp, NewspaperTaxonomyEditorApp } from "./editors";

type EditorialSection = "dashboard" | "publications" | "issues" | "articles" | "pages" | "authors" | "categories" | "readership" | "templates" | "settings";
const MAX_BACKUP_BYTES = 10 * 1024 * 1024;

export class NewspaperEditorialApp extends HoloNewsApplication {
  static override DEFAULT_OPTIONS = { ...HoloNewsApplication.DEFAULT_OPTIONS, id: "holosuite-news-editorial", classes: ["hsn-window", "hsn-editorial-window"], window: { title: "HoloNews — Mesa editorial", icon: "fa-solid fa-newspaper", resizable: true }, position: { width: 1160, height: 800 } };
  static PARTS = { main: { template: `${TEMPLATE_ROOT}/gm/editorial.hbs` } };
  private section: EditorialSection = "dashboard";
  constructor(private readonly newsroom: Newsroom, private readonly openPlayerPreview: (route?: { view: "home" | "issue"; issueId?: string }) => unknown, options: object = {}) { assertEditorialAccess(); super(options); }
  override async _prepareContext() {
    assertEditorialAccess();
    const state = await this.newsroom.getMasterState();
    const players = [...(game.users ?? [])].filter((user: any) => !user.isGM).map((user: any) => ({ id: user.id, name: user.name, active: user.active }));
    const rows = state.articles.map((article) => { const reads = state.readership[article.id] ?? {}; return { ...article, viewsLabel: formatViews(article.publicViews, state.settings.locale), readCount: Object.keys(reads).length, readerNames: players.filter((player: any) => reads[player.id]).map((player: any) => player.name).join(", "), playerTotal: players.length }; });
    const currentIssue = state.issues.find((value) => value.status === "published");
    const totalViews = state.articles.reduce((sum, article) => sum + article.publicViews, 0);
    return { section: this.section, state, publications: state.publications, issues: [...state.issues].sort((a, b) => b.number - a.number), articles: rows, pages: state.pages, authors: state.authors, categories: state.categories, templates: state.templates, players, currentIssue, totalViewsLabel: formatViews(totalViews, state.settings.locale), auditLog: state.auditLog.slice(-30).reverse(), hasContent: state.publications.length > 0 };
  }
  protected override bind(root: HTMLElement): void {
    root.querySelectorAll<HTMLElement>("[data-hsn-action]").forEach((element) => element.addEventListener("click", (event) => void this.onAction(event)));
    const importInput = root.querySelector<HTMLInputElement>("[data-hsn-import]");
    importInput?.addEventListener("change", () => void this.importFile(importInput));
  }
  private async onAction(event: Event): Promise<void> {
    const target = event.currentTarget as HTMLElement;
    const action = target.dataset.hsnAction;
    const id = target.dataset.id ?? null;
    try {
      if (action === "section") { this.section = (target.dataset.section ?? "dashboard") as EditorialSection; await this.rerender(); return; }
      if (action === "preview") { this.openPlayerPreview({ view: "home" }); return; }
      if (action === "preview-issue" && id) { this.openPlayerPreview({ view: "issue", issueId: id }); return; }
      if (action === "settings") { new NewspaperSettingsEditorApp(this.newsroom, () => this.rerender()).render({ force: true }); return; }
      if (action === "new-publication" || action === "edit-publication") { new NewspaperPublicationEditorApp(this.newsroom, action === "edit-publication" ? id : null, () => this.rerender()).render({ force: true }); return; }
      if (action === "new-issue" || action === "edit-issue") { const state = await this.newsroom.getMasterState(); if (!state.publications.length) throw new Error("Crie uma Publicação antes da primeira Edição."); new NewspaperIssueEditorApp(this.newsroom, action === "edit-issue" ? id : null, () => this.rerender(), state.settings.defaultPublicationId ?? state.publications[0]?.id).render({ force: true }); return; }
      if (action === "new-article" || action === "edit-article") { const state = await this.newsroom.getMasterState(); const issueId = target.dataset.issueId ?? state.issues.find((value) => value.status === "draft")?.id ?? state.issues[0]?.id; if (!issueId) throw new Error("Crie uma Edição antes da primeira Matéria."); new NewspaperArticleEditorApp(this.newsroom, action === "edit-article" ? id : null, () => this.rerender(), issueId).render({ force: true }); return; }
      if (action === "new-page" || action === "edit-page") { const state = await this.newsroom.getMasterState(); const issueId = target.dataset.issueId ?? state.issues[0]?.id; if (!issueId) throw new Error("Crie uma Edição antes da Página."); new NewspaperPageEditorApp(this.newsroom, action === "edit-page" ? id : null, () => this.rerender(), issueId).render({ force: true }); return; }
      if (action === "new-author" || action === "edit-author") { new NewspaperTaxonomyEditorApp(this.newsroom, action === "edit-author" ? id : null, () => this.rerender(), "author").render({ force: true }); return; }
      if (action === "new-category" || action === "edit-category") { new NewspaperTaxonomyEditorApp(this.newsroom, action === "edit-category" ? id : null, () => this.rerender(), "category").render({ force: true }); return; }
      if (action === "quick-create") { await this.quickCreate(); return; }
      if (action === "publish" && id) await this.newsroom.publishIssue(id);
      if (action === "unpublish" && id && await confirmAction("Despublicar edição", "Os jogadores deixarão de acessar esta edição. Continuar?")) await this.newsroom.unpublishIssue(id);
      if (action === "archive" && id && await confirmAction("Arquivar edição", "A edição continuará no arquivo, mas deixará de ser a atual. Continuar?")) await this.newsroom.archiveIssue(id);
      if (action === "delete-issue" && id && await confirmAction("Excluir edição", "Esta ação remove páginas e matérias da edição. O backup atual não será alterado. Continuar?")) await this.newsroom.deleteIssue(id);
      if (action === "delete-article" && id && await confirmAction("Excluir matéria", "A matéria será removida de todas as páginas e relações. Continuar?")) await this.newsroom.deleteArticle(id);
      if (action === "delete-page" && id && await confirmAction("Excluir página", "A página será removida da edição. Continuar?")) await this.newsroom.deletePage(id);
      if (action === "duplicate-page" && id) await this.newsroom.duplicatePage(id);
      if (action === "duplicate-issue" && id) await this.newsroom.duplicateIssue(id);
      if (action === "duplicate-article" && id) await this.newsroom.duplicateArticle(id);
      if (action === "delete-publication" && id && await confirmAction("Excluir publicação", "A publicação, suas edições, páginas, matérias e leituras privadas serão removidas. Exporte um backup antes de continuar.")) await this.newsroom.deletePublication(id, true);
      if (action === "delete-author" && id && await confirmAction("Excluir autor", "As matérias manterão o texto livre, mas perderão o vínculo com este autor.")) await this.newsroom.deleteAuthor(id);
      if (action === "delete-category" && id && await confirmAction("Excluir categoria", "As matérias manterão o texto livre, mas perderão o vínculo com esta categoria.")) await this.newsroom.deleteCategory(id);
      if (action === "save-template" && id) {
        const suggested = (await this.newsroom.getMasterState()).issues.find((issue) => issue.id === id)?.title ?? "Novo modelo";
        const name = globalThis.prompt?.("Nome do template", `${suggested} — modelo`);
        if (name !== null) await this.newsroom.createTemplateFromIssue(id, name || undefined);
      }
      if (action === "use-template" && id) await this.newsroom.createIssueFromTemplate(id);
      if (action === "delete-template" && id && await confirmAction("Excluir template", "O modelo será removido. Edições já criadas não serão afetadas.")) await this.newsroom.deleteTemplate(id);
      if (action === "export") { const backup = await this.newsroom.exportBackup(); saveDataToFile(backup, "application/json", `holonews-backup-${new Date().toISOString().slice(0, 10)}.json`); return; }
      if (action === "import") { this.root()?.querySelector<HTMLInputElement>("[data-hsn-import]")?.click(); return; }
      await this.rerender();
    } catch (error) { this.report(error); }
  }
  private async quickCreate(): Promise<void> {
    let state = await this.newsroom.getMasterState();
    const publication = state.publications[0] ?? await this.newsroom.createPublication({ name: "HoloNews", shortName: "HN" });
    state = await this.newsroom.getMasterState();
    const issue = await this.newsroom.createIssue({ publicationId: publication.id, number: Math.max(0, ...state.issues.map((value) => value.number)) + 1, title: "Nova edição" });
    const article = await this.newsroom.createArticle({ publicationId: publication.id, issueId: issue.id, title: "Nova manchete", body: "Escreva a matéria.", publicViews: 0 });
    new NewspaperArticleEditorApp(this.newsroom, article.id, () => this.rerender()).render({ force: true });
    await this.rerender();
  }
  private async importFile(input: HTMLInputElement): Promise<void> {
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    try {
      if (file.size > MAX_BACKUP_BYTES) throw new Error("O backup excede o limite seguro de 10 MB.");
      const parsed = JSON.parse(await file.text());
      const state = await this.newsroom.getMasterState();
      if (!await confirmAction("Importar backup", "A importação substituirá o estado editorial atual após validação. Exporte um backup antes de continuar.")) return;
      await this.newsroom.importBackup(parsed, state.revision);
      await this.rerender();
    } catch (error) { this.report(error); }
  }
}
