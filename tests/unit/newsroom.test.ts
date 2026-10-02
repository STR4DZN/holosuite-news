import { describe, it, expect } from "vitest";
import { Newsroom } from "../../src/core/newsroom";
import { MemoryNewsStore } from "../../src/storage/memory-store";
import { canRead, newItem, hasChanges } from "../../src/domain/model";
import { validateArticle, validateBackup } from "../../src/domain/validation";
import { convertLegacy } from "../../src/storage/migrations";
import { portalContext, managerContext } from "../../src/ui/context";
function setup() {
  let id = 0;
  const store = new MemoryNewsStore();
  return {
    store,
    newsroom: new Newsroom(
      store,
      () => {},
      () => `article${++id}`,
    ),
  };
}
async function ready(newsroom: Newsroom) {
  const item = await newsroom.create();
  return newsroom.save(
    item.id,
    {
      ...item.draft,
      title: "Sinal de Meridian",
      body: "<p>O sinal voltou.</p>",
      views: 123456,
      featured: true,
    },
    "Segredo do mestre",
    item.revision,
  );
}
describe("Publicação simples", () => {
  it("rascunhos nunca entram no portal nem escrevem projeções", async () => {
    const { newsroom, store } = setup();
    await ready(newsroom);
    expect(await newsroom.articles({ id: "player", isGM: false })).toEqual([]);
    expect(store.syncCount).toBe(0);
  });
  it("editar publicada cria uma revisão separada, sem mudar texto ou views ao vivo", async () => {
    const { newsroom, store } = setup();
    let item = await ready(newsroom);
    item = await newsroom.publish(item.id, item.revision);
    const old = structuredClone(item.published);
    item = await newsroom.save(
      item.id,
      {
        ...item.draft,
        title: "Novo título",
        views: 9000,
        audience: { mode: "gm", users: [] },
      },
      "Outro segredo",
      item.revision,
    );
    expect(hasChanges(item)).toBe(true);
    expect(item.published).toEqual(old);
    expect(store.articles.get(item.id)).toEqual(old);
    expect(store.syncCount).toBe(1);
    item = await newsroom.publish(item.id, item.revision);
    expect(item.published?.title).toBe("Novo título");
    expect(await newsroom.articles({ id: "player", isGM: false })).toEqual([]);
  });
  it("seleciona público, deixa GM ler e mantém notas fora da publicação", async () => {
    const { newsroom, store } = setup();
    let item = await ready(newsroom);
    item = await newsroom.save(
      item.id,
      { ...item.draft, audience: { mode: "selected", users: ["iris"] } },
      item.notes,
      item.revision,
    );
    item = await newsroom.publish(item.id, item.revision);
    expect(await newsroom.articles({ id: "iris", isGM: false })).toHaveLength(
      1,
    );
    expect(await newsroom.articles({ id: "player", isGM: false })).toHaveLength(
      0,
    );
    expect(await newsroom.articles({ id: "gm", isGM: true })).toHaveLength(1);
    expect(JSON.stringify([...store.articles.values()])).not.toContain(
      "Segredo",
    );
    expect(store.articles.get(item.id)).not.toHaveProperty("notes");
  });
  it("recupera publicação interrompida sem perder o rascunho", async () => {
    const { newsroom, store } = setup();
    let item = await ready(newsroom);
    store.failSync = true;
    await expect(newsroom.publish(item.id, item.revision)).rejects.toThrow();
    item = await newsroom.get(item.id);
    expect(item.pending).toBe(true);
    expect(item.notes).toBe("Segredo do mestre");
    store.failSync = false;
    await newsroom.recover();
    expect((await newsroom.get(item.id)).pending).toBe(false);
    expect(store.articles.has(item.id)).toBe(true);
  });
  it("recupera retirada interrompida e mantém rascunho", async () => {
    const { newsroom, store } = setup();
    let item = await ready(newsroom);
    item = await newsroom.publish(item.id, item.revision);
    store.failSync = true;
    await expect(newsroom.unpublish(item.id, item.revision)).rejects.toThrow();
    expect(store.articles.has(item.id)).toBe(true);
    store.failSync = false;
    await newsroom.recover();
    item = await newsroom.get(item.id);
    expect(item.published).toBeNull();
    expect(item.draft.title).toBe("Sinal de Meridian");
    expect(store.articles.has(item.id)).toBe(false);
  });
  it("rejeita duas janelas salvando a mesma revisão e continua após erro", async () => {
    const { newsroom } = setup();
    const item = await ready(newsroom);
    const result = await Promise.allSettled([
      newsroom.save(item.id, { ...item.draft, title: "A" }, "", item.revision),
      newsroom.save(item.id, { ...item.draft, title: "B" }, "", item.revision),
    ]);
    expect(result.map((r) => r.status)).toEqual(["fulfilled", "rejected"]);
    expect((await newsroom.get(item.id)).draft.title).toBe("A");
    await newsroom.create();
  });
  it("duplicar não publica nem copia o estado de destaque", async () => {
    const { newsroom } = setup();
    let item = await ready(newsroom);
    item = await newsroom.publish(item.id, item.revision);
    const copy = await newsroom.duplicate(item.id);
    expect(copy.id).not.toBe(item.id);
    expect(copy.published).toBeNull();
    expect(copy.draft.featured).toBe(false);
    expect(copy.notes).toBe(item.notes);
  });
  it("backup restaura conteúdo como novos rascunhos, sem sobrescrever notícias", async () => {
    const { newsroom } = setup();
    let item = await ready(newsroom);
    item = await newsroom.publish(item.id, item.revision);
    const backup = await newsroom.backup();
    expect(await newsroom.importBackup(backup)).toBe(1);
    const list = await newsroom.list();
    expect(list).toHaveLength(2);
    expect(list.filter((i) => i.published)).toHaveLength(1);
    expect(list.find((i) => i.id !== item.id)?.notes).toBe(item.notes);
  });
  it("valida tudo antes de iniciar importação", async () => {
    const { newsroom } = setup();
    const backup = await newsroom.backup();
    expect(() =>
      validateBackup({
        ...backup,
        items: [newItem("a"), { ...newItem("b"), notes: 17 }],
      }),
    ).toThrow();
    expect(await newsroom.list()).toHaveLength(0);
  });
  it("excluir uma notícia não toca as demais", async () => {
    const { newsroom, store } = setup();
    let a = await ready(newsroom);
    a = await newsroom.publish(a.id, a.revision);
    const b = await ready(newsroom);
    await newsroom.remove(a.id, a.revision);
    expect(await newsroom.list()).toEqual([b]);
    expect(store.articles.has(a.id)).toBe(false);
  });
  it("protege todas as operações de mestre", async () => {
    const room = new Newsroom(new MemoryNewsStore(), () => {
      throw new Error("Sem permissão");
    });
    await expect(room.create()).rejects.toThrow("Sem permissão");
    await expect(room.list()).rejects.toThrow("Sem permissão");
    await expect(room.backup()).rejects.toThrow("Sem permissão");
  });
});
describe("Dados e migração", () => {
  it("aceita datas fictícias e contadores grandes, rejeita inválidos e URL executável", () => {
    const article = {
      ...newItem("a").draft,
      date: "42 do ciclo vermelho",
      views: 1_000_000_000,
    };
    expect(validateArticle(article).date).toBe(article.date);
    expect(() => validateArticle({ ...article, views: -1 })).toThrow();
    expect(() => validateArticle({ ...article, views: 2.5 })).toThrow();
    expect(() =>
      validateArticle({ ...article, cover: "javascript:alert(1)" }),
    ).toThrow();
  });
  it("impede publicação sem título, texto ou seleção de público", () => {
    const a = newItem("a").draft;
    expect(() => validateArticle(a, true)).toThrow();
    expect(() =>
      validateArticle({ ...a, title: "A", body: "<p></p>" }, true),
    ).toThrow();
    expect(() =>
      validateArticle(
        {
          ...a,
          title: "A",
          body: "Texto",
          audience: { mode: "selected", users: [] },
        },
        true,
      ),
    ).toThrow();
  });
  it("traz artigos v1 como rascunhos preservando notas, autor e atualizações", () => {
    const state = {
      schemaVersion: 1,
      articles: [
        {
          id: "old",
          title: "Antiga",
          body: "<p>Texto</p>",
          authorId: "author",
          categoryId: "cat",
          publicViews: 1000,
          gmNotes: "Privado",
          visibility: { mode: "exclude-users", users: ["p"] },
          updates: [
            { title: "Nova <versão>", time: "12h", body: "<p>Atualização</p>" },
          ],
        },
      ],
      authors: [{ id: "author", name: "Lia" }],
      categories: [{ id: "cat", name: "Fronteira" }],
    };
    const [item] = convertLegacy(state, () => "new");
    expect(item?.published).toBeNull();
    expect(item?.sourceId).toBe("v1:old");
    expect(item?.draft.author).toBe("Lia");
    expect(item?.draft.category).toBe("Fronteira");
    expect(item?.draft.audience.mode).toBe("gm");
    expect(item?.draft.body).toContain("&lt;versão&gt;");
    expect(item?.notes).toBe("Privado");
  });
  it("aplica visibilidade sem depender da seleção na interface", () => {
    const a = {
      ...newItem("a").draft,
      audience: { mode: "gm" as const, users: [] },
    };
    expect(canRead(a, { id: "p", isGM: false })).toBe(false);
    expect(canRead(a, { id: "gm", isGM: true })).toBe(true);
  });
});
describe("Portal e lista", () => {
  const brand = { name: "HoloNews", location: "Meridian", tagline: "A rede" };
  it("busca ignora acentos e não depende de edições", async () => {
    const a = {
      ...newItem("a").draft,
      title: "Estação Nove",
      category: "Órbita",
    };
    const context = await portalContext([a], brand, {
      query: "estacao",
      category: "",
      page: 1,
    });
    expect(context.total).toBe(1);
    expect(context.lead).toBeNull();
  });
  it("pagina e prioriza destaque sem duplicar a manchete", async () => {
    const articles = Array.from({ length: 28 }, (_, i) => ({
      ...newItem(String(i)).draft,
      title: String(i),
      featured: i === 20,
    }));
    const c = await portalContext(articles, brand, {
      query: "",
      category: "",
      page: 1,
    });
    expect(c.lead).toMatchObject({ id: "20" });
    expect(c.cards).toHaveLength(11);
    expect(c.pages).toBe(3);
    const p = await portalContext(articles, brand, {
      query: "",
      category: "",
      page: 2,
    });
    expect(p.cards).toHaveLength(12);
    expect(p.lead).toBeNull();
  });
  it("não cai em outra matéria quando a rota é inacessível", async () => {
    const c = await portalContext([], brand, {
      articleId: "hidden",
      query: "",
      category: "",
      page: 1,
    });
    expect(c.unavailable).toBe(true);
    expect(c.article).toBeNull();
  });
  it("lista identifica revisões separadas das publicadas", () => {
    const a = newItem("a");
    a.published = { ...a.draft, title: "Original" };
    a.draft.title = "Nova versão";
    expect(managerContext([a], "", "revision").items).toHaveLength(1);
    expect(managerContext([a], "", "draft").items).toHaveLength(0);
  });
});
