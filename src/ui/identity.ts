/** Presentation only: stable category colors and estimated reading time. */
export function channelTone(category: string): number {
  const key = category.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
  const known: Record<string, number> = { meridian: 0, fronteira: 1, cotidiano: 2, economia: 3 };
  if (Object.hasOwn(known, key)) return known[key]!;
  let hash = 2166136261;
  for (const character of key) hash = Math.imul(hash ^ character.codePointAt(0)!, 16777619);
  return (hash >>> 0) % 5;
}

export function readingLabel(html: string): string {
  const words = html.replace(/<[^>]*>/g, " ").replace(/&[^;\s]+;/g, " ").trim().split(/\s+/).filter(Boolean).length;
  return words ? `${Math.max(1, Math.ceil(words / 200))} min de leitura` : "";
}

export function authorInitials(author: string): string {
  return (author.trim() || "Redação").split(/\s+/).slice(0, 2).map(word => [...word][0]).join("").toLocaleUpperCase("pt-BR");
}
