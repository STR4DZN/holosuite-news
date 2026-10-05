import { describe, expect, it } from "vitest";
import { newArticle } from "../../src/domain/model";
import { validateArticle } from "../../src/domain/validation";
import { MemoryNewsStore } from "../../src/storage/memory-store";
import { Newsroom } from "../../src/core/newsroom";
import { defaultNewsMotion } from "../../src/domain/news-motion";

describe("Perfis de publicação", () => {
  it("abre notícias antigas sem motion e conserva a urgência anterior", () => {
    const old = { ...newArticle("old"), urgent: true }; delete old.motion;
    const article = validateArticle(old);
    expect(article.urgent).toBe(true);
    expect(article.motion?.priority).toBe("urgent");
    expect(article.motion?.alert).toBe("critical");
  });
  it("rejeita efeitos arbitrários e aceita perfis parciais de backups anteriores", () => {
    expect(() => validateArticle({ ...newArticle("x"), motion: { entry: "<script>" } })).toThrow("animação inválida");
    expect(() => validateArticle({ ...newArticle("x"), motion: [] })).toThrow("animação inválida");
    expect(validateArticle({ ...newArticle("x"), motion: { entry: "signal" } }).motion).toEqual({ ...defaultNewsMotion(), entry: "signal" });
  });
  it("salva, publica, revisa e importa os efeitos sem expor notas ou rascunhos", async () => {
    let id = 0;
    const store = new MemoryNewsStore(), room = new Newsroom(store, () => {}, () => `news${++id}`);
    let item = await room.create();
    const motion = { ...defaultNewsMotion(), entry: "hologram" as const, alert: "critical" as const, priority: "urgent" as const, strength: "high" as const, pace: "cinema" as const };
    item = await room.save(item.id, { ...item.draft, title: "Transmissão urgente", body: "<p>Texto público</p>", motion }, "Informação privada", item.revision);
    item = await room.publish(item.id, item.revision);
    expect(store.articles.get(item.id)?.motion).toEqual(motion);
    expect(store.articles.get(item.id)).not.toHaveProperty("notes");
    const revised = { ...motion, entry: "archive" as const, alert: "none" as const };
    item = await room.save(item.id, { ...item.draft, motion: revised }, item.notes, item.revision);
    expect(store.articles.get(item.id)?.motion).toEqual(motion);
    await room.importBackup(await room.backup());
    const imported = (await room.list()).find(i => i.id !== item.id)!;
    expect(imported.draft.motion).toEqual(revised);
    expect(imported.published).toBeNull();
  });
});
