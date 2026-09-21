import { describe, expect, it } from "vitest";
import { Newsroom } from "../../src/core/newsroom";
import { StaticAuthority } from "../../src/permissions/authority";
import { MemoryMasterStore, MemoryPublishedStore } from "../../src/storage/memory-store";

describe("Newsroom interface", () => {
  it("proves the complete create, publish, read flow", async () => {
    const master = new MemoryMasterStore();
    const published = new MemoryPublishedStore();
    const newsroom = new Newsroom({ master, published, authority: new StaticAuthority({ id: "gm", isGM: true }), listReaders: () => [{ id: "player", isGM: false }] });

    const publication = await newsroom.createPublication({ name: "Union Chronicle" });
    const issue = await newsroom.createIssue({ publicationId: publication.id, number: 42, title: "Edição 42" });
    const article = await newsroom.createArticle({ publicationId: publication.id, issueId: issue.id, title: "Colônia perde contato", body: "Comunicações desapareceram.", publicViews: 18_432 });
    await newsroom.publishIssue(issue.id);

    const projection = await published.read("player");
    expect(projection?.issues[0]?.status).toBe("published");
    expect(projection?.articles[0]).toMatchObject({ id: article.id, publicViews: 18_432 });
    expect(projection?.revision).toBeGreaterThan(0);
  });

  it("rejects representative create, update, publish, views, settings, and import mutations from a player", async () => {
    const newsroom = new Newsroom({ master: new MemoryMasterStore(), published: new MemoryPublishedStore(), authority: new StaticAuthority({ id: "player", isGM: false }), listReaders: () => [] });
    await expect(newsroom.createPublication({ name: "Illegal" })).rejects.toMatchObject({ code: "NEWSPAPER_PERMISSION_DENIED" });
    await expect(newsroom.updateArticle("article", { title: "Illegal" })).rejects.toMatchObject({ code: "NEWSPAPER_PERMISSION_DENIED" });
    await expect(newsroom.publishIssue("issue")).rejects.toMatchObject({ code: "NEWSPAPER_PERMISSION_DENIED" });
    await expect(newsroom.setPublicViews("article", 1_000_000)).rejects.toMatchObject({ code: "NEWSPAPER_PERMISSION_DENIED" });
    await expect(newsroom.updateSettings({ showViews: false })).rejects.toMatchObject({ code: "NEWSPAPER_PERMISSION_DENIED" });
    await expect(newsroom.importBackup({}, 0)).rejects.toMatchObject({ code: "NEWSPAPER_PERMISSION_DENIED" });
  });
});
