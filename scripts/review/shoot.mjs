// Screenshot da hero em um tamanho de viewport, já com a entrada concluída.
// Uso: node scripts/review/shoot.mjs <largura> <altura> <saida.png> [url]
import { chromium } from "@playwright/test";

const [w, h, out, url = "http://localhost:3000/"] = process.argv.slice(2);
const exe = process.env.CHROMIUM_PATH;
const browser = await chromium.launch(exe ? { executablePath: exe } : {});
const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1 });
page.on("console", (m) => m.type() === "error" && console.error("[console]", m.text()));
page.on("pageerror", (e) => console.error("[pageerror]", e.message));
await page.goto(url, { waitUntil: "networkidle" });
await page.waitForTimeout(+(process.env.WAIT || 4500));
await page.screenshot({ path: out });
await browser.close();
