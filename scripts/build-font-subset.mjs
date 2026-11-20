/** Build a small, self-hosted Chinese font from the project's own editorial text.
 * Requires FontTools/pyftsubset and the system's OFL-licensed Noto CJK fonts.
 */
import { readFileSync, mkdtempSync, writeFileSync, unlinkSync, rmdirSync, mkdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";

const root = resolve(import.meta.dirname, "..");
const inputFiles = [
  "index.html", "app.js", "evidence-experiences.js", "hall-model.js", "model-fidelity.js"
];
const sourceText = inputFiles.map((name) => {
  try { return readFileSync(join(root, name), "utf8"); } catch { return ""; }
}).join("\n");
const chars = [...new Set([...sourceText])].join("") +
  "一二三四五六七八九十元明清殿阁寺庙檐瓦榫卯栱银杏叶测绘修复建筑";
const fonts = [
  ["Regular", "noto-sans-sc-regular-subset.woff2"],
  ["Bold", "noto-sans-sc-bold-subset.woff2"]
];
const tempDir = mkdtempSync(join(tmpdir(), "zhenru-font-"));
const charFile = join(tempDir, "glyphs.txt");
const dest = join(root, "assets", "fonts");
mkdirSync(dest, { recursive: true });
try {
  writeFileSync(charFile, chars, "utf8");
  for (const [weight, name] of fonts) {
    execFileSync("/usr/bin/python3", ["-m", "fontTools.subset",
      `/usr/share/fonts/opentype/noto/NotoSansCJK-${weight}.ttc`,
      "--font-number=2", `--text-file=${charFile}`, "--flavor=woff2",
      "--layout-features=kern", "--name-IDs=0,1,2,3,4,5,6", "--name-languages=0x409",
      `--output-file=${join(dest, name)}`
    ]);
    process.stdout.write(`${name}: ${(statSync(join(dest, name)).size / 1024).toFixed(1)} KiB\n`);
  }
} finally {
  unlinkSync(charFile);
  rmdirSync(tempDir);
}
