import { describe, expect, it } from "vitest";
import { Newsroom } from "../../src/core/newsroom";
import { StaticAuthority } from "../../src/permissions/authority";
import { MemoryMasterStore, MemoryPublishedStore } from "../../src/storage/memory-store";

function createNewsroom(now = 1_000) {
  const master = new MemoryMasterStore();
  const published = new MemoryPublishedStore();
  return { newsroom: new Newsroom({ master, published, authority: new StaticAuthority({ id: "gm", isGM: true }), listReaders: () => [{ id: "player", isGM: false }], now: () => now }), published };
}

describe("Advanced editorial workflows", () => {
  it("saves an Issue template and instantiates it with fresh IDs", async () => {
    const { newsroom } = createNewsroom();
    const publication = await newsroom.createPublication({ name: "Boletim" });
    const source = await newsroom.createIssue({ publicationId: publication.id, title: "Modelo" });
    const article = await newsroom.createArticle({ publicationId: publication.id, issueId: source.id, title: "Manchete" });
    const template = await newsroom.createTemplateFromIssue(source.id, "Diário");
    const created = await newsroom.createIssueFromTemplate(template.id);
    const state = await newsroom.getMasterState();
    expect(created.id).not.toBe(source.id);
    expect(state.pages.find((page) => page.issueId === created.id)?.id).not.toBe(state.pages.find((page) => page.issueId === source.id)?.id);
    expect(state.articles.filter((candidate) => candidate.issueId === created.id)).toHaveLength(0);
    expect(article.id).toBeTruthy();
    expect(template.pages[0]?.blocks[0]?.articleId).toBeUndefined();
  });

  it("duplicates a Page and all block identities", async () => {
    const { newsroom } = createNewsroom();
    const publication = await newsroom.createPublication({ name: "Gazeta" });
    const issue = await newsroom.createIssue({ publicationId: publication.id });
    const article = await newsroom.createArticle({ publicationId: publication.id, issueId: issue.id, title: "A" });
    const source = (await newsroom.getMasterState()).pages[0]!;
    const duplicate = await newsroom.duplicatePage(source.id);
    expect(duplicate.id).not.toBe(source.id);
    expect(duplicate.blocks[0]?.articleId).toBe(article.id);
    expect(duplicate.blocks[0]?.id).not.toBe(source.blocks[0]?.id);
  });

  it("publishes due scheduled Issues and leaves future Issues untouched", async () => {
    const { newsroom, published } = createNewsroom(10_000);
    const publication = await newsroom.createPublication({ name: "Agenda" });
    const due = await newsroom.createIssue({ publicationId: publication.id, status: "scheduled", scheduledAt: 9_000 });
    await newsroom.createArticle({ publicationId: publication.id, issueId: due.id, title: "Agora" });
    const future = await newsroom.createIssue({ publicationId: publication.id, status: "scheduled", scheduledAt: 20_000 });
    await newsroom.createArticle({ publicationId: publication.id, issueId: future.id, title: "Depois" });
    expect(await newsroom.publishDueIssues()).toEqual([due.id]);
    expect((await published.read("player"))?.issues.map((issue) => issue.id)).toContain(due.id);
    expect((await newsroom.getMasterState()).issues.find((issue) => issue.id === future.id)?.status).toBe("scheduled");
  });

  it("requires explicit lifecycle commands for a published Issue", async () => {
    const { newsroom } = createNewsroom();
    const publication = await newsroom.createPublication({ name: "Ciclo" });
    const issue = await newsroom.createIssue({ publicationId: publication.id });
    await newsroom.createArticle({ publicationId: publication.id, issueId: issue.id, title: "Pronta" });
    await expect(newsroom.updateIssue(issue.id, { status: "published" })).rejects.toThrowError(/publishIssue/i);
    await newsroom.publishIssue(issue.id);
    await expect(newsroom.updateIssue(issue.id, { status: "draft" })).rejects.toThrowError(/unpublishIssue/i);
  });

  it("refreshes the public projection when content is added to a published Issue", async () => {
    const { newsroom, published } = createNewsroom();
    const publication = await newsroom.createPublication({ name: "Ao vivo" });
    const issue = await newsroom.createIssue({ publicationId: publication.id });
    await newsroom.createArticle({ publicationId: publication.id, issueId: issue.id, title: "Primeira" });
    await newsroom.publishIssue(issue.id);
    const added = await newsroom.createArticle({ publicationId: publication.id, issueId: issue.id, title: "Segunda", status: "published" });
    expect((await published.read("player"))?.articles.map((article) => article.id)).toContain(added.id);
  });
});
