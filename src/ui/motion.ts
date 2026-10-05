/** Scoped editorial motion, inspired by Codrops/Motion/GSAP and Carbon.
 * WAAPI effects are finite, tracked and cancelled when a view closes/rebinds.
 */
import { NewsEffects, profileFromArticle } from "./news-effects";
export type MotionKind = "portal" | "manager" | "creator";
interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}
const ease = "cubic-bezier(.22,1,.36,1)";
function rect(element: Element): Rect {
  const { x, y, width, height } = element.getBoundingClientRect();
  return { x, y, width, height };
}
export function prefersReducedMotion(root: HTMLElement): boolean {
  return (
    root.matches(".hn-no-motion") ||
    !!root.closest(".hn-no-motion") ||
    !!root.querySelector(".hn-no-motion") ||
    globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true
  );
}
export class MotionScene {
  private newsEffects?: NewsEffects;
  private root?: HTMLElement;
  private started = false;
  private kind?: MotionKind;
  private controller?: AbortController;
  private observer?: IntersectionObserver;
  private resize?: ResizeObserver;
  private effects = new Set<Animation>();
  private nodes = new Set<HTMLElement>();
  private rows = new Map<string, Rect>();
  private seen = new Set<string>();
  private source?: Rect;
  private navRect?: { x: number; width: number };
  private navigate = false;
  private articleId = "";
  private frame?: number;
  private disclosure = new WeakMap<
    HTMLDetailsElement,
    { target: boolean; effect: Animation }
  >();

