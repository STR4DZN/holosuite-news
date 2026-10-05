import { resolveMotion } from "../domain/portal-motion";
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
  private direction = 1;
  private returning = false;
  private feedScroll = 0;
  private openedId = "";
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
    this.bindInteractions(root);
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
      duration: duration * (this.root.closest<HTMLElement>("[data-hn-theme]")?.dataset.hnMotion === "subtle" ? .7 : 1),
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
    if (this.root?.closest<HTMLElement>("[data-hn-theme]")?.dataset.hnMotion === "subtle") distance *= .3;
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
    this.direction = target.matches("[data-prev], [data-back]") ? -1 : 1;
    this.returning = target.hasAttribute("data-back");
    if (target.hasAttribute("data-open")) {
      this.feedScroll = this.root?.querySelector(".hn-portal")?.scrollTop ?? 0;
      this.openedId = target.dataset.open ?? "";
    }
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
      const scroller = root.querySelector<HTMLElement>(".hn-portal");
      if (scroller) scroller.scrollTop = 0;
      this.page(root);
      this.newsEffects?.entry(article, profileFromArticle(article));
      this.sharedCover(article);
    } else if (article) {
      this.newsEffects?.reading(article, profileFromArticle(article));
    } else if (!article && (first || this.navigate || this.articleId)) {
      this.seen.clear();
      const scroller = root.querySelector<HTMLElement>(".hn-portal");
      if (scroller && this.navigate) scroller.scrollTop = this.returning ? this.feedScroll : 0;
      this.page(root);
      if (this.returning && this.openedId) {
        const button = [...root.querySelectorAll<HTMLElement>("[data-open]")].find(b => b.dataset.open === this.openedId);
        button?.focus({ preventScroll: true });
      }
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
  private page(root: HTMLElement): void {
    const paper = root.querySelector<HTMLElement>(".hn-paper");
    if (!paper) return;
    const recipe = resolveMotion(root.closest<HTMLElement>("[data-hn-theme]")?.dataset.hnPageMotion, root.closest<HTMLElement>("[data-hn-theme]")?.dataset.hnTheme, "page");
    paper.dataset.motionRecipe = recipe;
    if (recipe === "none") return;
    const d = root.closest<HTMLElement>("[data-hn-theme]")?.dataset.hnMotion === "subtle" ? .25 : 1;
    const starts: Record<string, string> = {
      fade: "none", slide: `translateX(${this.direction * 34*d}px)`, depth: `translateY(${15*d}px) scale(.98)`,
      fold: `perspective(1400px) rotateY(${this.direction * -5*d}deg) translateX(${this.direction * 12*d}px)`,
      aperture: `translateY(${10*d}px) scaleY(.98)`, signal: `translateY(${6*d}px)`,
    };
    if (recipe === "aperture") {
      [...paper.children].filter(n => !n.classList.contains("hn-page-trace")).slice(0,6).forEach((node,i) => this.play(node,[{opacity:.25,transform:`translateX(${(i%2 ? 16 : -16)*d}px)`},{opacity:1,transform:"none"}],400,Math.min(i*30,120)));
    }
    this.play(paper, [{ opacity: .25, transform: starts[recipe] }, { opacity: 1, transform: "none" }], 430);
    if ((recipe === "signal" || recipe === "aperture") && d === 1 && !prefersReducedMotion(root)) {
      const trace = document.createElement("span"); trace.className = `hn-page-trace hn-page-${recipe}`; trace.setAttribute("aria-hidden", "true"); paper.append(trace); this.nodes.add(trace);
      const effect = this.play(trace, recipe === "signal" ? [{ opacity: 0, transform: "scaleX(0)" }, { opacity: .8, transform: "scaleX(1)", offset: .5 }, { opacity: 0, transform: "scaleX(1)" }] : [{ opacity: .45, transform: "scaleX(.2)" }, { opacity: 0, transform: "scaleX(1)" }], 600);
      const clean = () => { trace.remove(); this.nodes.delete(trace); }; if (effect) void effect.finished.then(clean,clean); else clean();
    }
  }
  private card(element: HTMLElement, index: number, step: number): void {
    if (!this.root) return;
    const recipe = resolveMotion(this.root.closest<HTMLElement>("[data-hn-theme]")?.dataset.hnCardMotion, this.root.closest<HTMLElement>("[data-hn-theme]")?.dataset.hnTheme, "card");
    element.dataset.motionRecipe = recipe;
    if (recipe === "none") return;
    const d = this.root.closest<HTMLElement>("[data-hn-theme]")?.dataset.hnMotion === "subtle" ? .25 : 1;
    const starts: Record<string,string> = { rise: `translateY(${24*d}px)`, alternate: `translateX(${(index%2 ? 22 : -22)*d}px)`, depth: `translateY(${15*d}px) scale(.96)`, unfold: `perspective(1000px) rotateX(${7*d}deg) translateY(${12*d}px)`, editorial: `translateY(${7*d}px)` };
    const delay = Math.min(index*step, 150);
    this.play(element, [{ opacity: .15, transform: starts[recipe] }, { opacity: 1, transform: "none" }], 380, delay);
    if (recipe === "editorial") {
      this.play(element.querySelector(".hn-card-image img"), [{ opacity: .3, transform: "scale(1.04)" }, { opacity: 1, transform: "none" }], 460, delay+40);
      this.reveal(element.querySelector("h3"), delay+75, 5);
      this.reveal(element.querySelector(".hn-card-meta"), delay+100, 3);
    }
  }
  private sharedCover(article: HTMLElement): void {
    const source = this.source, picture = article.querySelector("figure");
    if (article.dataset.coverMotion === "none" || !source || !picture || !this.root || this.root.closest<HTMLElement>("[data-hn-theme]")?.dataset.hnMotion === "subtle" || resolveMotion(this.root.closest<HTMLElement>("[data-hn-theme]")?.dataset.hnPageMotion,this.root.closest<HTMLElement>("[data-hn-theme]")?.dataset.hnTheme,"page") === "none") return;
    const destination = rect(picture);
    if (!destination.width || !destination.height) return;
    this.play(picture, [{ transformOrigin: "top left", transform: `translate(${source.x-destination.x}px,${source.y-destination.y}px) scale(${source.width/destination.width},${source.height/destination.height})`, opacity: .65 }, { transformOrigin: "top left", transform: "none", opacity: 1 }], 480);
  }
  private bindInteractions(root: HTMLElement): void {
    const signal = this.controller!.signal;
    const activate = (event: Event) => {
      const target = event.target as Element;
      const card = target.closest<HTMLElement>(".hn-card, .hn-lead");
      if (!card || (event instanceof MouseEvent && event.relatedTarget instanceof Node && card.contains(event.relatedTarget))) return;
      const recipe = root.closest<HTMLElement>("[data-hn-theme]")?.dataset.hnHoverMotion || "lift";
      if (recipe === "none") return;
      if (recipe === "image") this.play(card.querySelector("img"), [{ transform: "scale(1)" }, { transform: "scale(1.035)", offset: .55 }, { transform: "scale(1)" }], 650);
      else if (recipe === "lift") this.play(card, [{ transform: "translateY(0)" }, { transform: "translateY(-3px)", offset: .5 }, { transform: "translateY(0)" }], 430);
      else if (!prefersReducedMotion(root)) {
        const line = document.createElement("i"); line.className="hn-hover-line"; line.setAttribute("aria-hidden","true"); card.append(line); this.nodes.add(line);
        const effect=this.play(line,[{transform:"scaleX(0)",opacity:0},{transform:"scaleX(1)",opacity:.9,offset:.65},{transform:"scaleX(1)",opacity:0}],600);
        const clean=()=>{line.remove();this.nodes.delete(line);}; if(effect) void effect.finished.then(clean,clean); else clean();
      }
    };
    root.addEventListener("pointerover",activate,{signal}); root.addEventListener("focusin",activate,{signal});
    root.querySelector("[data-search]")?.addEventListener("submit",()=>{this.navigate=true;this.direction=1;this.returning=false;},{signal,capture:true});
  }
  panel(node: Element | null): void { this.reveal(node,0,8); }
  replay(): void {
    if (this.root && this.kind === "portal") { this.started=false; this.mount(this.root,"portal"); }
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
              this.card(element, order++, step);
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
