export function formatViews(value: number, locale = "pt-BR"): string {
  const safe = Number.isSafeInteger(value) && value >= 0 ? value : 0;
  try { return new Intl.NumberFormat(locale).format(safe); }
  catch { return new Intl.NumberFormat("pt-BR").format(safe); }
}

export function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/gu, " ").replace(/\s+/gu, " ").trim();
}

export function safeCssColor(value: string, fallback: string): string {
  const normalized = value.trim();
  return /^#[0-9a-f]{6}$/iu.test(normalized) ? normalized : fallback;
}

export async function enrichSafeHtml(value: string): Promise<string> {
  const textEditor = (globalThis as any).TextEditor;
  const enriched = typeof textEditor?.enrichHTML === "function"
    ? await textEditor.enrichHTML(value ?? "", { async: true, secrets: false, documents: true, links: true })
    : escapeHtml(value ?? "").replace(/\n/gu, "<br>");
  const purifier = (globalThis as any).DOMPurify;
  if (purifier?.sanitize) return purifier.sanitize(enriched, { USE_PROFILES: { html: true } });
  if (typeof document === "undefined") return escapeHtml(stripHtml(enriched));
  const template = document.createElement("template");
  template.innerHTML = enriched;
  const allowedTags = new Set(["A", "B", "BLOCKQUOTE", "BR", "CODE", "DIV", "EM", "FIGCAPTION", "FIGURE", "H1", "H2", "H3", "H4", "H5", "H6", "HR", "I", "IMG", "LI", "OL", "P", "PRE", "S", "SPAN", "STRONG", "TABLE", "TBODY", "TD", "TH", "THEAD", "TR", "U", "UL"]);
  for (const element of Array.from(template.content.querySelectorAll("*"))) if (!allowedTags.has(element.tagName)) element.replaceWith(...Array.from(element.childNodes));
  for (const element of template.content.querySelectorAll("*")) {
    for (const attribute of Array.from(element.attributes)) {
      const name = attribute.name.toLowerCase();
      const allowed = new Set(["alt", "class", "colspan", "data-id", "data-pack", "data-type", "data-uuid", "height", "href", "rel", "rowspan", "src", "target", "title", "width"]);
      if (name.startsWith("on") || !allowed.has(name) || ((name === "href" || name === "src") && !isSafeClientUrl(attribute.value, name === "src"))) element.removeAttribute(attribute.name);
    }
    if (element.tagName === "A" && element.getAttribute("target") === "_blank") element.setAttribute("rel", "noopener noreferrer");
  }
  return template.innerHTML;
}

export function isSafeClientUrl(value: string, image = false): boolean {
  const normalized = Array.from(value).filter((character) => (character.codePointAt(0) ?? 0) > 32).join("").toLowerCase();
  if (!normalized || normalized.startsWith("#") || normalized.startsWith("/") || normalized.startsWith("./") || normalized.startsWith("../")) return true;
  if (image && /^data:image\/(?:avif|gif|jpeg|png|webp);base64,/u.test(normalized)) return true;
  if (/^(https?:|mailto:|tel:)/u.test(normalized)) return true;
  return !/^[a-z][a-z0-9+.-]*:/u.test(normalized);
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/gu, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#039;" })[character] ?? character);
}
