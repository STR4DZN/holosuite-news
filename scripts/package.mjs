import { mkdir, readFile, writeFile, stat } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "artifacts");
await mkdir(output, { recursive: true });
const { version } = JSON.parse(
  await readFile(path.join(root, "module.json"), "utf8"),
);
const result = spawnSync(
  "python3",
  [
    "-c",
    `
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import sys,subprocess
root=Path(sys.argv[1]); out=Path(sys.argv[2]); version=sys.argv[3]
with ZipFile(out/f'holosuite-news-v{version}.zip','w',ZIP_DEFLATED) as z:
 for name in ['module.json','README.md','CHANGELOG.md','LICENSE','dist','docs/foundry-smoke-test.md','docs/security-review.md','docs/motion-research.md','docs/editorial-motion-research.md','docs/scifi-themes.md','docs/color-design-research.md','docs/global-urgent.md']:
  p=root/name
  for f in ([p] if p.is_file() else sorted(p.rglob('*'))):
   if f.is_file() and not f.name.endswith('.map'): z.write(f,f.relative_to(root))
with ZipFile(out/f'holosuite-news-v{version}-source.zip','w',ZIP_DEFLATED) as z:
 excluded={'node_modules','.git','artifacts','test-results','playwright-report','coverage','preview-dist','dist'}
 names=subprocess.check_output(['git','ls-files','--cached','--others','--exclude-standard','-z'],cwd=root).decode().split(chr(0))
 for f in sorted({root/name for name in names if name}):
  if f.is_file() and not any(x in excluded for x in f.relative_to(root).parts): z.write(f,f.relative_to(root))
 z.write(root/'preview-dist/HoloNews-Preview.html','HoloNews-Preview.html')
`,
    root,
    output,
    version,
  ],
  { stdio: "inherit" },
);
if (result.status !== 0) throw new Error("Falha ao gerar ZIPs");
for (const name of [
  `holosuite-news-v${version}.zip`,
  `holosuite-news-v${version}-source.zip`,
]) {
  const bytes = await readFile(path.join(output, name));
  const sha = createHash("sha256").update(bytes).digest("hex");
  await writeFile(path.join(output, `${name}.sha256`), `${sha}  ${name}\n`);
  console.log(
    `${name}: ${(await stat(path.join(output, name))).size} bytes · ${sha}`,
  );
}
