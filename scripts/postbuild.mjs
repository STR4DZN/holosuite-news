import { cp, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const moduleManifest = JSON.parse(
  await readFile(path.join(root, "module.json"), "utf8"),
);

await mkdir(dist, { recursive: true });
await cp(path.join(root, "templates"), path.join(dist, "templates"), {
  recursive: true,
  force: true,
});
await cp(path.join(root, "languages"), path.join(dist, "languages"), {
  recursive: true,
  force: true,
});
await mkdir(path.join(dist, "assets"), { recursive: true });
await cp(path.join(root, "assets/holonews-mark.svg"), path.join(dist, "assets/holonews-mark.svg"));
await mkdir(path.join(dist, "assets/fonts"), {recursive:true});
for (const name of await readdir(path.join(root, "assets/fonts")))
  if (name.endsWith(".txt") || name === "README.md") await cp(path.join(root, "assets/fonts", name), path.join(dist, "assets/fonts", name));
await writeFile(
  path.join(dist, "build-info.json"),
  `${JSON.stringify({ moduleId: moduleManifest.id, version: moduleManifest.version, foundry: moduleManifest.compatibility, schemaVersion: 2 }, null, 2)}\n`,
  "utf8",
);

console.log(`Postbuild complete: ${path.relative(root, dist)}`);
