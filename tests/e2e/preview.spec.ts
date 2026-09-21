import { expect, test } from "@playwright/test";

const viewports = [
  { width: 320, height: 568 }, { width: 360, height: 800 }, { width: 390, height: 844 },
  { width: 430, height: 932 }, { width: 1366, height: 768 }, { width: 1920, height: 1080 }
];

for (const viewport of viewports) {
  test(`Reader contains content at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
    await page.setViewportSize(viewport);
    await page.goto("/preview/");
    await expect(page.getByRole("heading", { name: "Union Chronicle" })).toBeVisible();
    await expect(page.getByText("1.000.000 visualizações", { exact: true }).first()).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    expect(errors).toEqual([]);
  });
}

test("Reader routes, history, landmarks, and themes remain functional", async ({ page }) => {
  await page.goto("/preview/");
  await page.getByRole("button", { name: /Colônia perde contato após/ }).click();
  await expect(page.getByRole("heading", { name: "Colônia perde contato após uma transmissão impossível" })).toBeVisible();
  await page.getByRole("button", { name: "Voltar" }).last().click();
  await expect(page.getByRole("heading", { name: "Union Chronicle" })).toBeVisible();
  await page.getByRole("button", { name: /Edição/ }).first().click();
  await expect(page.getByRole("region", { name: "Página 1: Capa" })).toBeVisible();
  const themes = ["classic", "modern", "corporate", "military", "underground", "tabloid", "terminal"];
  for (const theme of themes) {
    await page.locator("[data-preview-theme]").selectOption(theme);
    await expect(page.locator("[data-preview-reader]")).toHaveClass(new RegExp(`hsn-theme-${theme}`));
  }
  await page.keyboard.press("Tab");
  await expect(page.locator(":focus")).toBeVisible();
});

test("Editorial desk is distinct, dense, and readable", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto("/preview/");
  await page.getByRole("button", { name: "Mesa editorial" }).click();
  await expect(page.getByRole("heading", { name: "Controle de publicação" })).toBeVisible();
  await expect(page.getByText("Master data · GM only")).toBeVisible();
  await expect(page.getByText("4 / 5")).toBeVisible();
});
