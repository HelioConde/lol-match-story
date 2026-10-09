const { test, expect } = require('@playwright/test');

test('PWA nunca armazena Riot ID ou token da URL e preserva caches de outros projetos', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(async () => {
    const foreign = await caches.open('agendaleve-shell-sentinel');
    await foreign.put('/foreign-app-data', new Response('preserved'));
    await navigator.serviceWorker.register('./service-worker.js');
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);

  const privateUrl = '/?player=AlchemyFlames%23BR1&token=private-regression-token';
  await page.goto(privateUrl, { waitUntil: 'domcontentloaded' });
  await page.evaluate(async () => {
    await fetch('./version.json?token=private-regression-token', { cache: 'no-store' });
  });
  const result = await page.evaluate(async () => {
    const names = await caches.keys();
    const urls = [];
    for (const name of names) {
      const cache = await caches.open(name);
      urls.push(...(await cache.keys()).map(request => request.url));
    }
    const foreign = await caches.open('agendaleve-shell-sentinel');
    return { names, urls, foreignValue: await (await foreign.match('/foreign-app-data'))?.text() };
  });

  expect(result.names).toContain('lol-match-story-v4');
  expect(result.foreignValue).toBe('preserved');
  expect(result.urls.some(url => url.includes('private-regression-token'))).toBe(false);
  expect(result.urls.some(url => url.includes('version.json?'))).toBe(false);
});

test('atualização do PWA remove somente caches de versões antigas do LoL Match Story', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(async () => {
    // The homepage itself registers a worker on load. Force a *new* installation
    // so the legacy cache exists before the activation lifecycle runs.
    const previous = await navigator.serviceWorker.getRegistration();
    if (previous) await previous.unregister();
    await caches.open('lol-match-story-v2');
    await caches.open('chibi-gg-offline-sentinel');
    await navigator.serviceWorker.register('./service-worker.js?qa=upgrade', { scope: './' });
    await navigator.serviceWorker.ready;
  });
  await expect.poll(() => page.evaluate(() => caches.keys())).toContain('lol-match-story-v4');
  await expect.poll(() => page.evaluate(() => caches.keys())).not.toContain('lol-match-story-v2');
  const names = await page.evaluate(() => caches.keys());
  expect(names).toContain('chibi-gg-offline-sentinel');
});

test('homepage continua acessível offline depois da instalação do PWA', async ({ page, context }) => {
  await page.goto('/');
  await page.evaluate(async () => {
    await navigator.serviceWorker.register('./service-worker.js');
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  await context.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('#lookupForm')).toBeVisible();
  await context.setOffline(false);
});
