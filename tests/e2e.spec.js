const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test('abre em PT-BR e mostra a proposta principal', async ({ page }) => {
  await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
  await expect(page.getByRole('heading', { name: /Pare de olhar só números/i })).toBeVisible();
  await expect(page.locator('#lookupForm')).toBeVisible();
});

test('demo cria uma história navegável', async ({ page }) => {
  await page.getByRole('button', { name: /Ver demo/i }).click();
  await expect(page.locator('#storyApp')).toBeVisible();
  await expect(page.locator('#storyTitle')).toContainText(/partida|dano|venceu/i);
  await expect(page.locator('.match-pill')).toHaveCount(3);
  await page.locator('.match-pill').nth(1).click();
  await expect(page.locator('#championName')).toHaveText('Jinx');
});

test('idioma inglês persiste', async ({ page }) => {
  await page.locator('#langBtn').click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { name: /Stop looking only at numbers/i })).toBeVisible();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

test('dados reais substituem demo quando public-lol-profile responde', async ({ page }) => {
  await page.route('**/public-lol-profile', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      player: { gameName: 'RealPlayer', tagLine: 'BR1' },
      matches: [{
        id: 'BR1_1', championName: 'Lux', championId: 99, win: true,
        kills: 9, deaths: 2, assists: 14, cs: 220, visionScore: 36,
        goldEarned: 13200, gameDuration: 1920
      }]
    })
  }));

  await page.locator('#gameName').fill('RealPlayer');
  await page.locator('#tagLine').fill('BR1');
  await page.getByRole('button', { name: /Criar minha história/i }).click();

  await expect(page.locator('#storyApp')).toBeVisible();
  await expect(page.locator('#playerTitle')).toHaveText('RealPlayer#BR1');
  await expect(page.locator('#championName')).toHaveText('Lux');
  await expect(page.locator('#sourceState')).toContainText('Dados Riot carregados');
});

test('falha do backend mantém fallback demonstrativo identificado', async ({ page }) => {
  await page.route('**/public-lol-profile', route => route.fulfill({
    status: 429,
    contentType: 'application/json',
    body: JSON.stringify({ error: 'rate_limited' })
  }));
  await page.getByRole('button', { name: /Criar minha história/i }).click();
  await expect(page.locator('#storyApp')).toBeVisible();
  await expect(page.locator('#sourceState')).toContainText('exemplo');
});

test('mobile não cria overflow horizontal crítico', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/');
  const bodyWidth = await page.locator('body').evaluate(el => el.scrollWidth);
  expect(bodyWidth).toBeLessThanOrEqual(361);
});