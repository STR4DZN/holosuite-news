import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
await mkdir("artifacts", { recursive: true });
const browser = await chromium.launch(
  process.env.HN_BROWSER_PATH
    ? {
        executablePath: process.env.HN_BROWSER_PATH,
        args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
      }
    : {},
);
try {
  const page = await browser.newPage({
    viewport: { width: 1366, height: 1100 },
    deviceScaleFactor: 1,
  });
  await page.goto(
    process.argv[2] ??
      pathToFileURL(path.resolve("preview-dist/HoloNews-Preview.html")).href,
    { waitUntil: "networkidle" },
  );
  const settle = () => page.waitForFunction(() =>
    !document.getAnimations().some((effect) => effect.playState === "running"),
  );
  await settle();
  await page.screenshot({ path: "artifacts/holonews-portal.png" });
  await page.locator("#demo-reader").selectOption("gm");
  await page
    .getByRole("button", { name: "Criador do mestre", exact: true })
    .click();
  await page.locator('[data-edit="demo000000000000"]').first().click();
  await settle();
  await page.screenshot({ path: "artifacts/holonews-criador.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('[data-mode="portal"]').click();
  await settle();
  await page.screenshot({ path: "artifacts/holonews-mobile.png" });
} finally {
  await browser.close();
}
