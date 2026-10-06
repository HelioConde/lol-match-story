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

    const loadingPage=await desktop.newPage();
    await loadingPage.route('**/public-lol-profile', async route => {
      await new Promise(r=>setTimeout(r,15000));
      await route.abort();
    });
    await loadingPage.goto(BASE_URL,{waitUntil:'domcontentloaded'});
    await settle(loadingPage);
    await loadingPage.locator('#gameName').fill('AlchemyFlames');
    await loadingPage.locator('#tagLine').fill('BR1');
    await loadingPage.locator('#platform').selectOption('br1');
    await loadingPage.locator('#lookupForm button[type="submit"]').click();
    await loadingPage.locator('#storyLoading:not(.hidden)').waitFor({state:'visible',timeout:5000});
    await loadingPage.waitForTimeout(300);
    await capture(loadingPage,'latest-loading-full.png');
    await loadingPage.close();

    let liveCaptureState='unknown';
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await settle(page);
    await page.locator('#gameName').fill('AlchemyFlames');
    await page.locator('#tagLine').fill('BR1');
    await page.locator('#platform').selectOption('br1');
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

    let publicStoryState='unknown';
    await page.goto(BASE_URL + '/story.html?match=BR1_3288690697', { waitUntil: 'domcontentloaded' });
    try {
      await Promise.race([
        page.locator('#publicStory:not(.hidden)').waitFor({state:'visible',timeout:12000}),
        page.locator('#publicStatus').waitFor({state:'visible',timeout:12000})
      ]);
    } catch {}
    await settle(page);
    publicStoryState = await page.locator('#publicStory').evaluate(el => el.classList.contains('hidden') ? 'unavailable' : 'loaded').catch(()=> 'unavailable');
    await capture(page, 'latest-public-story-full.png');
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
    await capture(mobilePage, 'latest-mobile-home-full.png');

    let liveMobileState='unknown';
    await mobilePage.locator('#gameName').fill('AlchemyFlames');
    await mobilePage.locator('#tagLine').fill('BR1');
    await mobilePage.locator('#platform').selectOption('br1');
    await mobilePage.locator('#lookupForm button[type="submit"]').click();
    try {
      await Promise.race([
        mobilePage.locator('#storyApp:not(.hidden)').waitFor({state:'visible',timeout:20000}),
        mobilePage.locator('#sourceState.error').waitFor({state:'visible',timeout:20000})
      ]);
    } catch {}
    try {
      await mobilePage.waitForFunction(() => {
        const el=document.querySelector('#timelineSource');
        return !el || !/carregando|loading/i.test(el.textContent || '');
      }, null, {timeout:12000});
    } catch {}
    await settle(mobilePage);
    liveMobileState=await mobilePage.locator('#sourceState').evaluate(el=>{
      if(el.classList.contains('live')) return 'live';
      if(el.classList.contains('demo')) return 'fallback-demo';
      if(el.classList.contains('error')) return 'error';
      return 'unknown';
    }).catch(()=> 'unknown');
    await capture(mobilePage,'latest-alchemy-mobile-full.png');

    let publicStoryMobileState='unknown';
    await mobilePage.goto(BASE_URL + '/story.html?match=BR1_3288690697', { waitUntil: 'domcontentloaded' });
    try {
      await Promise.race([
        mobilePage.locator('#publicStory:not(.hidden)').waitFor({state:'visible',timeout:12000}),
        mobilePage.locator('#publicStatus').waitFor({state:'visible',timeout:12000})
      ]);
    } catch {}
    await settle(mobilePage);
    publicStoryMobileState = await mobilePage.locator('#publicStory').evaluate(el => el.classList.contains('hidden') ? 'unavailable' : 'loaded').catch(()=> 'unavailable');
    await capture(mobilePage, 'latest-public-story-mobile-full.png');

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
        { file: 'latest-loading-full.png', viewport: '1440x1000', state: 'loading-skeleton' },
        { file: 'latest-alchemy-full.png', viewport: '1440x1000', state: 'alchemy-' + liveCaptureState },
        { file: 'latest-story-full.png', viewport: '1440x1000', state: 'demo-story' },
        { file: 'latest-public-story-full.png', viewport: '1440x1000', state: 'public-story-' + publicStoryState },
        { file: 'latest-mobile-home-full.png', viewport: '390x844', state: 'home-mobile' },
        { file: 'latest-alchemy-mobile-full.png', viewport: '390x844', state: 'alchemy-mobile-' + liveMobileState },
        { file: 'latest-public-story-mobile-full.png', viewport: '390x844', state: 'public-story-mobile-' + publicStoryMobileState },
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
