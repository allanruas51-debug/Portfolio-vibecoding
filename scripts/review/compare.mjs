// Compara um screenshot com a ref: diff (pixelmatch), lado a lado e métricas.
// Uso: node scripts/review/compare.mjs <shot.png> <ref.png> <saida_prefixo>
import sharp from "sharp";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";
import { writeFileSync } from "node:fs";

const [shot, ref, out] = process.argv.slice(2);
const meta = await sharp(ref).metadata();
const { width: w, height: h } = meta;
const a = await sharp(shot).resize(w, h).removeAlpha().ensureAlpha().raw().toBuffer();
const b = await sharp(ref).removeAlpha().ensureAlpha().raw().toBuffer();
const diff = new PNG({ width: w, height: h });
const n = pixelmatch(a, b, diff.data, w, h, { threshold: 0.18, includeAA: false, alpha: 0.25 });
writeFileSync(`${out}-diff.png`, PNG.sync.write(diff));

// erro médio por canal (0–255) — mais informativo que a contagem binária
let sum = 0;
for (let i = 0; i < a.length; i += 4) sum += Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]);
const mae = sum / ((a.length / 4) * 3);

await sharp({ create: { width: w * 2 + 12, height: h, channels: 3, background: "#000" } })
  .composite([
    { input: await sharp(shot).resize(w, h).png().toBuffer(), left: 0, top: 0 },
    { input: ref, left: w + 12, top: 0 },
  ])
  .jpeg({ quality: 82 })
  .toFile(`${out}-lado-a-lado.jpg`);

console.log(JSON.stringify({ shot, ref, size: `${w}x${h}`, pixelmatch_pct: +((n / (w * h)) * 100).toFixed(2), mae: +mae.toFixed(2) }));
