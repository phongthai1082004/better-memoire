import { mkdir } from "node:fs/promises";
import { chromium } from "playwright-core";

const EDGE =
  process.env.EDGE_PATH ??
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const BASE = process.env.BASE_URL ?? "http://localhost:3001";
const OUT = "../.screens";

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: EDGE, headless: true });

async function settle(page) {
  // Walk the page once so lazy photographs below the fold have loaded.
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let y = 0;
      const step = Math.round(window.innerHeight * 0.75);
      const timer = setInterval(() => {
        window.scrollBy(0, step);
        y += step;
        if (y > document.body.scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 50);
    });
  });
  await page.waitForTimeout(700);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(350);
}

async function shot(name, path, viewport, locale = "vi") {
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
    locale: locale === "vi" ? "vi-VN" : "en-US",
  });
  if (locale === "en") {
    await context.addCookies([{ name: "bm_locale", value: "en", url: BASE }]);
  }

  const page = await context.newPage();
  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
  await settle(page);

  const metrics = await page.evaluate(() => {
    const width = window.innerWidth;
    const offenders = [...document.querySelectorAll("*")]
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          tag: element.tagName,
          cls: String(element.className ?? "").slice(0, 70),
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
        };
      })
      .filter((item) => item.right > width + 1 || item.left < -1)
      .slice(0, 15);

    return {
      innerWidth: width,
      scrollWidth: document.documentElement.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
      offenders,
    };
  });

  console.log(name, JSON.stringify(metrics));
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
  await context.close();
}

await shot("chalkboard-landing-desktop", "/", { width: 1440, height: 1000 });
await shot("chalkboard-landing-mobile", "/", { width: 390, height: 844 });
await shot("chalkboard-landing-english", "/", { width: 1440, height: 1000 }, "en");
await shot("chalkboard-auth-login", "/auth", { width: 1440, height: 1000 });
await shot("chalkboard-auth-register-mobile", "/auth?mode=register", {
  width: 390,
  height: 844,
});
await shot("chalkboard-not-found", "/this-page-does-not-exist", {
  width: 1440,
  height: 1000,
});

{
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
    locale: "vi-VN",
  });
  const page = await context.newPage();
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.locator('button[aria-controls="mobile-menu"]').click();
  await page.waitForTimeout(450);
  await page.screenshot({ path: `${OUT}/chalkboard-mobile-menu.png` });
  await context.close();
}

await browser.close();
