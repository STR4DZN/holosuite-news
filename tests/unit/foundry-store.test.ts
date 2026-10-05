import { describe, it, expect, vi, afterEach } from "vitest";
import { FoundryNewsStore } from "../../src/storage/foundry-store";
import { PRIVATE_PACK } from "../../src/constants";
import { newItem } from "../../src/domain/model";
function fixture() {
  const docs = new Map<string, any>(),
    journals: any[] = [],
    writes: any[] = [];
  const pack: any = {
    collection: PRIVATE_PACK,
    ownership: {
      PLAYER: "NONE",
      TRUSTED: "NONE",
      ASSISTANT: "OWNER",
      GAMEMASTER: "OWNER",
    },
    locked: false,
    getDocument: async (id: string) => docs.get(id),
    getDocuments: async () => [...docs.values()],
  };
  function document(data: any, privateDoc: boolean) {
    const doc: any = {
      id: data._id ?? `public-${journals.length}`,
      flags: structuredClone(data.flags),
      ownership: data.ownership,
      name: data.name,
      getFlag: (scope: string, key: string) => doc.flags[scope]?.[key],
      testUserPermission: (user: any) =>
        (doc.ownership?.[user.id] ?? doc.ownership?.default ?? 0) >= 2,
      update: async (next: any, options: any) => {
        writes.push({ next, options });
        Object.assign(doc, structuredClone(next));
        return doc;
      },
      delete: async () => {
        if (privateDoc) docs.delete(doc.id);
        else journals.splice(journals.indexOf(doc), 1);
      },
    };
    return doc;
  }
  const user = { id: "gm", name: "GM", isGM: true, active: true },
    users: any = [user, { id: "iris", isGM: false, active: true }];
  users.get = (id: string) => users.find((u: any) => u.id === id);
  vi.stubGlobal("game", {
    user,
    users,
    packs: new Map([[PRIVATE_PACK, pack]]),
    journal: journals,
  });
  vi.stubGlobal("JournalEntry", {
    create: async (data: any, options: any) => {
      const privateDoc = options?.pack === PRIVATE_PACK;
      const doc = document(data, privateDoc);
      if (privateDoc) docs.set(doc.id, doc);
      else journals.push(doc);
      return doc;
    },
  });
  return { store: new FoundryNewsStore(), docs, journals, writes, user, pack };
}
afterEach(() => vi.unstubAllGlobals());
describe("Adaptador Foundry", () => {
  it("armazena rascunhos no compêndio privado e atualiza um artigo por publicação", async () => {
    const { store, docs, journals } = fixture();
    let item = newItem("article000000001");
    item.draft.title = "Notícia";
    item.draft.body = "<p>Texto</p>";
    item.notes = "Segredo";
    item = await store.save(item, 0);
    expect(docs.size).toBe(1);
    expect(journals).toHaveLength(0);
    item.published = item.draft;
    await store.sync(item);
    expect(journals).toHaveLength(1);
    expect(JSON.stringify(journals[0].flags)).not.toContain("Segredo");
    await store.sync(item);
    expect(journals).toHaveLength(1);
  });
  it("substitui a permissão inteira ao trocar jogadores e remove mapa antigo", async () => {
    const { store, journals, writes } = fixture();
    const item = newItem("article000000001");
    item.draft.title = "Título";
    item.draft.body = "Texto";
    item.published = {
      ...item.draft,
      audience: { mode: "selected", users: ["iris"] },
    };
    await store.sync(item);
    expect(journals[0].ownership).toEqual({ default: 0, iris: 2 });
    item.published = { ...item.draft, audience: { mode: "gm", users: [] } };
    await store.sync(item);
    expect(journals[0].ownership).toEqual({ default: 0 });
    expect(writes[0].options.recursive).toBe(false);
  });
  it("verifica a revisão do documento antes de salvar", async () => {
    const { store } = fixture();
    const item = await store.save(newItem("article000000001"), 0);
    await expect(store.save(item, 0)).rejects.toThrow("mudou");
  });
  it("recusa compêndio com acesso para jogadores", async () => {
    const { store, pack } = fixture();
    pack.ownership.PLAYER = "OBSERVER";
    await expect(store.list()).rejects.toThrow("exclusivo");
  });
  it("leituras aceitam segundo GM; gravação direta fica no coordenador e jogadores são negados", async () => {
    const { store, user } = fixture();
    (globalThis as any).game.users.push({
      id: "a",
      name: "Outro",
      isGM: true,
      active: true,
    });
    expect(await store.list()).toEqual([]);
    await expect(store.save(newItem("article000000001"), 0)).rejects.toThrow(
      "mestre responsável",
    );
    user.isGM = false;
    await expect(store.list()).rejects.toThrow("exclusivo");
  });
  it("filtra artigos negados até se o cliente receber o documento", async () => {
    const { store, user } = fixture();
    const item = newItem("article000000001");
    item.draft.title = "Título";
    item.draft.body = "Texto";
    item.published = {
      ...item.draft,
      audience: { mode: "selected", users: ["iris"] },
    };
    await store.sync(item);
    user.isGM = false;
    expect(await store.publicArticles()).toEqual([]);
    user.id = "iris";
    expect(await store.publicArticles()).toHaveLength(1);
  });
});
