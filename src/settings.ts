import { PAGE_MOTIONS, CARD_MOTIONS, HOVER_MOTIONS } from "./domain/portal-motion";
import { MODULE_ID } from "./constants";
import type { PortalBrand } from "./domain/model";
import { formatViews } from "./utils/format";
import { THEMES } from "./ui/preferences";
export function registerSettings(): void {
  const changed = () => Hooks.callAll(`${MODULE_ID}.appearanceChanged`);
  for (const [key, name, choices, value] of [
    ["pageMotion", "Transições de página", PAGE_MOTIONS, "auto"],
    ["cardMotion", "Entrada dos posts", CARD_MOTIONS, "auto"],
    ["hoverMotion", "Interação com posts", HOVER_MOTIONS, "lift"],
  ] as const) game.settings.register(MODULE_ID, key, { name, scope: "client", config: false, type: String, default: value, choices, onChange: changed });
  game.settings.register(MODULE_ID, "theme", { name: "Aparência do HoloNews", scope: "client", config: true, type: String, default: "prisma", choices: Object.fromEntries(THEMES.map(t => [t.id, t.name])), onChange: changed });
  game.settings.register(MODULE_ID, "density", { name: "Espaçamento do HoloNews", scope: "client", config: true, type: String, default: "comfortable", choices: { comfortable: "Confortável", compact: "Compacto" }, onChange: changed });
  game.settings.register(MODULE_ID, "motionStyle", { name: "Movimento do HoloNews", scope: "client", config: true, type: String, default: "full", choices: { full: "Completo", subtle: "Sutil", reduced: "Reduzido" }, onChange: changed });
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
    onChange: (reduced: boolean) => {
      Hooks.callAll(`${MODULE_ID}.motionChanged`, reduced);
      changed();
    },
  });
  game.settings.register(MODULE_ID, "fontScale", {
    name: "Tamanho do texto do HoloNews",
    scope: "client",
    config: true,
    type: Number,
    range: { min: 0.9, max: 1.4, step: 0.1 },
    default: 1,
    onChange: changed,
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
  handlebars.registerHelper("hnCheckedOption", (value: unknown) => value === true ? "selected" : "");
  handlebars.registerHelper("hnSelected", (a: unknown, b: unknown) =>
    a === b ? "selected" : "",
  );
  handlebars.registerHelper("hnViews", (value: number) => formatViews(value));
  handlebars.registerHelper("hnJoin", (value: unknown) =>
    Array.isArray(value) ? value.join(", ") : "",
  );
}
