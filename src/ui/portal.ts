import type { PortalRoute } from "./context";
export function bindPortal(
  root: HTMLElement,
  route: PortalRoute,
  navigate: () => void,
): void {
  root.querySelectorAll<HTMLButtonElement>("[data-open]").forEach((button) =>
    button.addEventListener("click", () => {
      route.articleId = button.dataset.open;
      navigate();
    }),
  );
  root
    .querySelectorAll<HTMLButtonElement>("[data-category]")
    .forEach((button) =>
      button.addEventListener("click", () => {
        route.articleId = undefined;
        route.category = button.dataset.category ?? "";
        route.page = 1;
        navigate();
      }),
    );
  root.querySelectorAll("[data-home]").forEach((button) =>
    button.addEventListener("click", () => {
      route.articleId = undefined;
      route.category = "";
      route.query = "";
      route.page = 1;
      navigate();
    }),
  );
  root.querySelector("[data-back]")?.addEventListener("click", () => {
    route.articleId = undefined;
    navigate();
  });
  root.querySelector("[data-prev]")?.addEventListener("click", () => {
    route.page--;
    navigate();
  });
  root.querySelector("[data-next]")?.addEventListener("click", () => {
    route.page++;
    navigate();
  });
  root.querySelector("[data-search]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    route.query =
      root.querySelector<HTMLInputElement>('input[name="query"]')?.value ?? "";
    route.articleId = undefined;
    route.page = 1;
    navigate();
  });
  root.querySelector("[data-clear]")?.addEventListener("click", () => {
    route.query = "";
    route.category = "";
    route.page = 1;
    navigate();
  });
}
