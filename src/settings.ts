import { MODULE_ID } from "./constants";
import type { PortalBrand } from "./domain/model";
import { formatViews } from "./utils/format";
export function registerSettings(): void {
  for (const [key, name, value] of [
    ["portalName", "Nome do portal", "HoloNews"],
    ["portalTagline", "Slogan", "O seu mundo. Em transmissão."],
    ["portalLocation", "Identificação da rede", "Rede civil de notícias"],
  ]) {
    game.settings.register(MODULE_ID, key, {
      name,
      scope: "world",
      config: true,
      type: String,
      default: value,
      onChange: () => Hooks.callAll(`${MODULE_ID}.brandChanged`),
    });
  }
  game.settings.register(MODULE_ID, "reduceMotion", {
    name: "Reduzir animações do HoloNews",
    scope: "client",
    config: true,
    type: Boolean,
    default: false,
    onChange: (reduced: boolean) =>
      Hooks.callAll(`${MODULE_ID}.motionChanged`, reduced),
  });
  game.settings.register(MODULE_ID, "fontScale", {
    name: "Tamanho do texto do HoloNews",
    scope: "client",
    config: true,
    type: Number,
    range: { min: 0.9, max: 1.4, step: 0.1 },
    default: 1,
  });
}
export function brand(): PortalBrand {
  return {
    name: game.settings.get(MODULE_ID, "portalName"),
    tagline: game.settings.get(MODULE_ID, "portalTagline"),
    location: game.settings.get(MODULE_ID, "portalLocation"),
  };
}
export function registerHelpers(handlebars: any = Handlebars): void {
  handlebars.registerHelper("hnEq", (a: unknown, b: unknown) => a === b);
  handlebars.registerHelper("hnChecked", (value: unknown) =>
    value === true ? "checked" : "",
  );
  handlebars.registerHelper("hnSelected", (a: unknown, b: unknown) =>
    a === b ? "selected" : "",
  );
  handlebars.registerHelper("hnViews", (value: number) => formatViews(value));
  handlebars.registerHelper("hnJoin", (value: unknown) =>
    Array.isArray(value) ? value.join(", ") : "",
  );
}
