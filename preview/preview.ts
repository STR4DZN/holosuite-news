import "../styles/index.css";
import "./preview.css";

const readerPanel = document.querySelector<HTMLElement>("#preview-reader");
const editorialPanel = document.querySelector<HTMLElement>("#preview-editorial");
const reader = document.querySelector<HTMLElement>("[data-preview-reader]");
const history: string[] = ["home"];

function showRoute(route: string, push = true): void {
  document.querySelectorAll<HTMLElement>("[data-preview-view]").forEach((element) => { element.hidden = element.dataset.previewView !== route; });
  document.querySelectorAll<HTMLElement>("[data-preview-route]").forEach((element) => element.classList.toggle("is-active", element.dataset.previewRoute === route));
  if (push && history.at(-1) !== route) history.push(route);
  document.querySelector<HTMLElement>("[data-preview-view]:not([hidden])")?.focus({ preventScroll: true });
}

document.querySelectorAll<HTMLButtonElement>("[data-preview-route]").forEach((button) => button.addEventListener("click", () => showRoute(button.dataset.previewRoute ?? "home")));
document.querySelectorAll<HTMLButtonElement>("[data-preview-back]").forEach((button) => button.addEventListener("click", () => { if (history.length > 1) history.pop(); showRoute(history.at(-1) ?? "home", false); }));
document.querySelectorAll<HTMLButtonElement>("[data-preview-mode]").forEach((button) => button.addEventListener("click", () => {
  const mode = button.dataset.previewMode;
  if (readerPanel) readerPanel.hidden = mode !== "reader";
  if (editorialPanel) editorialPanel.hidden = mode !== "editorial";
  document.querySelectorAll<HTMLElement>("[data-preview-mode]").forEach((candidate) => candidate.classList.toggle("is-active", candidate === button));
}));

document.querySelector<HTMLSelectElement>("[data-preview-theme]")?.addEventListener("change", (event) => {
  const select = event.currentTarget as HTMLSelectElement;
  if (!reader) return;
  for (const name of ["classic", "modern", "corporate", "military", "underground", "tabloid", "terminal"]) reader.classList.remove(`hsn-theme-${name}`);
  reader.classList.add(`hsn-theme-${select.value}`);
});

document.querySelector<HTMLFormElement>(".hsn-search")?.addEventListener("submit", (event) => {
  event.preventDefault();
  showRoute("issue");
});
