import { HoloNewsApplication } from "./base";
import type { Newsroom } from "../core/newsroom";
import { MODULE_ID, TEMPLATE_ROOT } from "../constants";
import { brand } from "../settings";
import { portalContext, type PortalRoute } from "../ui/context";
import { bindPortal } from "../ui/portal";
export class PortalApp extends HoloNewsApplication {
  static override DEFAULT_OPTIONS = {
    ...HoloNewsApplication.DEFAULT_OPTIONS,
    id: "holonews-portal",
    window: {
      title: "HoloNews · Portal",
      icon: "fa-solid fa-newspaper",
      resizable: true,
    },
    position: { width: 1080, height: 800 },
  };
  static PARTS = {
    content: { template: `${TEMPLATE_ROOT}/reader/portal.hbs` },
  };
  readonly route: PortalRoute = { query: "", category: "", page: 1 };
  constructor(private readonly newsroom: Newsroom) {
    super();
  }
  protected override async _prepareContext(): Promise<Record<string, unknown>> {
    return {
      ...(await portalContext(
        await this.newsroom.articles(game.user),
        brand(),
        this.route,
      )),
      reduceMotion: game.settings.get(MODULE_ID, "reduceMotion"),
      fontScale: game.settings.get(MODULE_ID, "fontScale"),
    };
  }
  protected override bind(root: HTMLElement): void {
    this.motion.mount(root, "portal");
    bindPortal(root, this.route, () => {
      void this.rerender().catch((error) => this.report(error));
    });
  }
  async openArticle(id: string): Promise<void> {
    this.route.articleId = id;
    await this.rerender();
  }
  updateMotionPreference(reduced: boolean): void {
    this.motion.setReduced(reduced);
  }
}
