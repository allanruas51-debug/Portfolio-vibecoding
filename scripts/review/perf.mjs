// Mede long tasks (>50ms) e FPS (rAF) durante parallax e transição ida/volta.
// Uso: node scripts/review/perf.mjs <largura> <altura> [url]
import { chromium } from "@playwright/test";

const [w, h, url = "http://localhost:3100/"] = process.argv.slice(2);
const exe = process.env.CHROMIUM_PATH;
const args = process.env.GPU ? ["--enable-gpu-rasterization", "--ignore-gpu-blocklist"] : [];
const browser = await chromium.launch({ ...(exe ? { executablePath: exe } : {}), args });
const page = await browser.newPage({ viewport: { width: +w, height: +h } });
await page.goto(url, { waitUntil: "networkidle" });
await page.waitForTimeout(4000);

const measure = async (label, action) => {
  await page.evaluate(() => {
    window.__perf = { frames: [], long: [] };
    const tick = (t) => {
      window.__perf.frames.push(t);
      window.__perf.raf = requestAnimationFrame(tick);
    };
    window.__perf.raf = requestAnimationFrame(tick);
    window.__perf.obs = new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__perf.long.push(e.duration)));
    window.__perf.obs.observe({ type: "longtask" });
  });
  await action();
  const r = await page.evaluate(() => {
    cancelAnimationFrame(window.__perf.raf);
    window.__perf.obs.disconnect();
    const f = window.__perf.frames;
    const d = f.slice(1).map((t, i) => t - f[i]);
    d.sort((a, b) => a - b);
    const dur = (f[f.length - 1] - f[0]) / 1000;
    return {
      fps: +(f.length / dur).toFixed(1),
      p95FrameMs: +d[Math.floor(d.length * 0.95)].toFixed(1),
      longTasks: window.__perf.long.length,
      maxLongTaskMs: +Math.max(0, ...window.__perf.long).toFixed(0),
    };
  });
  console.log(label, JSON.stringify(r));
};

await measure("parallax (mouse 3s)", async () => {
  for (let i = 0; i < 60; i++) {
    await page.mouse.move(+w * (0.2 + 0.6 * Math.abs(Math.sin(i / 9))), +h * (0.3 + 0.4 * Math.abs(Math.cos(i / 7))));
    await page.waitForTimeout(50);
  }
});
await measure("transição ida", async () => {
  await page.keyboard.press("ArrowDown");
  await page.waitForTimeout(2400);
});
await measure("transição volta", async () => {
  await page.keyboard.press("ArrowUp");
  await page.waitForTimeout(2400);
});
await browser.close();
