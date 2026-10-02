import type { Article, NewsItem } from "../domain/model";
export interface NewsStore {
  list(): Promise<NewsItem[]>;
  get(id: string): Promise<NewsItem | null>;
  save(item: NewsItem, expectedRevision: number): Promise<NewsItem>;
  remove(id: string, expectedRevision: number): Promise<void>;
  sync(item: NewsItem): Promise<void>;
  publicArticles(): Promise<Article[]>;
}
