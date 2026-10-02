import { build } from "vite";
import { readFile, writeFile, readdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
await build({
  root,
  configFile: false,
  build: {
    outDir: "preview-dist",
    assetsInlineLimit: 1000000,
    rollupOptions: { input: path.join(root, "preview/index.html") },
  },
});
const output = path.join(root, "preview-dist");
let html = await readFile(path.join(output, "preview/index.html"), "utf8");
for (const name of await readdir(path.join(output, "assets"))) {
  const file = `/assets/${name}`;
  if (name.endsWith(".js")) {
    const script = (
      await readFile(path.join(output, "assets", name), "utf8")
    ).replace(/<\/script/gi, "<\\/script");
    html = html.replace(
      new RegExp(`<script[^>]+src="${file}"[^>]*><\\/script>`),
      `<script type="module">${script}</script>`,
    );
  }
  if (name.endsWith(".css"))
    html = html.replace(
      new RegExp(`<link[^>]+href="${file}"[^>]*>`),
      `<style>${await readFile(path.join(output, "assets", name), "utf8")}</style>`,
    );
}
await writeFile(path.join(output, "HoloNews-Preview.html"), html);
await rm(path.join(output, "assets"), { recursive: true });
await rm(path.join(output, "preview"), { recursive: true });
console.log("Standalone preview: preview-dist/HoloNews-Preview.html");
