import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 } });

test('mobile marketing page renders without overflow', async ({ page }) => {
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.goto('/#/');
  await expect(page.locator('h1')).toContainText('Run Your Gym');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  expect(overflow).toBe(false);
  expect(errs).toEqual([]);
});

test('mobile hamburger menu opens and navigates', async ({ page }) => {
  await page.goto('/#/');
  await page.getByRole('button', { name: 'Toggle menu' }).click();
  await page.getByRole('link', { name: 'Pricing' }).last().click();
  await expect(page.locator('h1')).toContainText('Pricing');
});