  mount(root: HTMLElement, kind: MotionKind): void {
    this.stop();
    this.newsEffects ??= new NewsEffects();
    this.root = root;
    this.controller = new AbortController();
    const signal = this.controller.signal;
    const reduced = prefersReducedMotion(root);
    root.classList.toggle("hn-motion-reduced", reduced);
    const first = !this.started || this.kind !== kind;
    this.kind = kind;
    this.started = true;
    const media = globalThis.matchMedia?.("(prefers-reduced-motion: reduce)");
    media?.addEventListener(
      "change",
      () => {
        root.classList.toggle("hn-motion-reduced", prefersReducedMotion(root));
        if (prefersReducedMotion(root)) this.finish();
      },
      { signal },
    );
    document.addEventListener(
      "visibilitychange",
      () => {
        if (document.hidden) this.finish();
      },
      { signal },
    );
    root.addEventListener("click", (event) => this.capture(event), {
      capture: true,
      signal,
    });
    if (kind === "portal") this.portal(root, first);
    else if (kind === "manager") this.manager(root, first);
    else if (first) {
      this.reveal(root.querySelector(".hn-creator-header"), 0, 10);
      root
        .querySelectorAll(
          ".hn-edit-form > .hn-field, .hn-edit-form > .hn-field-pair, .hn-edit-form > .hn-options",
        )
        .forEach((element, i) =>
          this.reveal(element, Math.min(i * 35, 210), 12),
        );
      this.reveal(root.querySelector(".hn-preview-pane"), 90, 14);
    }
    this.bindDisclosures(root);
    this.source = undefined;
    this.navigate = false;
  }
  private play(
    element: Element | null,
    frames: Keyframe[],
    duration = 380,
    delay = 0,
  ): Animation | undefined {
    if (
      !element ||
      !this.root ||
      prefersReducedMotion(this.root) ||
      document.hidden ||
      typeof element.animate !== "function"
    )
      return;
    const effect = element.animate(frames, {
      duration: duration * (this.root.dataset.hnMotion === "subtle" ? .7 : 1),
      delay,
      easing: ease,
      fill: "backwards",
    });
    this.effects.add(effect);
    void effect.finished.then(
      () => {
        this.effects.delete(effect);
        effect.cancel();
      },
      () => this.effects.delete(effect),
    );
    return effect;
  }
  private reveal(element: Element | null, delay = 0, distance = 16): void {
    if (this.root?.dataset.hnMotion === "subtle") distance *= .3;
    this.play(
      element,
      [
        { opacity: 0, transform: `translateY(${distance}px)` },
        { opacity: 1, transform: "translateY(0)" },
      ],
      480,
      delay,
    );
  }
  private capture(event: Event): void {
    const target = (event.target as Element).closest<HTMLElement>("button");
    if (!target || target.hasAttribute("disabled")) return;
    const source = target.closest(".hn-lead, .hn-card")?.querySelector("img");
    if (target.hasAttribute("data-open"))
      this.source = source ? rect(source) : undefined;
    if (
      target.matches(
        "[data-open], [data-category], [data-home], [data-back], [data-prev], [data-next], [data-clear]",
      )
    ) {
      this.navigate = true;
      const nav = this.root?.querySelector<HTMLElement>(".hn-categories"),
        track = nav?.querySelector(".hn-nav-track");
      if (nav && track)
        this.navRect = {
          x: rect(track).x - rect(nav).x + nav.scrollLeft,
          width: rect(track).width,
        };
    }
    if (target.classList.contains("hn-primary"))
      this.ripple(target, event as MouseEvent);
  }
  private ripple(button: HTMLElement, event: MouseEvent): void {
    if (!this.root || prefersReducedMotion(this.root)) return;
    const bounds = button.getBoundingClientRect(),
      size = Math.max(bounds.width, bounds.height) * 2;
    const node = document.createElement("i");
    node.className = "hn-ink-ripple";
    node.setAttribute("aria-hidden", "true");
    Object.assign(node.style, {
      width: `${size}px`,
      height: `${size}px`,
      left: `${(event.detail ? event.clientX - bounds.left : bounds.width / 2) - size / 2}px`,
      top: `${(event.detail ? event.clientY - bounds.top : bounds.height / 2) - size / 2}px`,
    });
    button.append(node);
    this.nodes.add(node);
    const effect = this.play(
      node,
      [
        { transform: "scale(.04)", opacity: 0.35 },
        { transform: "scale(1)", opacity: 0 },
      ],
      480,
    );
    const remove = () => {
      node.remove();
      this.nodes.delete(node);
    };
    if (effect) void effect.finished.then(remove, remove);
    else remove();
  }
  private portal(root: HTMLElement, first: boolean): void {
    if (first) {
      this.reveal(root.querySelector(".hn-network"), 0, -5);
      this.reveal(root.querySelector(".hn-brand"), 35, 10);
      this.reveal(root.querySelector(".hn-masthead p"), 95, 8);
      root.querySelectorAll(".hn-brand svg path").forEach((path, i) =>
        this.play(
          path,
          [
            { opacity: 0, transform: `translateY(${i ? -5 : 5}px)` },
            { opacity: i ? 0.4 : 1, transform: "translateY(0)" },
          ],
          620,
          90 + i * 95,
        ),
      );
      this.play(
        root.querySelector(".hn-signal-rail"),
        [
          { transform: "scaleX(0)", opacity: 0.2 },
          { transform: "scaleX(1)", opacity: 1 },
        ],
        720,
        140,
      );
      root.querySelectorAll(".hn-signal-rail i").forEach((packet, i) =>
        this.play(
          packet,
          [
            { transform: "translateX(-12px)", opacity: 0 },
            { transform: "translateX(0)", opacity: 1, offset: 0.25 },
            { transform: "translateX(26px)", opacity: 0 },
          ],
          760,
          140 + i * 140,
        ),
      );
    }
    this.categoryTrack(root);
    const article = root.querySelector<HTMLElement>(".hn-article"),
      id = article?.dataset.articleId ?? "";
    const newArticle = id !== this.articleId || first;
    root
      .querySelector(".hn-portal")
      ?.toggleAttribute("data-reading", !!article);
    if (article && newArticle) {
      this.newsEffects?.entry(article, profileFromArticle(article));
    } else if (!article && (first || this.navigate || this.articleId)) {
      this.seen.clear();
      this.reveal(root.querySelector(".hn-feed-heading"), 60, 12);
      this.reveal(root.querySelector(".hn-lead-text"), 100, 18);
      this.reveal(root.querySelector(".hn-lead-image"), 150, 22);
      this.play(
        root.querySelector(".hn-lead-image img"),
        [{ transform: "scale(1.045)" }, { transform: "scale(1)" }],
        720,
        100,
      );
      this.reveal(root.querySelector(".hn-section-line"), 160, 8);
    }
    this.articleId = id;
    this.observe(root, ".hn-card", ".hn-portal", 50);
    this.readingProgress(root);
  }
  private categoryTrack(root: HTMLElement): void {
    const nav = root.querySelector<HTMLElement>(".hn-categories");
    if (!nav) return;
    const track = document.createElement("span");
    track.className = "hn-nav-track";
    track.setAttribute("aria-hidden", "true");
    nav.append(track);
    this.nodes.add(track);
    const place = (animate: boolean) => {
      const button = nav.querySelector<HTMLElement>(".is-active");
      if (!button) return;
      const x = button.offsetLeft,
        width = button.offsetWidth;
      track.style.width = `${width}px`;
      track.style.transform = `translateX(${x}px)`;
      if (animate && this.navRect && width)
        this.play(
          track,
          [
            {
              transform: `translateX(${this.navRect.x}px) scaleX(${this.navRect.width / width})`,
            },
            { transform: `translateX(${x}px) scaleX(1)` },
          ],
          330,
        );
    };
    place(true);
    this.navRect = undefined;
    if (typeof ResizeObserver !== "undefined") {
      this.resize = new ResizeObserver(() => place(false));
      this.resize.observe(nav);
    }
  }
  private manager(root: HTMLElement, first: boolean): void {
    if (first) {
      this.reveal(root.querySelector(".hn-admin-header"), 0, 12);
      this.reveal(root.querySelector(".hn-manager-tools"), 70, 10);
    }
    const next = new Map<string, Rect>();
    root.querySelectorAll<HTMLElement>(".hn-manager-row").forEach((row, i) => {
      const id =
        row.querySelector<HTMLElement>("[data-edit]")?.dataset.edit ?? "";
      const bounds = rect(row),
        previous = this.rows.get(id);
      next.set(id, bounds);
      if (previous)
        this.play(
          row,
          [
            {
              transform: `translate(${previous.x - bounds.x}px,${previous.y - bounds.y}px)`,
            },
            { transform: "translate(0,0)" },
          ],
          330,
        );
      else if (i < 12) this.reveal(row, Math.min(i * 42, 220), 14);
    });
    this.rows = next;
    this.reveal(root.querySelector(".hn-empty"), 0, 10);
  }
  private observe(
    root: HTMLElement,
    selector: string,
    scroller: string,
    step: number,
  ): void {
    if (
      typeof IntersectionObserver === "undefined" ||
      prefersReducedMotion(root)
    )
      return;
    let order = 0;
    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting) {
            const element = entry.target as HTMLElement,
              key =
                element.querySelector<HTMLElement>("[data-open]")?.dataset
                  .open ?? "";
            if (!this.seen.has(key)) {
              this.seen.add(key);
              this.reveal(element, Math.min(order++ * step, 180), 22);
            }
            this.observer?.unobserve(element);
          }
        order = 0;
      },
      { root: root.querySelector(scroller), threshold: 0.08 },
    );
    root
      .querySelectorAll(selector)
      .forEach((element) => this.observer!.observe(element));
  }
  private readingProgress(root: HTMLElement): void {
    const scroller = root.querySelector<HTMLElement>(".hn-portal"),
      bar = root.querySelector<HTMLElement>(".hn-reading-progress span");
    if (!scroller || !bar) return;
    const update = () => {
      this.frame = undefined;
      const total = scroller.scrollHeight - scroller.clientHeight;
      bar.style.transform = `scaleX(${total > 0 ? Math.min(1, scroller.scrollTop / total) : 1})`;
    };
    scroller.addEventListener(
      "scroll",
      () => {
        if (!this.frame) this.frame = requestAnimationFrame(update);
      },
      { passive: true, signal: this.controller!.signal },
    );
    update();
  }
  private bindDisclosures(root: HTMLElement): void {
    root
      .querySelectorAll<HTMLDetailsElement>(".hn-options")
      .forEach((details) => {
        details.querySelector("summary")?.addEventListener(
          "click",
          (event) => {
            if (prefersReducedMotion(root)) return;
            event.preventDefault();
            const previous = this.disclosure.get(details),
              target = !(previous?.target ?? details.open);
            const current = details.getBoundingClientRect().height;
            previous?.effect.cancel();
            details.style.height = "";
            details.style.overflow = "";
            details.open = true;
            const full = details.getBoundingClientRect().height,
              style = getComputedStyle(details);
            const summary = details
              .querySelector("summary")!
              .getBoundingClientRect().height;
            const collapsed =
              summary +
              parseFloat(style.paddingTop) +
              parseFloat(style.paddingBottom) +
              parseFloat(style.borderTopWidth);
            details.style.overflow = "hidden";
            const effect = this.play(
              details,
              [
                { height: `${current}px` },
                { height: `${target ? full : collapsed}px` },
              ],
              220,
            );
            if (!effect) {
              details.open = target;
              details.style.overflow = "";
              return;
            }
            this.disclosure.set(details, { target, effect });
            this.play(
              details.querySelector(".hn-options-body"),
              target
                ? [
                    { opacity: 0, transform: "translateY(-5px)" },
                    { opacity: 1, transform: "translateY(0)" },
                  ]
                : [{ opacity: 1 }, { opacity: 0 }],
              170,
            );
            void effect.finished.then(
              () => {
                if (this.disclosure.get(details)?.effect !== effect) return;
                details.open = target;
                details.style.height = "";
                details.style.overflow = "";
                this.disclosure.delete(details);
              },
              () => {},
            );
          },
          { signal: this.controller!.signal },
        );
      });
  }
  pulsePreview(target: HTMLElement): void {
    target.getAnimations().forEach((effect) => effect.cancel());
    this.play(
      target,
      [
        { opacity: 0.65, transform: "translateY(4px)" },
        { opacity: 1, transform: "translateY(0)" },
      ],
      230,
    );
  }
  setReduced(reduced: boolean): void {
    if (!this.root) return;
    this.root.classList.toggle("hn-no-motion", reduced);
    this.root.classList.toggle(
      "hn-motion-reduced",
      prefersReducedMotion(this.root),
    );
    if (prefersReducedMotion(this.root)) this.finish();
    this.newsEffects?.preferenceChanged();
  }
  feedback(target: Element | null): void {
    this.play(
      target,
      [
        { transform: "scale(.96)", opacity: 0.6 },
        { transform: "scale(1.025)", opacity: 1, offset: 0.55 },
        { transform: "scale(1)", opacity: 1 },
      ],
      360,
    );
  }
  private finish(): void {
    this.newsEffects?.stop();
    for (const effect of this.effects) {
      try {
        effect.finish();
      } catch {
        effect.cancel();
      }
    }
    for (const node of this.nodes)
      if (node.classList.contains("hn-ink-ripple")) node.remove();
  }
  private stop(): void {
    this.newsEffects?.stop();
    this.controller?.abort();
    this.observer?.disconnect();
    this.resize?.disconnect();
    if (this.frame) cancelAnimationFrame(this.frame);
    this.frame = undefined;
    for (const effect of this.effects) effect.cancel();
    this.effects.clear();
    for (const node of this.nodes) node.remove();
    this.nodes.clear();
  }
  dispose(): void {
    this.stop();
    this.newsEffects?.dispose();
    this.newsEffects = undefined;
    this.root = undefined;
    this.started = false;
    this.rows.clear();
    this.seen.clear();
    this.source = undefined;
    this.articleId = "";
  }
}
