import { validateNewsMotion, type NewsMotion } from "../domain/news-motion";

export function profileFromArticle(node: HTMLElement): NewsMotion {
  return validateNewsMotion({ cover: node.dataset.coverMotion, reading: node.dataset.readingMotion, entry: node.dataset.entry, alert: node.dataset.alert, strength: node.dataset.strength, pace: node.dataset.pace, priority: node.dataset.priority });
}
/** Finite effects shared by the real reader, publication alerts and GM preview. */
export class NewsEffects {
  private readingObserver?: IntersectionObserver;
  private readingArticle?: HTMLElement;
  private readingProfile?: NewsMotion;
  private readSeen = new Set<number>();
  private animations = new Set<Animation>();
  private traces = new Set<HTMLElement>();
  private controller = new AbortController();
  private scope?: HTMLElement;
  constructor() {
    globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").addEventListener("change", () => {
      if (this.reduced()) this.stop();
    }, { signal: this.controller.signal });
    if (typeof document !== "undefined") document.addEventListener("visibilitychange", () => { if (document.hidden) this.stop(); else this.preferenceChanged(); }, { signal: this.controller.signal });
  }
  private reduced(): boolean {
    return !!this.scope?.closest(".hn-no-motion") || this.scope?.dataset.hnMotion === "reduced" || globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
  }
  private scale(profile: NewsMotion): { time: number; distance: number; decorative: boolean } {
    const subtle = this.scope?.closest<HTMLElement>("[data-hn-motion]")?.dataset.hnMotion === "subtle";
    return { time: ({ quick: .7, normal: 1, cinema: 1.35 })[profile.pace] * (subtle ? .7 : 1), distance: subtle ? .3 : ({ low: .55, normal: 1, high: 1.45 })[profile.strength], decorative: !subtle && profile.strength !== "low" };
  }
  private play(node: Element | null, frames: Keyframe[], duration: number, delay = 0, iterations = 1): Animation | undefined {
    if (!node || this.reduced() || document.hidden || typeof node.animate !== "function") return;
    const animation = node.animate(frames, { duration, delay, iterations, easing: "cubic-bezier(.22,1,.36,1)", fill: "backwards" });
    this.animations.add(animation);
    void animation.finished.then(() => { this.animations.delete(animation); animation.cancel(); }, () => this.animations.delete(animation));
    return animation;
  }
  private trace(picture: Element): HTMLElement {
    const trace = document.createElement("span"); trace.className = "hn-fx-trace"; trace.setAttribute("aria-hidden", "true"); picture.append(trace); this.traces.add(trace); return trace;
  }
  entry(article: HTMLElement, profile: NewsMotion): void {
    this.stop(); this.scope = article;
    this.readingArticle = article; this.readingProfile = profile;
    this.readSeen.clear();
    if (this.reduced()) return;
    const scale = this.scale(profile), duration = 440 * scale.time;
    const title = article.querySelector("h1"), deck = article.querySelector(".hn-deck"), label = article.querySelector(".hn-eyebrow");
    const picture = profile.cover === "none" ? null : article.querySelector("figure"), image = profile.cover === "entry" ? picture?.querySelector("img") ?? null : null;
    const paragraphs: Element[] = []; // Body motion follows the reading viewport.
    const rise = (node: Element | null, distance: number, delay = 0) => this.play(node, [{ opacity: 0, transform: `translateY(${distance * scale.distance}px)` }, { opacity: 1, transform: "none" }], duration, delay);
    const recipe = profile.entry;
    if (recipe === "soft") { rise(title, 10); rise(deck, 7, 45); paragraphs.forEach((n, i) => rise(n, 5, 70 + i * 25)); this.play(image, [{ opacity: .65 }, { opacity: 1 }], duration); }
    if (recipe === "editorial") {
      rise(title, 5, 45); rise(deck, 4, 85); paragraphs.forEach((n, i) => rise(n, 3, 110 + i * 25)); this.play(image, [{ opacity: .3 }, { opacity: 1 }], duration);
      if (picture && scale.decorative) { const trace = this.trace(picture), line = document.createElement("span"); line.className = "hn-fx-line hn-fx-editorial"; trace.append(line); this.play(line, [{ transform: "scaleX(0)", opacity: 1 }, { offset: .8, transform: "scaleX(1)", opacity: 1 }, { transform: "scaleX(1)", opacity: 0 }], duration * 1.25); }
    }
    if (recipe === "slide") { this.play(image, [{ opacity: .6, transform: `translateX(${22 * scale.distance}px) scale(1.05)` }, { opacity: 1, transform: "none" }], duration); this.play(title, [{ opacity: 0, transform: `translateX(${-16 * scale.distance}px)` }, { opacity: 1, transform: "none" }], duration); rise(deck, 7, 50); paragraphs.forEach((n, i) => rise(n, 4, 90 + i * 20)); }
    if (recipe === "depth") { this.play(image, [{ transform: `scale(${1 + .07 * scale.distance})`, opacity: .75 }, { transform: "none", opacity: 1 }], duration * 1.4); rise(title, 9); rise(deck, 5, 50); paragraphs.forEach((n, i) => rise(n, 4, 100 + i * 20)); }
    if (recipe === "archive") { this.play(image, [{ opacity: .6, transform: `rotate(${-2 * scale.distance}deg) scale(.97)` }, { opacity: 1, transform: "none" }], duration); this.play(label, [{ opacity: 0, transform: "scale(1.12) rotate(-4deg)" }, { opacity: 1, transform: "none" }], duration * .8, 80); rise(title, 5, 60); rise(deck, 4, 100); paragraphs.forEach((n, i) => rise(n, 3, 130 + i * 20)); }
    if (recipe === "curtain") {
      rise(title, 6); rise(deck, 4, 55); paragraphs.forEach((n, i) => rise(n, 3, 90 + i * 20));
      if (picture && scale.decorative) { const trace = this.trace(picture); for (let i = 0; i < 2; i++) { const panel = document.createElement("span"); panel.className = "hn-fx-curtain"; trace.append(panel); this.play(panel, [{ transform: "translateX(0)" }, { transform: `translateX(${i ? 103 : -103}%)` }], duration * 1.2); } }
      else this.play(image, [{ opacity: .6 }, { opacity: 1 }], duration);
    }
    if (recipe === "hologram" || recipe === "signal") {
      rise(title, 5); rise(deck, 4, 55); paragraphs.forEach((n, i) => rise(n, 3, 90 + i * 20)); this.play(image, [{ opacity: .6 }, { opacity: 1 }], duration);
      if (picture && scale.decorative) {
        const trace = this.trace(picture);
        for (let i = 0; i < 4; i++) { const corner = document.createElement("span"); corner.className = "hn-fx-corner"; trace.append(corner); this.play(corner, [{ opacity: 0, transform: "scale(.6)" }, { offset: .25, opacity: .9, transform: "scale(1)" }, { offset: .8, opacity: .9, transform: "scale(1)" }, { opacity: 0, transform: "scale(1.05)" }], duration * 1.65, i * 15); }
        if (recipe === "hologram") { const beam = document.createElement("span"); beam.className = "hn-fx-beam"; trace.append(beam); this.play(beam, [{ transform: "translateX(-110%)", opacity: 0 }, { offset: .15, opacity: .8 }, { offset: .8, opacity: .8 }, { transform: "translateX(720%)", opacity: 0 }], duration * 1.6); }
        else { const grid = document.createElement("span"); grid.className = "hn-fx-grid"; trace.append(grid); this.play(grid, [{ opacity: 0 }, { offset: .25, opacity: .18 }, { offset: .75, opacity: .08 }, { opacity: 0 }], duration * 1.6); for (let i = 0; i < 2; i++) { const line = document.createElement("span"); line.className = "hn-fx-line"; trace.append(line); this.play(line, [{ transform: "translateY(0)", opacity: 0 }, { offset: .15, opacity: .65 }, { transform: `translateY(${picture.clientHeight}px)`, opacity: 0 }], duration * 1.3, 70 + i * 90); } }
      }
    }
    this.cover(article, profile);
    this.reading(article, profile);
    const traces = [...this.traces];
    void Promise.all([...this.animations].map(a => a.finished.catch(() => {}))).then(() => { for (const trace of traces) { trace.remove(); this.traces.delete(trace); } });
  }
  private cover(article: HTMLElement, profile: NewsMotion): void {
    const picture = article.querySelector("figure"), image = picture?.querySelector("img");
    if (!picture || !image || profile.cover === "entry" || profile.cover === "none") return;
    const { time, distance, decorative } = this.scale(profile), duration = 850 * time;
    if (profile.cover === "focus") this.play(image, [{ opacity: .6, transform: `scale(${1 + .09 * distance})` }, { opacity: 1, transform: "none" }], duration);
    if (profile.cover === "pan") this.play(image, [{ transform: `scale(1.08) translateX(${-3 * distance}%)` }, { transform: "scale(1.04) translateX(1%)", offset: .7 }, { transform: "none" }], duration * 1.25);
    if (profile.cover === "reveal" && decorative) {
      const trace = this.trace(picture);
      for (let i = 0; i < 5; i++) {
        const band = document.createElement("i"); band.className = "hn-cover-band";
        band.style.left = `${i * 20}%`; trace.append(band);
        this.play(band, [{ transform: "scaleY(1)" }, { transform: "scaleY(0)" }], duration * .65, i * 45 * time);
      }
    }
    if (profile.cover === "frame" && decorative) {
      const trace = this.trace(picture);
      for (let i = 0; i < 4; i++) {
        const line = document.createElement("i"); line.className = `hn-cover-edge hn-cover-edge-${i}`; trace.append(line);
        const axis = i % 2 ? "Y" : "X";
        this.play(line, [{ transform: `scale${axis}(0)`, opacity: .8 }, { transform: `scale${axis}(1)`, opacity: .8, offset: .7 }, { transform: `scale${axis}(1)`, opacity: 0 }], duration, i * 60 * time);
      }
    }
    if (!decorative) this.play(image, [{ opacity: .65 }, { opacity: 1 }], duration * .5);
  }
  reading(article: HTMLElement, profile: NewsMotion): void {
    this.readingObserver?.disconnect(); this.scope = article;
    this.readingArticle = article; this.readingProfile = profile;
    if (profile.reading === "none" || this.reduced() || typeof IntersectionObserver === "undefined") return;
    const scale = this.scale(profile);
    const blocks = [...article.querySelectorAll<HTMLElement>(".hn-article-body > *")];
    this.readingObserver = new IntersectionObserver(entries => {
      let order = 0;
      for (const item of entries) {
        if (!item.isIntersecting) continue;
        const node = item.target as HTMLElement, index = blocks.indexOf(node);
        this.readingObserver?.unobserve(node);
        if (this.readSeen.has(index) || this.reduced() || document.hidden) continue;
        this.readSeen.add(index);
        const d = scale.distance, mode = profile.reading;
        const transform = mode === "lateral" ? `translateX(${(index % 2 ? 12 : -12) * d}px)` : mode === "depth" ? `translateY(${8*d}px) scale(.985)` : `translateY(${(mode === "editorial" ? 5 : 14)*d}px)`;
        this.play(node, [{ opacity: .25, transform }, { opacity: 1, transform: "none" }], 360 * scale.time, Math.min(order++ * 30, 120));
        if (mode === "editorial" && scale.decorative && node.matches("h2,h3,blockquote")) {
          const line = document.createElement("i"); line.className = "hn-reading-rule"; line.setAttribute("aria-hidden", "true"); node.append(line); this.traces.add(line);
          const effect = this.play(line, [{ transform: "scaleX(0)", opacity: .85 }, { transform: "scaleX(1)", opacity: .85, offset: .75 }, { transform: "scaleX(1)", opacity: 0 }], 560*scale.time);
          const clean = () => { line.remove(); this.traces.delete(line); };
          if (effect) void effect.finished.then(clean, clean); else clean();
        }
      }
    }, { root: article.closest(".hn-portal, [data-live-preview]"), threshold: 0, rootMargin: "0px 0px -20px 0px" });
    blocks.forEach(node => this.readingObserver!.observe(node));
  }
  alert(notice: HTMLElement, profile: NewsMotion): void {
    this.stop(); this.readingArticle = undefined; this.readingProfile = undefined; this.scope = notice;
    if (profile.alert === "none" || this.reduced()) return;
    const scale = this.scale(profile), duration = 350 * scale.time;
    const starts = { card: `translateX(${25 * scale.distance}px)`, ribbon: `translateY(${-18 * scale.distance}px)`, radar: `translateX(${-14 * scale.distance}px)`, stamp: `scale(${1 + .08 * scale.distance}) rotate(-2deg)`, dispatch: `translateY(${12 * scale.distance}px)`, critical: `translateY(${-9 * scale.distance}px) scale(.98)` };
    this.play(notice, [{ opacity: 0, transform: starts[profile.alert] }, { opacity: 1, transform: "none" }], duration);
    this.play(notice.querySelector(".hn-alert-rule"), [{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], duration * 1.6, 50);
    if (scale.decorative && (profile.alert === "radar" || profile.alert === "critical")) notice.querySelectorAll(".hn-alert-emblem>span").forEach((ring, i) => this.play(ring, [{ opacity: .6, transform: "scale(1)" }, { opacity: 0, transform: `scale(${profile.alert === "critical" ? 1.65 : 2})` }], 550 * scale.time, 120 + i * 180, profile.alert === "critical" ? 3 : 2));
    if (profile.alert === "stamp") this.play(notice.querySelector(".hn-alert-kicker"), [{ opacity: .4, transform: "translateY(-4px)" }, { opacity: 1, transform: "none" }], duration * .8, 80);
    if (profile.alert === "dispatch") this.play(notice.querySelector(".hn-alert-content"), [{ opacity: 0, transform: "translateX(-7px)" }, { opacity: 1, transform: "none" }], duration, 100);
  }
  preferenceChanged(): void { this.stop(); if (this.readingArticle?.isConnected && this.readingProfile) this.reading(this.readingArticle, this.readingProfile); }
  stop(): void { this.readingObserver?.disconnect(); for (const a of this.animations) a.cancel(); this.animations.clear(); for (const t of this.traces) t.remove(); this.traces.clear(); }
  dispose(): void { this.stop(); this.controller.abort(); this.scope = undefined; this.readingArticle = undefined; this.readingProfile = undefined; }
}
