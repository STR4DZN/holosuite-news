import { HoloNewsApplication } from "./base";
import { MODULE_ID, TEMPLATE_ROOT } from "../constants";
import { appearance, applyAppearance, bindPreferences, preferencesContext } from "../ui/preferences";
export class PreferencesApp extends HoloNewsApplication {
  static override DEFAULT_OPTIONS = {
    ...HoloNewsApplication.DEFAULT_OPTIONS, id: "holonews-preferences",
    window: { title: "HoloNews · Aparência", icon: "fa-solid fa-palette", resizable: true },
    position: { width: 620, height: 620 },
  };
  static PARTS = { content: { template: `${TEMPLATE_ROOT}/preferences.hbs` } };
  protected override async _prepareContext(): Promise<Record<string, unknown>> { return preferencesContext(appearance()); }
  protected override bind(root: HTMLElement): void {
    bindPreferences(root, appearance(), async (key, value) => {
      if (key === "motionStyle") await game.settings.set(MODULE_ID, "reduceMotion", value === "reduced");
      await game.settings.set(MODULE_ID, key, value);
    }, value => applyAppearance(root, value));
  }
}
