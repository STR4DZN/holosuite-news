import {
  canRead,
  newItem,
  type Article,
  type Backup,
  type Identity,
  type NewsItem,
} from "../domain/model";
import {
  validateArticle,
  validateBackup,
  validateItem,
} from "../domain/validation";
import type { NewsStore } from "../storage/contracts";

export class Newsroom {
  private queue: Promise<unknown> = Promise.resolve();
  constructor(
    readonly store: NewsStore,
    private readonly authorize: () => void,
    private readonly id: () => string = () => crypto.randomUUID(),
    private readonly changed: () => void = () => {},
  ) {}
  private write<T>(action: () => Promise<T>): Promise<T> {
    const result = this.queue.then(() => {
      this.authorize();
      return action();
    });
    this.queue = result.catch(() => {});
    return result;
  }
  async list(): Promise<NewsItem[]> {
    this.authorize();
    return this.store.list();
  }
  async get(id: string): Promise<NewsItem> {
    this.authorize();
    const item = await this.store.get(id);
    if (!item) throw new Error("Notícia não encontrada.");
    return item;
  }
  async articles(user: Identity): Promise<Article[]> {
    return (await this.store.publicArticles()).filter((article) =>
      canRead(article, user),
    );
  }
  create(): Promise<NewsItem> {
    return this.write(async () => {
      const item = await this.store.save(newItem(this.id()), 0);
      this.changed();
      return item;
    });
  }
  save(
    id: string,
    draft: Article,
    notes: string,
    expected: number,
  ): Promise<NewsItem> {
    return this.write(async () => {
      const item = await this.get(id);
      if (draft.id !== id)
        throw new Error("Identificador da notícia inválido.");
      const next = validateItem({
        ...item,
        draft: validateArticle(draft),
        notes,
        updatedAt: Date.now(),
      });
      const saved = await this.store.save(next, expected);
      this.changed();
      return saved;
    });
  }
  publish(id: string, expected: number): Promise<NewsItem> {
    return this.write(async () => {
      const item = await this.get(id);
      const next = await this.store.save(
        {
          ...item,
          draft: validateArticle(item.draft, true),
          published: validateArticle(item.draft, true),
          publishedAt: item.publishedAt ?? Date.now(),
          pending: true,
        },
        expected,
      );
      return this.synchronize(next);
    });
  }
  unpublish(id: string, expected: number): Promise<NewsItem> {
    return this.write(async () => {
      const item = await this.get(id);
      return this.synchronize(
        await this.store.save(
          { ...item, published: null, publishedAt: null, pending: true },
          expected,
        ),
      );
    });
  }
  private async synchronize(item: NewsItem): Promise<NewsItem> {
    try {
      await this.store.sync(item);
      return await this.store.save({ ...item, pending: false }, item.revision);
    } finally {
      this.changed();
    }
  }
  retry(id: string): Promise<NewsItem> {
    return this.write(async () => this.synchronize(await this.get(id)));
  }
  async recover(): Promise<void> {
    for (const item of await this.list())
      if (item.pending) await this.retry(item.id);
  }
  duplicate(id: string): Promise<NewsItem> {
    return this.write(async () => {
      const original = await this.get(id),
        item = newItem(this.id());
      item.draft = {
        ...structuredClone(original.draft),
        id: item.id,
        title: `${original.draft.title || "Sem título"} — cópia`,
        featured: false,
      };
      item.notes = original.notes;
      const saved = await this.store.save(item, 0);
      this.changed();
      return saved;
    });
  }
  remove(id: string, expected: number): Promise<void> {
    return this.write(async () => {
      await this.store.remove(id, expected);
      this.changed();
    });
  }
  async backup(): Promise<Backup> {
    return {
      format: "holonews",
      schemaVersion: 2,
      exportedAt: Date.now(),
      items: await this.list(),
    };
  }
  importBackup(value: unknown): Promise<number> {
    const backup = validateBackup(value);
    return this.write(async () => {
      // Always import as fresh drafts: never overwrite or expose content from a backup.
      let count = 0;
      for (const original of backup.items) {
        const item = newItem(this.id());
        item.draft = { ...structuredClone(original.draft), id: item.id };
        item.notes = original.notes;
        await this.store.save(item, 0);
        count++;
      }
      this.changed();
      return count;
    });
  }
}
