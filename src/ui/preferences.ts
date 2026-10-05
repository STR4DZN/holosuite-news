import { MODULE_ID } from "../constants";
export const THEMES = [
  { id: "prisma", name: "Prisma", detail: "Transmissão holográfica", color: "#bda5e8" },
  { id: "gazeta", name: "Gazeta", detail: "Jornal da rede civil", color: "#d7ab91" },
  { id: "obsidiana", name: "Obsidiana", detail: "Edição de prestígio", color: "#d5bb80" },
  { id: "aurora", name: "Aurora", detail: "Uma rede mais próxima", color: "#abd2c3" },
  { id: "terminal", name: "Terminal", detail: "CIVNET / RX: ONLINE", color: "#bbd593" },
  { id: "dossie", name: "Dossiê", detail: "Arquivo da rede civil", color: "#e4af88" },
] as const;
export interface Appearance {
  theme: string;
  fontScale: number;
  density: "comfortable" | "compact";
  motionStyle: "full" | "subtle" | "reduced";
}
export function appearance(): Appearance {
  const get = (key: string) => (globalThis as any).game?.settings?.get?.(MODULE_ID, key);
  const theme = get("theme"), fontScale = Number(get("fontScale")), motion = get("motionStyle");
  return {
    theme: THEMES.some(t => t.id === theme) ? theme : "prisma",
    fontScale: Number.isFinite(fontScale) ? Math.max(.9, Math.min(1.4, fontScale)) : 1,
    density: get("density") === "compact" ? "compact" : "comfortable",
    motionStyle: get("reduceMotion") === true || motion === "reduced" ? "reduced" : motion === "subtle" ? "subtle" : "full",
  };
}
export function applyAppearance(root: HTMLElement, value = appearance()): void {
  root.dataset.hnTheme = value.theme;
  root.dataset.hnDensity = value.density;
  root.dataset.hnMotion = value.motionStyle;
  root.style.setProperty("--hn-font-scale", String(value.fontScale));
  // Older templates could shadow the scale on their inner portal.
  root.querySelectorAll<HTMLElement>(".hn-portal").forEach(n => n.style.removeProperty("--hn-font-scale"));
  root.classList.toggle("hn-no-motion", value.motionStyle === "reduced");
  root.querySelectorAll<HTMLElement>(".hn-no-motion").forEach(n => n.classList.remove("hn-no-motion"));
}
export function preferencesContext(value: Appearance): Record<string, unknown> {
  return { ...value, scalePercent: Math.round(value.fontScale * 100), themes: THEMES.map(t => ({ ...t, selected: t.id === value.theme })) };
}
export function bindPreferences(root: HTMLElement, initial: Appearance, save: (key: string, value: string | number) => Promise<unknown>, changed: (value: Appearance) => void): void {
  const current = { ...initial };
  let pending = Promise.resolve();
  function update(key: keyof Appearance, value: string | number): void {
    Object.assign(current, { [key]: value });
    changed({ ...current });
    root.querySelectorAll<HTMLElement>("[data-theme-choice]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.themeChoice === current.theme)));
    const percent = root.querySelector("[data-scale-percent]");
    if (percent) percent.textContent = `${Math.round(current.fontScale * 100)}%`;
    const status = root.querySelector("[data-preference-status]");
    if (status) status.textContent = "Salvando preferências…";
    pending = pending.catch(() => {}).then(async () => {
      try { await save(key, value); if (status) status.textContent = "Preferências salvas para você."; }
      catch (error) { if (status) status.textContent = "Não foi possível salvar. Tente novamente."; console.error("HoloNews", error); }
    });
  }
  root.querySelectorAll<HTMLButtonElement>("[data-theme-choice]").forEach(b => b.onclick = () => update("theme", b.dataset.themeChoice!));
  root.querySelector<HTMLInputElement>("[name=fontScale]")?.addEventListener("input", e => update("fontScale", Number((e.target as HTMLInputElement).value)));
  for (const key of ["density", "motionStyle"] as const)
    root.querySelector<HTMLSelectElement>(`[name=${key}]`)?.addEventListener("change", e => update(key, (e.target as HTMLSelectElement).value));
  root.querySelector("form")?.addEventListener("submit", e => e.preventDefault());
}
