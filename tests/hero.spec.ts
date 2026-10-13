import { expect, test, type Page } from "@playwright/test";

/** Espera o loader sair e a coreografia de entrada terminar. */
async function ready(page: Page) {
  await page.goto("/");
  await expect(page.locator(".loader")).toHaveCount(0, { timeout: 5000 });
  await page.waitForTimeout(2600);
}

const activeSection = (page: Page) => page.locator("main.fp-root").getAttribute("data-section");

test("carrega a hero com título, menu, CTA e boneco", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await ready(page);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/vibe\s*coding/i);
  await expect(page.getByRole("link", { name: /falar com a gente/i }).first()).toHaveAttribute("href", /wa\.me/);
  await expect(page.getByRole("button", { name: /allan ruas em versão boneco/i })).toBeVisible();
  expect(errors).toEqual([]);
});

test("sem scroll horizontal", async ({ page }) => {
  await ready(page);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test("o vídeo do boneco toca em loop e sem áudio", async ({ page }) => {
  await ready(page);
  const video = page.locator(".char-layer video");
  await expect(video).toHaveCount(1);
  const state = await video.evaluate(async (v: HTMLVideoElement) => {
    const t0 = v.currentTime;
    await new Promise((r) => setTimeout(r, 600));
    return { loop: v.loop, muted: v.muted, advanced: v.currentTime !== t0, paused: v.paused };
  });
  expect(state).toEqual({ loop: true, muted: true, advanced: true, paused: false });
});

test("teclado: ↓ vai para a seção 2 e ↑ volta", async ({ page }) => {
  await ready(page);
  await page.keyboard.press("ArrowDown");
  await expect.poll(() => activeSection(page)).toBe("projetos");
  await page.waitForTimeout(2200);
  await expect(page.locator("#projetos h2")).toBeVisible();
  await page.keyboard.press("ArrowUp");
  await expect.poll(() => activeSection(page)).toBe("hero");
  await page.waitForTimeout(2200);
  await expect(page.locator(".hero-title")).toBeVisible();
});

test("wheel: um gesto avança só uma seção", async ({ page, isMobile }) => {
  test.skip(isMobile, "wheel é desktop");
  await ready(page);
  await page.mouse.move(700, 400);
  for (let i = 0; i < 6; i++) {
    await page.mouse.wheel(0, 120);
    await page.waitForTimeout(40);
  }
  await expect.poll(() => activeSection(page)).toBe("projetos");
  await page.waitForTimeout(2200);
  // só existem duas seções, mas o controlador não pode "pular" além delas
  await page.mouse.wheel(0, -400);
  await expect.poll(() => activeSection(page)).toBe("hero");
});

test("swipe para cima avança e para baixo volta", async ({ page, isMobile }) => {
  test.skip(!isMobile, "swipe é mobile");
  await ready(page);
  const swipe = async (fromY: number, toY: number) => {
    const cdp = await page.context().newCDPSession(page);
    const steps = 8;
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: 200, y: fromY }] });
    for (let i = 1; i <= steps; i++) {
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x: 200, y: fromY + ((toY - fromY) * i) / steps }],
      });
    }
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  };
  await swipe(650, 250);
  await expect.poll(() => activeSection(page)).toBe("projetos");
  await page.waitForTimeout(2200);
  await swipe(250, 650);
  await expect.poll(() => activeSection(page)).toBe("hero");
});

test("balão de fala: abre, gira frases sem repetir e traz CTA a cada 4 cliques", async ({ page }) => {
  await ready(page);
  const boneco = page.getByRole("button", { name: /allan ruas em versão boneco/i });
  const texts: string[] = [];
  for (let i = 1; i <= 4; i++) {
    await boneco.click({ force: true });
    const bubble = page.locator(".bubble");
    await expect(bubble).toBeVisible();
    await page.waitForTimeout(1800);
    texts.push((await bubble.locator("p").innerText()).trim());
    if (i === 4) await expect(bubble.getByRole("link", { name: /falar com a gente/i })).toHaveAttribute("href", /wa\.me/);
  }
  expect(texts[0]).not.toBe(texts[1]);
  expect(texts[1]).not.toBe(texts[2]);
  // live region recebe o texto completo
  await expect(page.locator("[aria-live='polite']").first()).not.toBeEmpty();
});

test("balão fica dentro da viewport e fecha com Esc", async ({ page }) => {
  await ready(page);
  await page.getByRole("button", { name: /allan ruas em versão boneco/i }).click({ force: true });
  const bubble = page.locator(".bubble");
  await expect(bubble).toBeVisible();
  await page.waitForTimeout(700);
  const box = (await bubble.boundingBox())!;
  const vp = page.viewportSize()!;
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(vp.width);
  expect(box.y + box.height).toBeLessThanOrEqual(vp.height);
  await page.keyboard.press("Escape");
  await expect(bubble).toHaveCount(0);
});

test("balão some sozinho e o hover pausa o timer", async ({ page, isMobile }) => {
  test.skip(isMobile, "hover é desktop");
  await ready(page);
  await page.getByRole("button", { name: /allan ruas em versão boneco/i }).click({ force: true });
  const bubble = page.locator(".bubble");
  await expect(bubble).toBeVisible();
  await bubble.hover();
  await page.waitForTimeout(6500);
  await expect(bubble).toBeVisible();
  await page.mouse.move(5, 5);
  await expect(bubble).toHaveCount(0, { timeout: 6000 });
});

test("parallax: o mouse move as camadas", async ({ page, isMobile }) => {
  test.skip(isMobile, "mouse é desktop");
  await ready(page);
  const read = () => page.locator(".char-layer").evaluate((el) => getComputedStyle(el).transform);
  await page.mouse.move(720, 405);
  await page.waitForTimeout(1300);
  const before = await read();
  await page.mouse.move(1400, 100);
  await page.waitForTimeout(1300);
  expect(await read()).not.toBe(before);
});

test.describe("prefers-reduced-motion", () => {
  test.use({ colorScheme: "dark" });
  test("sem parallax, partículas nem float; vídeo segue em loop", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await ready(page);
    const t1 = await page.locator(".char-layer .char-float").evaluate((el) => getComputedStyle(el).transform);
    await page.mouse.move(1000, 200);
    await page.waitForTimeout(1200);
    const t2 = await page.locator(".char-layer .char-float").evaluate((el) => getComputedStyle(el).transform);
    expect(t2).toBe(t1);
    const layer = await page.locator(".char-layer").evaluate((el) => getComputedStyle(el).transform);
    expect(["none", "matrix(1, 0, 0, 1, 0, 0)"]).toContain(layer);
    const paused = await page.locator(".char-layer video").evaluate((v: HTMLVideoElement) => v.paused);
    expect(paused).toBe(false);
    await page.keyboard.press("ArrowDown");
    await expect.poll(() => activeSection(page)).toBe("projetos");
  });
});
