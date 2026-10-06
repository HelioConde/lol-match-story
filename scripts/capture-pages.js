const { chromium } = require('@playwright/test');
const fs = require('node:fs/promises');
const path = require('node:path');

const BASE_URL = process.env.CAPTURE_BASE_URL || 'http://127.0.0.1:4173';
const OUT_DIR = path.resolve(process.cwd(), 'screenshots');

async function settle(page) {
  await page.waitForLoadState('domcontentloaded');
  await page.evaluate(async () => {
    if (document.fonts?.ready) await document.fonts.ready;
  });
  await page.waitForTimeout(1200);
}

async function capture(page, file) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: path.join(OUT_DIR, file),
    fullPage: true,
    animations: 'disabled'
  });
}

(async () => {
  await fs.mkdir(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  try {
    const desktop = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      deviceScaleFactor: 1
    });
    const page = await desktop.newPage();

    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await settle(page);
    await capture(page, 'latest-home-full.png');

    let liveCaptureState='unknown';
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await settle(page);
    await page.locator('#lookupForm button[type="submit"]').click();
    try {
      await Promise.race([
        page.locator('#storyApp:not(.hidden)').waitFor({ state:'visible', timeout:20000 }),
        page.locator('#sourceState.error').waitFor({ state:'visible', timeout:20000 })
      ]);
    } catch {}
    try {
      await page.waitForFunction(() => {
        const el=document.querySelector('#timelineSource');
        return !el || !/carregando|loading/i.test(el.textContent || '');
      }, null, { timeout: 12000 });
    } catch {}
    await settle(page);
    liveCaptureState = await page.locator('#sourceState').evaluate(el => {
      if (el.classList.contains('live')) return 'live';
      if (el.classList.contains('demo')) return 'fallback-demo';
      if (el.classList.contains('error')) return 'error';
      return 'unknown';
    });
    await capture(page, 'latest-alchemy-full.png');

    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await settle(page);
    await page.locator('#demoBtn').click();
    await page.locator('#storyApp:not(.hidden)').waitFor({ state: 'visible' });
    await settle(page);
    await capture(page, 'latest-story-full.png');
    await desktop.close();

    const mobile = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 1,
      isMobile: true,
      hasTouch: true
    });
    const mobilePage = await mobile.newPage();
    await mobilePage.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await settle(mobilePage);
    await mobilePage.locator('#demoBtn').click();
    await mobilePage.locator('#storyApp:not(.hidden)').waitFor({ state: 'visible' });
    await settle(mobilePage);
    await capture(mobilePage, 'latest-mobile-full.png');
    await mobile.close();

    const metadata = {
      generatedAt: new Date().toISOString(),
      source: BASE_URL,
      commit: process.env.GITHUB_SHA || null,
      captures: [
        { file: 'latest-home-full.png', viewport: '1440x1000', state: 'home' },
        { file: 'latest-alchemy-full.png', viewport: '1440x1000', state: 'alchemy-' + liveCaptureState },
        { file: 'latest-story-full.png', viewport: '1440x1000', state: 'demo-story' },
        { file: 'latest-mobile-full.png', viewport: '390x844', state: 'demo-story-mobile' }
      ]
    };
    await fs.writeFile(path.join(OUT_DIR, 'metadata.json'), JSON.stringify(metadata, null, 2) + '\n');
  } finally {
    await browser.close();
  }
})().catch(err => {
  console.error(err);
  process.exit(1);
});
