const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

test('home não possui violações WCAG sérias ou críticas', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa']).analyze();
  const severe = results.violations.filter(v => v.impact === 'serious' || v.impact === 'critical');
  expect(severe, severe.map(v => v.id + ': ' + v.help).join('\n')).toEqual([]);
});

test('história demo não possui violações WCAG sérias ou críticas', async ({ page }) => {
  await page.goto('/');
  await page.locator('#demoBtn').click();
  const results = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa']).analyze();
  const severe = results.violations.filter(v => v.impact === 'serious' || v.impact === 'critical');
  expect(severe, severe.map(v => v.id + ': ' + v.help).join('\n')).toEqual([]);
});
