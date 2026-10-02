import { HoloNewsError } from "../domain/errors";
import { MotionScene } from "../ui/motion";

const globalFoundry = () => (globalThis as any).foundry;

function resolveApplicationBase(): any {
  const api = globalFoundry()?.applications?.api;
  if (api?.ApplicationV2 && api?.HandlebarsApplicationMixin)
    return api.HandlebarsApplicationMixin(api.ApplicationV2);
  return (
    (globalThis as any).Application ??
    api?.ApplicationV2 ??
    class {
      element: HTMLElement | null = null;
      render(): this {
        return this;
      }
      close(): Promise<void> {
        return Promise.resolve();
      }
    }
  );
}

const RuntimeApplicationBase = resolveApplicationBase();

export abstract class HoloNewsApplication extends RuntimeApplicationBase {
  protected readonly motion = new MotionScene();
  static DEFAULT_OPTIONS = {
    id: "holosuite-news-app",
    tag: "section",
    classes: ["hsn-window"],
    window: {
      title: "HoloNews",
      icon: "fa-solid fa-newspaper",
      resizable: true,
    },
    position: { width: 780, height: 720 },
  };

  constructor(options: object = {}) {
    super(options);
  }

  async close(options: object = {}): Promise<void> {
    this.motion.dispose();
    await (
      super.close as ((options?: object) => Promise<void>) | undefined
    )?.call(this, options);
  }

  protected root(): HTMLElement | null {
    const element = (this as any).element;
    if (element instanceof HTMLElement) return element;
    if (element?.[0] instanceof HTMLElement) return element[0];
    return null;
  }

  protected abstract bind(root: HTMLElement): void;

  protected async _prepareContext(): Promise<Record<string, unknown>> {
    return {};
  }

  async _onRender(context: unknown, options: unknown): Promise<void> {
    await (
      super._onRender as
        ((context: unknown, options: unknown) => void | Promise<void>) | undefined
    )?.call(this, context, options);
    const root = this.root();
    if (root) {
      root.classList.toggle(
        "hn-no-motion",
        (globalThis as any).game?.settings?.get?.(
          "holosuite-news",
          "reduceMotion",
        ) === true,
      );
      this.bind(root);
    }
  }

  activateListeners(html: any): void {
    (super.activateListeners as ((html: any) => void) | undefined)?.call(
      this,
      html,
    );
    const root = html?.[0] instanceof HTMLElement ? html[0] : html;
    if (root instanceof HTMLElement) this.bind(root);
  }

  protected async rerender(): Promise<void> {
    // Background updates must never reopen a window that closed while awaiting data.
    await (this as any).render({ force: false });
  }

  protected report(error: unknown): void {
    const message =
      error instanceof HoloNewsError
        ? error.message
        : `HoloNews: ${String(error)}`;
    console.error(error);
    (globalThis as any).ui?.notifications?.error?.(message);
  }
}

export function assertEditorialAccess(): void {
  if ((globalThis as any).game?.user?.isGM !== true)
    throw new HoloNewsError(
      "NEWSPAPER_PERMISSION_DENIED",
      "The Editorial Manager is GM-only.",
    );
}

export async function confirmAction(
  title: string,
  content: string,
): Promise<boolean> {
  const dialogV2 = globalFoundry()?.applications?.api?.DialogV2;
  if (dialogV2?.confirm)
    return dialogV2.confirm({
      window: { title },
      content,
      yes: { label: "Confirmar" },
      no: { label: "Cancelar" },
    });
  const legacyDialog = (globalThis as any).Dialog;
  if (legacyDialog?.confirm)
    return new Promise((resolve) =>
      legacyDialog.confirm({
        title,
        content,
        yes: () => resolve(true),
        no: () => resolve(false),
        defaultYes: false,
      }),
    );
  return globalThis.confirm?.(content) ?? false;
}
