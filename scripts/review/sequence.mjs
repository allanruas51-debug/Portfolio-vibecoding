// Captura uma sequência de frames (entrada + transição ida/volta) numa folha de contato.
// Uso: node scripts/review/sequence.mjs <largura> <altura> <saida.jpg> [url]
import { chromium } from "@playwright/test";
import sharp from "sharp";

const [w, h, out, url = "http://localhost:3000/"] = process.argv.slice(2);
const exe = process.env.CHROMIUM_PATH;
const browser = await chromium.launch(exe ? { executablePath: exe } : {});
const page = await browser.newPage({ viewport: { width: +w, height: +h } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const shots = [];
const snap = async (label) => shots.push({ label, buf: await page.screenshot() });
await page.goto(url);
for (const t of [150, 500, 500, 500, 600, 900]) {
  await page.waitForTimeout(t);
  await snap(`entrada`);
}
await page.waitForTimeout(800);
await page.keyboard.press("ArrowDown");
for (const t of [200, 250, 250, 250, 300, 600]) {
  await page.waitForTimeout(t);
  await snap(`ida`);
}
await page.waitForTimeout(1000);
await page.keyboard.press("ArrowUp");
for (const t of [250, 300, 300, 400, 900]) {
  await page.waitForTimeout(t);
  await snap(`volta`);
}
const tw = 400;
const th = Math.round((tw * +h) / +w);
const cols = 6;
const rows = Math.ceil(shots.length / cols);
const tiles = await Promise.all(shots.map((s) => sharp(s.buf).resize(tw, th).toBuffer()));
await sharp({ create: { width: cols * tw, height: rows * th, channels: 3, background: "#000" } })
  .composite(tiles.map((input, i) => ({ input, left: (i % cols) * tw, top: Math.floor(i / cols) * th })))
  .jpeg({ quality: 80 })
  .toFile(out);
console.log("frames", shots.length, "erros", errors);
await browser.close();
