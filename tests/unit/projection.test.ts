import { describe, expect, it } from "vitest";
import { createArticle, createAuthor, createEmptyState, createIssue, createPage, createPublication } from "../../src/domain/factories";
import { buildPublishedProjection } from "../../src/domain/projection";

describe("Published projection seam", () => {
  it("delivers only published and authorized content without administrative fields", () => {
    const state = createEmptyState();
    const publication = createPublication({ id: "union", name: "Union Chronicle" });
    const issue = createIssue({ id: "issue-42", publicationId: publication.id, status: "published" });
    const page = createPage({ id: "page-1", issueId: issue.id, blocks: [
      { id: "block-visible", type: "article-preview", articleId: "visible", sort: 0 },
      { id: "block-secret", type: "article-preview", articleId: "secret", sort: 1 },
      { id: "block-author", type: "author-card", authorId: "author-1", sort: 2 }
    ] });
    const visible = createArticle({ id: "visible", issueId: issue.id, publicationId: publication.id, title: "Colônia perde contato", body: "Sinal interrompido.", status: "published", publicViews: 18_432, gmNotes: "Fonte protegida" });
    const secret = createArticle({ id: "secret", issueId: issue.id, publicationId: publication.id, title: "Conspiração", body: "Plano futuro.", status: "published", visibility: { mode: "specific-users", users: ["player-a"] } });
    const draft = createArticle({ id: "draft", issueId: issue.id, publicationId: publication.id, title: "Ataque futuro", body: "Ainda não ocorreu.", status: "draft" });
    state.publications.push(publication);
    state.issues.push({ ...issue, pageIds: [page.id], coverPageId: page.id });
    state.pages.push(page);
    state.authors.push(createAuthor({ id: "author-1", name: "Eleanor Vance" }));
    state.articles.push(visible, secret, draft);
    state.readership[visible.id] = { "player-a": { firstReadAt: 1, lastReadAt: 2, readCount: 2 } };
    state.auditLog.push({ id: "audit-1", action: "PUBLISH", entityType: "issue", entityId: issue.id, userId: "gm", at: 1 });
    (visible as ArticleWithUnexpectedFields).futurePlot = "do not project";
    (page.blocks[0] as typeof page.blocks[number] & { gmLayoutNote: string }).gmLayoutNote = "private";
    (state.settings as typeof state.settings & { gmSecret: string }).gmSecret = "private";

    const projection = buildPublishedProjection(state, { id: "player-b", isGM: false });

    expect(projection.articles.map((article) => article.id)).toEqual(["visible"]);
    expect(projection.pages[0]?.blocks.map((block) => block.articleId).filter(Boolean)).toEqual(["visible"]);
    expect(projection.articles[0]?.publicViews).toBe(18_432);
    expect(projection.authors).toEqual([expect.objectContaining({ id: "author-1", name: "Eleanor Vance" })]);
    expect(JSON.stringify(projection)).not.toContain("gmNotes");
    expect(JSON.stringify(projection)).not.toContain("readership");
    expect(JSON.stringify(projection)).not.toContain("auditLog");
    expect(JSON.stringify(projection)).not.toContain("visibility");
    expect(JSON.stringify(projection)).not.toContain("draft");
    expect(JSON.stringify(projection)).not.toContain("futurePlot");
    expect(JSON.stringify(projection)).not.toContain("gmLayoutNote");
    expect(JSON.stringify(projection)).not.toContain("gmSecret");
  });

  it("includes specific-user content only for the authorized user", () => {
    const state = createEmptyState();
    state.publications.push(createPublication({ id: "union" }));
    state.issues.push(createIssue({ id: "issue-1", publicationId: "union", status: "published" }));
    state.articles.push(createArticle({ id: "secret", publicationId: "union", issueId: "issue-1", status: "published", visibility: { mode: "specific-users", users: ["player-a"] } }));

    expect(buildPublishedProjection(state, { id: "player-a", isGM: false }).articles).toHaveLength(1);
    expect(buildPublishedProjection(state, { id: "player-b", isGM: false }).articles).toHaveLength(0);
  });
});

type ArticleWithUnexpectedFields = ReturnType<typeof createArticle> & { futurePlot: string };
