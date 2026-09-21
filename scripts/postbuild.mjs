import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const moduleManifest = JSON.parse(await readFile(path.join(root, "module.json"), "utf8"));

await mkdir(dist, { recursive: true });
await cp(path.join(root, "templates"), path.join(dist, "templates"), { recursive: true, force: true });
await cp(path.join(root, "languages"), path.join(dist, "languages"), { recursive: true, force: true });
await writeFile(path.join(dist, "build-info.json"), `${JSON.stringify({ moduleId: moduleManifest.id, version: moduleManifest.version, foundry: moduleManifest.compatibility, schemaVersion: 1 }, null, 2)}\n`, "utf8");

console.log(`Postbuild complete: ${path.relative(root, dist)}`);
