/** Editorial motion catalog. Values are stable preference keys. */
export const PAGE_MOTIONS = { auto: "Conforme o tema", fade: "Dissolução", slide: "Deslizamento direcional", depth: "Profundidade", fold: "Virada editorial", aperture: "Abertura em camadas", signal: "Transmissão", none: "Sem transição" } as const;
export const CARD_MOTIONS = { auto: "Conforme o tema", rise: "Cascata", alternate: "Alternância lateral", depth: "Profundidade", unfold: "Desdobramento", editorial: "Montagem editorial", none: "Sem entrada" } as const;
export const HOVER_MOTIONS = { lift: "Elevação", image: "Aproximação da imagem", frame: "Moldura luminosa", none: "Sem efeito" } as const;
export const COVER_MOTIONS = { entry: "Acompanhar entrada", focus: "Aproximação cinematográfica", pan: "Travessia da imagem", reveal: "Revelação em faixas", frame: "Moldura em construção", none: "Sem movimento na capa" } as const;
export const READING_MOTIONS = { flow: "Fluxo de leitura", lateral: "Entrada lateral", depth: "Camadas de profundidade", editorial: "Filetes editoriais", none: "Sem movimento no texto" } as const;
export const THEME_MOTION = {
  prisma: { page: "signal", card: "depth" }, gazeta: { page: "fold", card: "editorial" },
  obsidiana: { page: "aperture", card: "unfold" }, aurora: { page: "depth", card: "rise" },
  terminal: { page: "signal", card: "alternate" }, dossie: { page: "slide", card: "unfold" },
  orbital: { page: "depth", card: "unfold" }, pulsar: { page: "signal", card: "alternate" }, nexo: { page: "aperture", card: "editorial" },
} as const;
export function resolveMotion(value: string | undefined, theme: string | undefined, kind: "page" | "card"): string {
  const options = kind === "page" ? PAGE_MOTIONS : CARD_MOTIONS;
  if (value && value !== "auto" && Object.hasOwn(options, value)) return value;
  return (THEME_MOTION[theme as keyof typeof THEME_MOTION] ?? THEME_MOTION.prisma)[kind];
}
