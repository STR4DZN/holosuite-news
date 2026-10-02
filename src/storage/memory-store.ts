import type { Article, NewsItem } from "../domain/model";
import type { NewsStore } from "./contracts";
import { validateItem } from "../domain/validation";
export class MemoryNewsStore implements NewsStore {
  items = new Map<string, NewsItem>();
  articles = new Map<string, Article>();
  failSync = false;
  syncCount = 0;
  async list(): Promise<NewsItem[]> {
    return structuredClone([...this.items.values()]);
  }
  async get(id: string): Promise<NewsItem | null> {
    return structuredClone(this.items.get(id) ?? null);
  }
  async save(item: NewsItem, expected: number): Promise<NewsItem> {
    if ((this.items.get(item.id)?.revision ?? 0) !== expected)
      throw new Error("Conflito de revisão.");
    const next = validateItem({ ...item, revision: expected + 1 });
    this.items.set(next.id, structuredClone(next));
    return next;
  }
  async sync(item: NewsItem): Promise<void> {
    this.syncCount++;
    if (this.failSync) throw new Error("Falha de publicação.");
    if (item.published)
      this.articles.set(item.id, structuredClone(item.published));
    else this.articles.delete(item.id);
  }
  async remove(id: string, expected: number): Promise<void> {
    if (this.items.get(id)?.revision !== expected)
      throw new Error("Conflito de revisão.");
    this.articles.delete(id);
    this.items.delete(id);
  }
  async publicArticles(): Promise<Article[]> {
    return structuredClone([...this.articles.values()].reverse());
  }
}
