// Converte poster/glow gerados por video.py em WebP e imprime a geometria
// (box em px de referência) para colar em src/config/character.ts.
// Uso: node scripts/assets/finalize.mjs <work_dir_desktop> <work_dir_mobile>
import sharp from "sharp";
import { readFileSync } from "node:fs";

const [desk, mob] = process.argv.slice(2);
for (const [version, dir] of [["desktop", desk], ["mobile", mob]]) {
  if (!dir) continue;
  const meta = JSON.parse(readFileSync(`${dir}/meta.json`, "utf8"));
  await sharp(`${dir}/poster.png`).webp({ quality: 82, alphaQuality: 90, effort: 6 }).toFile(`public/media/boneco-${version}-poster.webp`);
  await sharp(`${dir}/glow.png`).webp({ quality: 70, alphaQuality: 80 }).toFile(`public/media/boneco-${version}-glow.webp`);
  console.log(version, JSON.stringify(meta.box), "out", meta.out.join("x"), "frames", meta.frames);
}
