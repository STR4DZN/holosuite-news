import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(await readFile(path.join(root, "module.json"), "utf8"));
const packageJson = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
const failures = [];

if (manifest.id !== "holosuite-news") failures.push("module id must be holosuite-news");
if (manifest.version !== packageJson.version) failures.push("module.json and package.json versions differ");
if (manifest.compatibility?.minimum !== "13" || manifest.compatibility?.verified !== "13") failures.push("Foundry compatibility must target v13");
if (!manifest.relationships?.requires?.some((value) => value.id === "holosuite-core")) failures.push("HoloSuite Core requirement is missing");
if (manifest.socket !== true) failures.push("module socket must be enabled");

const required = [
  "dist/main.js", "dist/main.js.map", "dist/style.css", "dist/templates/reader/reader.hbs",
  "dist/templates/gm/editorial.hbs", "dist/languages/pt-BR.json", "dist/languages/en.json", "dist/build-info.json"
];
for (const relative of required) {
  try { await access(path.join(root, relative)); }
  catch { failures.push(`missing runtime file: ${relative}`); }
}

for (const language of ["pt-BR", "en"]) {
  try { JSON.parse(await readFile(path.join(root, `dist/languages/${language}.json`), "utf8")); }
  catch { failures.push(`invalid language JSON: ${language}`); }
}

for (const zipPath of process.argv.slice(2)) {
  const listing = spawnSync("tar.exe", ["-tf", path.resolve(zipPath)], { encoding: "utf8" });
  if (listing.status !== 0) failures.push(`cannot inspect ZIP: ${zipPath}`);
  else {
    const entries = listing.stdout.split(/\r?\n/u).filter(Boolean).map((entry) => entry.replace(/^\.\//u, ""));
    if (!entries.includes("module.json")) failures.push(`runtime ZIP has no root module.json: ${zipPath}`);
    if (entries.some((entry) => /(^|\/)(src|tests|node_modules)\//u.test(entry))) failures.push(`runtime ZIP contains source or dependency files: ${zipPath}`);
  }
}

if (failures.length) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exit(1);
}
console.log(`Package validation passed (${required.length} required runtime files).`);
