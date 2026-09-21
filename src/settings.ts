import { MODULE_ID } from "./constants";
import { formatViews } from "./utils/format";

const WORLD_BOOLEAN_SETTINGS = {
  showViews: ["Mostrar visualizações narrativas", true],
  showAuthors: ["Mostrar autores", true],
  showDates: ["Mostrar datas", true],
  showArchive: ["Mostrar arquivo", true],
  allowSearch: ["Permitir busca", true],
  showBadges: ["Mostrar badges", true],
  openLatestAutomatically: ["Abrir última edição automaticamente", true],
  markAsRead: ["Marcar notícias como lidas", true]
} as const;

export function registerSettings(): void {
  for (const [key, [name, defaultValue]] of Object.entries(WORLD_BOOLEAN_SETTINGS)) {
    game.settings.register(MODULE_ID, key, { name, scope: "world", config: false, type: Boolean, default: defaultValue });
  }
  game.settings.register(MODULE_ID, "locale", { name: "Localidade dos números", scope: "world", config: false, type: String, default: "pt-BR" });
  game.settings.register(MODULE_ID, "fontScale", { name: "Tamanho do texto do HoloNews", hint: "Ajusta apenas o Reader.", scope: "client", config: true, type: Number, range: { min: 0.85, max: 1.35, step: 0.05 }, default: 1 });
  game.settings.register(MODULE_ID, "reduceMotion", { name: "Reduzir animações do HoloNews", scope: "client", config: true, type: Boolean, default: false });
  game.settings.register(MODULE_ID, "highContrast", { name: "Alto contraste no HoloNews", scope: "client", config: true, type: Boolean, default: false });
  game.settings.register(MODULE_ID, "readState", { scope: "client", config: false, type: Object, default: { articles: {}, issues: {} } });
}

export function getClientPreferences(): { fontScale: number; reduceMotion: boolean; highContrast: boolean } {
  return {
    fontScale: Number(game.settings.get(MODULE_ID, "fontScale") ?? 1),
    reduceMotion: game.settings.get(MODULE_ID, "reduceMotion") === true,
    highContrast: game.settings.get(MODULE_ID, "highContrast") === true
  };
}

export function registerHandlebarsHelpers(): void {
  Handlebars.registerHelper("hsnEq", (left: unknown, right: unknown) => left === right);
  Handlebars.registerHelper("hsnIncludes", (values: unknown, value: unknown) => Array.isArray(values) && values.includes(value));
  Handlebars.registerHelper("hsnFormatViews", (value: number, locale?: string) => formatViews(value, locale));
  Handlebars.registerHelper("hsnSelected", (left: unknown, right: unknown) => left === right ? "selected" : "");
  Handlebars.registerHelper("hsnChecked", (value: unknown) => value === true ? "checked" : "");
  Handlebars.registerHelper("hsnJoin", (values: unknown, separator = ", ") => Array.isArray(values) ? values.join(separator) : "");
}
