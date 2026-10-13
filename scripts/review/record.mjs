// Captura frames reais (CDP screencast) da entrada e da transição ida/volta.
// Uso: node scripts/review/record.mjs <largura> <altura> <pasta_saida> [url]
import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";

const [w, h, dir, url = "http://localhost:3000/"] = process.argv.slice(2);
mkdirSync(dir, { recursive: true });
const exe = process.env.CHROMIUM_PATH;
const browser = await chromium.launch(exe ? { executablePath: exe } : {});
const page = await browser.newPage({ viewport: { width: +w, height: +h } });
const cdp = await page.context().newCDPSession(page);
let n = 0;
let t0 = 0;
const log = [];
cdp.on("Page.screencastFrame", async (f) => {
  const ts = f.metadata.timestamp;
  if (!t0) t0 = ts;
  const name = `${String(n++).padStart(4, "0")}.jpg`;
  writeFileSync(`${dir}/${name}`, Buffer.from(f.data, "base64"));
  log.push({ name, t: +(ts - t0).toFixed(3) });
  await cdp.send("Page.screencastFrameAck", { sessionId: f.sessionId }).catch(() => {});
});
const mark = (label) => log.push({ label, t: t0 ? +((Date.now() / 1000) - t0).toFixed(3) : 0 });
await cdp.send("Page.startScreencast", { format: "jpeg", quality: 70, maxWidth: +w, maxHeight: +h, everyNthFrame: 1 });
await page.goto(url);
await page.waitForTimeout(3500);
mark("ArrowDown");
await page.keyboard.press("ArrowDown");
await page.waitForTimeout(2600);
mark("ArrowUp");
await page.keyboard.press("ArrowUp");
await page.waitForTimeout(2600);
await cdp.send("Page.stopScreencast");
writeFileSync(`${dir}/log.json`, JSON.stringify(log, null, 1));
console.log("frames", n);
await browser.close();
