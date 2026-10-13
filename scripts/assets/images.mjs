// Gera as variantes AVIF/WebP das imagens da hero em public/media.
// Uso: node scripts/assets/images.mjs
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const SRC = "assets/source";
const OUT = "public/media";
mkdirSync(OUT, { recursive: true });

const jobs = [
  // céu limpo (sem lua) — camada 1 e textura do título
  { src: `${SRC}/bg-desktop-limpo.jpg`, name: "sky-desktop", widths: [960, 1536] },
  { src: `${SRC}/bg-mobile-limpo.png`, name: "sky-mobile", widths: [640, 940] },
];

for (const job of jobs) {
  for (const w of job.widths) {
    const img = sharp(job.src).resize({ width: w, withoutEnlargement: true });
    await img.clone().avif({ quality: 58, effort: 6 }).toFile(`${OUT}/${job.name}-${w}.avif`);
    await img.clone().webp({ quality: 80, effort: 6 }).toFile(`${OUT}/${job.name}-${w}.webp`);
    console.log(job.name, w);
  }
}
