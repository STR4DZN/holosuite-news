import { readFile, access } from "node:fs/promises";
const manifest = JSON.parse(await readFile("module.json", "utf8"));
const pkg = JSON.parse(await readFile("package.json", "utf8"));
if (manifest.id !== "holosuite-news" || manifest.version !== pkg.version)
  throw new Error("Identidade/versão inválida");
if (
  manifest.compatibility.minimum !== "13" ||
  manifest.compatibility.maximum !== "13"
)
  throw new Error("Alvo de compatibilidade inválido");
if (!manifest.relationships.requires.some((r) => r.id === "holosuite-core"))
  throw new Error("HoloSuite Core ausente");
const releases = "https://github.com/STR4DZN/holosuite-news/releases";
if (
  manifest.manifest !== `${releases}/latest/download/module.json` ||
  manifest.download !== `${releases}/download/v${pkg.version}/holosuite-news-v${pkg.version}.zip` ||
  manifest.changelog !== `${releases}/tag/v${pkg.version}`
)
  throw new Error("URLs da release não correspondem à versão do módulo");
for (const file of [
  "main.js",
  "style.css",
  "templates/reader/portal.hbs",
  "templates/reader/article.hbs",
  "templates/gm/manager.hbs",
  "templates/gm/editor.hbs",
  "languages/pt-BR.json",
  "build-info.json",
])
  await access(`dist/${file}`);
const info = JSON.parse(await readFile("dist/build-info.json", "utf8"));
if (info.schemaVersion !== 2 || info.version !== pkg.version)
  throw new Error("Build incompatível");
console.log("Manifesto e todos os arquivos de runtime validados.");
