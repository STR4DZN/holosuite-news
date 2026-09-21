import { createHash } from "node:crypto";
import { cp, mkdir, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const workspace = path.resolve(root, "..", "..");
const output = path.join(workspace, "outputs");
const staging = await mkdtemp(path.join(tmpdir(), "holosuite-news-"));
const manifest = JSON.parse(await readFile(path.join(root, "module.json"), "utf8"));
const version = manifest.version;

if (path.basename(output).toLowerCase() !== "outputs" || !output.startsWith(workspace)) throw new Error(`Refusing unsafe output path: ${output}`);
if (!staging.startsWith(path.resolve(tmpdir()))) throw new Error(`Refusing unsafe staging path: ${staging}`);

await mkdir(path.join(staging, "runtime"), { recursive: true });
await mkdir(path.join(staging, "source"), { recursive: true });
await mkdir(output, { recursive: true });

for (const name of ["module.json", "README.md", "CHANGELOG.md", "LICENSE"]) await cp(path.join(root, name), path.join(staging, "runtime", name));
await cp(path.join(root, "dist"), path.join(staging, "runtime", "dist"), { recursive: true });

const excluded = new Set(["node_modules", ".release", ".git", "coverage", "test-results", "playwright-report"]);
await cp(root, path.join(staging, "source"), {
  recursive: true,
  filter: (source) => {
    const relative = path.relative(root, source);
    if (!relative) return true;
    return !relative.split(path.sep).some((part) => excluded.has(part));
  }
});

const runtimeZip = path.join(output, `holosuite-news-v${version}.zip`);
const sourceZip = path.join(output, `holosuite-news-v${version}-source.zip`);
for (const target of [runtimeZip, sourceZip]) await rm(target, { force: true });
createZip(path.join(staging, "runtime"), runtimeZip);
createZip(path.join(staging, "source"), sourceZip);

const artifacts = [];
for (const target of [runtimeZip, sourceZip]) {
  const bytes = await readFile(target);
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  await writeFile(`${target}.sha256`, `${sha256}  ${path.basename(target)}\n`, "utf8");
  artifacts.push({ file: path.basename(target), bytes: (await stat(target)).size, sha256 });
}

await writeFile(path.join(output, `holosuite-news-v${version}-release.json`), `${JSON.stringify({ module: manifest.id, version, foundry: manifest.compatibility, requires: manifest.relationships.requires, artifacts, evidence: { unitAndStatic: "validated locally", browserPreview: "run separately", foundryRuntime: "requires external smoke procedure" } }, null, 2)}\n`, "utf8");
await rm(staging, { recursive: true, force: true });
console.log(JSON.stringify({ output, artifacts }, null, 2));

function createZip(source, target) {
  const result = spawnSync("tar.exe", ["-a", "-cf", target, "-C", source, "."], { stdio: "inherit" });
  if (result.status !== 0) throw new Error(`Could not create ${target}`);
}
