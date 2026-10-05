import { validateNewsMotion, type NewsMotion } from "../domain/news-motion";

export function profileFromArticle(node: HTMLElement): NewsMotion {
  return validateNewsMotion({ entry: node.dataset.entry, alert: node.dataset.alert, strength: node.dataset.strength, pace: node.dataset.pace, priority: node.dataset.priority });
}
/** Finite effects shared by the real reader, publication alerts and GM preview. */
export class NewsEffects {
  private animations = new Set<Animation>();
  private traces = new Set<HTMLElement>();
  private controller = new AbortController();
  private scope?: HTMLElement;
  constructor() {
    globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").addEventListener("change", () => {
      if (this.reduced()) this.stop();
    }, { signal: this.controller.signal });
    if (typeof document !== "undefined") document.addEventListener("visibilitychange", () => { if (document.hidden) this.stop(); }, { signal: this.controller.signal });
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
    if (profile.entry === "none" || this.reduced()) return;
    const scale = this.scale(profile), duration = 440 * scale.time;
    const title = article.querySelector("h1"), deck = article.querySelector(".hn-deck"), label = article.querySelector(".hn-eyebrow");
    const picture = article.querySelector("figure"), image = picture?.querySelector("img") ?? null;
    const paragraphs = [...article.querySelectorAll(".hn-article-body>p,.hn-article-body>blockquote,.hn-article-body>h2")].slice(0, 4);
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
    const traces = [...this.traces];
    void Promise.all([...this.animations].map(a => a.finished.catch(() => {}))).then(() => { for (const trace of traces) { trace.remove(); this.traces.delete(trace); } });
  }
  alert(notice: HTMLElement, profile: NewsMotion): void {
    this.stop(); this.scope = notice;
    if (profile.alert === "none" || this.reduced()) return;
    const scale = this.scale(profile), duration = 350 * scale.time;
    const starts = { card: `translateX(${25 * scale.distance}px)`, ribbon: `translateY(${-18 * scale.distance}px)`, radar: `translateX(${-14 * scale.distance}px)`, stamp: `scale(${1 + .08 * scale.distance}) rotate(-2deg)`, dispatch: `translateY(${12 * scale.distance}px)`, critical: `translateY(${-9 * scale.distance}px) scale(.98)` };
    this.play(notice, [{ opacity: 0, transform: starts[profile.alert] }, { opacity: 1, transform: "none" }], duration);
    this.play(notice.querySelector(".hn-alert-rule"), [{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], duration * 1.6, 50);
    if (scale.decorative && (profile.alert === "radar" || profile.alert === "critical")) notice.querySelectorAll(".hn-alert-emblem>span").forEach((ring, i) => this.play(ring, [{ opacity: .6, transform: "scale(1)" }, { opacity: 0, transform: `scale(${profile.alert === "critical" ? 1.65 : 2})` }], 550 * scale.time, 120 + i * 180, profile.alert === "critical" ? 3 : 2));
    if (profile.alert === "stamp") this.play(notice.querySelector(".hn-alert-kicker"), [{ opacity: .4, transform: "translateY(-4px)" }, { opacity: 1, transform: "none" }], duration * .8, 80);
    if (profile.alert === "dispatch") this.play(notice.querySelector(".hn-alert-content"), [{ opacity: 0, transform: "translateX(-7px)" }, { opacity: 1, transform: "none" }], duration, 100);
  }
  preferenceChanged(): void { this.stop(); }
  stop(): void { for (const a of this.animations) a.cancel(); this.animations.clear(); for (const t of this.traces) t.remove(); this.traces.clear(); }
  dispose(): void { this.stop(); this.controller.abort(); this.scope = undefined; }
}
