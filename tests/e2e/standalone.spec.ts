import { test, expect } from "@playwright/test";
import path from "node:path";
import { pathToFileURL } from "node:url";
test("prévia independente salva e publica com capas embutidas sem servidor", async ({
  page,
}) => {
  await page.goto(
    pathToFileURL(path.resolve("preview-dist/HoloNews-Preview.html")).href,
  );
  await expect(page.locator(".hn-lead-image img")).toBeVisible();
  expect(
    await page
      .locator(".hn-lead-image img")
      .evaluate((img: HTMLImageElement) => img.naturalWidth),
  ).toBeGreaterThan(0);
  await page.locator("#demo-reader").selectOption("gm");
  await page
    .getByRole("button", { name: "Criador do mestre", exact: true })
    .click();
  await page.locator('[data-edit="demo000000000000"]').first().click();
  await expect(page.locator('[name="cover"]')).toHaveValue("demo/meridian.svg");
  await page
    .locator('[name="title"]')
    .fill("Uma manchete salva no arquivo independente");
  await page.getByRole("button", { name: "Publicar revisão" }).click();
  await expect(page.locator("[data-status]")).toHaveText("Publicada");
  await page.locator('[data-mode="portal"]').click();
  await expect(page.locator(".hn-lead h1")).toHaveText(
    "Uma manchete salva no arquivo independente",
  );
  await page.reload();
  await expect(page.locator(".hn-lead h1")).toHaveText(
    "Uma manchete salva no arquivo independente",
  );
});
