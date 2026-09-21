import type { HoloNewsApi } from "../api/public-api";
import type { Newsroom } from "../core/newsroom";
import { NewspaperEditorialApp } from "./editorial-app";
import { NewspaperReaderApp, type ReaderRoute } from "./reader-app";

export class HoloNewsApps {
  private api: HoloNewsApi | null = null;
  private reader: NewspaperReaderApp | null = null;
  private manager: NewspaperEditorialApp | null = null;
  constructor(private readonly newsroom: Newsroom) {}
  configureApi(api: HoloNewsApi): void { this.api = api; }
  openReader(route?: Partial<ReaderRoute>): unknown {
    if (!this.api) throw new Error("HoloNews API is not ready.");
    this.reader ??= new NewspaperReaderApp(this.api);
    return this.reader.openRoute(route);
  }
  openManager(): unknown {
    this.manager ??= new NewspaperEditorialApp(this.newsroom, (route) => this.openReader(route ?? { view: "home" }));
    return this.manager.render({ force: true });
  }
  refreshReader(): void { if (this.reader) void this.reader.render({ force: true }); }
  refreshManager(): void { if (this.manager) void this.manager.render({ force: true }); }
}
