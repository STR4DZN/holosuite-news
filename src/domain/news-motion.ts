import { COVER_MOTIONS, READING_MOTIONS } from "./portal-motion";
export const ENTRIES = {
  none: "Sem entrada", soft: "Suave", editorial: "Editorial", hologram: "Holograma",
  slide: "Deslizamento", curtain: "Abertura", depth: "Profundidade", archive: "Arquivo", signal: "Sinal",
} as const;
export const ALERTS = {
  none: "Sem alerta", card: "Cartão", ribbon: "Faixa", radar: "Radar",
  stamp: "Selo", dispatch: "Comunicado", critical: "Alerta crítico",
} as const;
export const STRENGTHS = { low: "Discreta", normal: "Equilibrada", high: "Expressiva" } as const;
export const PACES = { quick: "Ágil", normal: "Natural", cinema: "Cinemático" } as const;
export const PRIORITIES = { normal: "Normal", important: "Importante", urgent: "Muito urgente" } as const;
export interface NewsMotion {
  entry: keyof typeof ENTRIES;
  cover: keyof typeof COVER_MOTIONS;
  reading: keyof typeof READING_MOTIONS;
  alert: keyof typeof ALERTS;
  strength: keyof typeof STRENGTHS;
  pace: keyof typeof PACES;
  priority: keyof typeof PRIORITIES;
}
export function defaultNewsMotion(urgent = false): NewsMotion {
  return { cover: "entry", reading: "flow", entry: "soft", alert: urgent ? "critical" : "card", strength: "normal", pace: "normal", priority: urgent ? "urgent" : "normal" };
}
function choice<T extends string>(value: unknown, options: Record<T, string>, fallback: T): T {
  if (value === undefined) return fallback;
  if (typeof value !== "string" || !Object.hasOwn(options, value))
    throw new Error("Configuração de animação inválida.");
  return value as T;
}
export function validateNewsMotion(value: unknown, urgent = false): NewsMotion {
  const defaults = defaultNewsMotion(urgent);
  if (value === undefined) return defaults;
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Configuração de animação inválida.");
  const x = value as Record<string, unknown>;
  return {
    cover: choice(x.cover, COVER_MOTIONS, defaults.cover), reading: choice(x.reading, READING_MOTIONS, defaults.reading),
    entry: choice(x.entry, ENTRIES, defaults.entry), alert: choice(x.alert, ALERTS, defaults.alert),
    strength: choice(x.strength, STRENGTHS, defaults.strength), pace: choice(x.pace, PACES, defaults.pace),
    priority: choice(x.priority, PRIORITIES, defaults.priority),
  };
}
export function motionOptions(profile: NewsMotion): Record<string, unknown> {
  const list = (options: Record<string, string>, current: string) => Object.entries(options).map(([value, label]) => ({ value, label, selected: value === current }));
  return {
    covers: list(COVER_MOTIONS, profile.cover), readings: list(READING_MOTIONS, profile.reading),
    entries: list(ENTRIES, profile.entry), alerts: list(ALERTS, profile.alert),
    strengths: list(STRENGTHS, profile.strength), paces: list(PACES, profile.pace), priorities: list(PRIORITIES, profile.priority),
  };
}
