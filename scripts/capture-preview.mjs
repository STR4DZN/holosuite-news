import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.resolve(root, "..", "..", "outputs");
const baseUrl = process.argv[2] ?? "http://127.0.0.1:4173/preview/";

await mkdir(output, { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 1 });
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(output, "holosuite-news-reader.png"), fullPage: true });

  await page.setViewportSize({ width: 1366, height: 768 });
  await page.getByRole("button", { name: "Mesa editorial" }).click();
  await page.screenshot({ path: path.join(output, "holosuite-news-editorial.png"), fullPage: true });
} finally {
  await browser.close();
}

console.log(`Preview screenshots written to ${output}`);
