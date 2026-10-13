// Mede as caixas (glifos reais via Range) dos elementos de UI da hero.
// Uso: node scripts/review/measure.mjs <largura> <altura>
import { chromium } from "@playwright/test";

const [w, h] = process.argv.slice(2).map(Number);
const exe = process.env.CHROMIUM_PATH;
const browser = await chromium.launch(exe ? { executablePath: exe } : {});
const page = await browser.newPage({ viewport: { width: w, height: h } });
await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
await page.waitForTimeout(4000);
const out = await page.evaluate(() => {
  const r = (el) => {
    if (!el) return null;
    const range = document.createRange();
    range.selectNodeContents(el);
    const b = range.getBoundingClientRect();
    return [b.left, b.top, b.right, b.bottom].map((v) => Math.round(v * 10) / 10);
  };
  const q = (s) => document.querySelector(s);
  const qa = (s) => [...document.querySelectorAll(s)];
  return {
    logo: r(q(".ui-logo")),
    nav: qa(".ui-nav a").map(r),
    cta: q(".ui-cta")?.getBoundingClientRect().toJSON(),
    words: qa(".hero-title .word").map(r),
    tagline: qa(".ui-tagline .ui-stack > span").map(r),
    pillars: qa(".ui-pillars .ui-stack > span").map(r),
    scroll: qa(".ui-scroll .ui-stack > span").map(r),
    char: q(".char-pos")?.getBoundingClientRect().toJSON(),
  };
});
console.log(JSON.stringify(out, null, 1));
await browser.close();
