import { MODULE_ID, PRIVATE_PACK } from "../constants";
import { canRead, type Article, type NewsItem } from "../domain/model";
import { validateArticle, validateItem } from "../domain/validation";
import { assertGM, assertWriter } from "../permissions/authority";
import type { NewsStore } from "./contracts";

export class FoundryNewsStore implements NewsStore {
  private documents = new Map<string, any>();
  private loaded = false;
  private packPromise?: Promise<any>;
  private pack(): Promise<any> {
    assertGM();
    if (!this.packPromise)
      this.packPromise = this.preparePack().catch((error) => {
        this.packPromise = undefined;
        throw error;
      });
    return this.packPromise;
  }
  private async preparePack(): Promise<any> {
    let pack = game.packs.get(PRIVATE_PACK);
    if (!pack) {
      assertWriter();
      const Compendium =
        (globalThis as any).foundry?.documents?.collections
          ?.CompendiumCollection ?? (globalThis as any).CompendiumCollection;
      pack = await Compendium.createCompendium({
        name: "holonews-workspace",
        label: "HoloNews · Rascunhos do mestre",
        type: "JournalEntry",
        ownership: {
          PLAYER: "NONE",
          TRUSTED: "NONE",
          ASSISTANT: "OWNER",
          GAMEMASTER: "OWNER",
        },
      });
    }
    if (pack.ownership.PLAYER !== "NONE" || pack.ownership.TRUSTED !== "NONE")
      throw new Error(
        "O compêndio HoloNews precisa ser exclusivo dos mestres. Corrija suas permissões antes de continuar.",
      );
    if (pack.locked) await pack.configure({ locked: false });
    return pack;
  }
  async list(): Promise<NewsItem[]> {
    const pack = await this.pack();
    if (!this.loaded) {
      const docs = await pack.getDocuments();
      this.documents.clear();
      for (const doc of docs)
        if (doc.getFlag(MODULE_ID, "kind") === "workspace")
          this.documents.set(
            validateItem(doc.getFlag(MODULE_ID, "item")).id,
            doc,
          );
      this.loaded = true;
    }
    return [...this.documents.values()].map((doc) =>
      validateItem(doc.getFlag(MODULE_ID, "item")),
    );
  }
  invalidate(): void {
    this.loaded = false;
    this.packPromise = undefined;
  }
  async get(id: string): Promise<NewsItem | null> {
    const pack = await this.pack();
    const document = await pack.getDocument(id);
    if (!document || document.getFlag(MODULE_ID, "kind") !== "workspace")
      return null;
    this.documents.set(id, document);
    return validateItem(document.getFlag(MODULE_ID, "item"));
  }
  async save(item: NewsItem, expected: number): Promise<NewsItem> {
    assertWriter();
    const pack = await this.pack();
    const doc = await pack.getDocument(item.id);
    const current = doc ? validateItem(doc.getFlag(MODULE_ID, "item")) : null;
    if ((current?.revision ?? 0) !== expected || (!current && expected !== 0))
      throw new Error(
        "Esta notícia mudou em outra janela. Reabra a notícia antes de salvar.",
      );
    const saved = validateItem({ ...item, revision: expected + 1 });
    assertWriter();
    const data = {
      name: saved.draft.title || "Notícia sem título",
      flags: { [MODULE_ID]: { kind: "workspace", item: saved } },
    };
    const document = doc
      ? await doc.update(data, { recursive: false })
      : await JournalEntry.create(
          { ...data, _id: saved.id },
          { pack: pack.collection, keepId: true, renderSheet: false },
        );
    if (!document) throw new Error("Não foi possível salvar a notícia.");
    this.documents.set(saved.id, document);
    return saved;
  }
  private publicDocument(id: string): any {
    return game.journal?.find(
      (doc: any) =>
        doc.getFlag(MODULE_ID, "kind") === "article" &&
        doc.getFlag(MODULE_ID, "article")?.id === id,
    );
  }
  async sync(item: NewsItem): Promise<void> {
    assertWriter();
    const doc = this.publicDocument(item.id);
    if (!item.published) {
      if (doc) await doc.delete();
      return;
    }
    const article = validateArticle(item.published, true);
    const ownership: Record<string, number> = {
      default: article.audience.mode === "all" ? 2 : 0,
    };
    for (const id of article.audience.users)
      if (game.users.get(id)) ownership[id] = 2;
    const data = {
      name: article.title,
      ownership,
      flags: {
        [MODULE_ID]: {
          kind: "article",
          article,
          publishedAt: item.publishedAt,
        },
      },
    };
    if (doc) await doc.update(data, { recursive: false });
    else if (!(await JournalEntry.create(data, { renderSheet: false })))
      throw new Error("Não foi possível publicar a notícia.");
  }
  async remove(id: string, expected: number): Promise<void> {
    assertWriter();
    const item = await this.get(id);
    if (!item || item.revision !== expected)
      throw new Error("A notícia mudou. Reabra antes de excluir.");
    const published = this.publicDocument(id);
    if (published) await published.delete();
    await this.documents.get(id).delete();
    this.documents.delete(id);
  }
  async publicArticles(): Promise<Article[]> {
    return [...(game.journal ?? [])]
      .filter((doc: any) => doc.getFlag(MODULE_ID, "kind") === "article")
      .flatMap((doc: any) => {
        try {
          const article = validateArticle(
            doc.getFlag(MODULE_ID, "article"),
            true,
          );
          return canRead(article, game.user) &&
            (game.user.isGM || doc.testUserPermission(game.user, "OBSERVER"))
            ? [
                {
                  article,
                  publishedAt: Number(
                    doc.getFlag(MODULE_ID, "publishedAt") ?? 0,
                  ),
                },
              ]
            : [];
        } catch (error) {
          console.warn("HoloNews | Notícia inválida ignorada", doc.id, error);
          return [];
        }
      })
      .sort((a, b) => b.publishedAt - a.publishedAt)
      .map((entry) => entry.article);
  }
}
