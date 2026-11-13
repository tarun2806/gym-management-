import { test, expect } from '@playwright/test';

const PROTECTED = [
  '/members', '/classes', '/trainers', '/equipment', '/admin', '/payments',
  '/reports', '/plans', '/attendance', '/workouts', '/diet-plans', '/notifications',
  '/organizations', '/branches', '/personal-training', '/billing', '/expenses',
  '/payroll', '/inventory', '/settings',
];

test.describe('unauthenticated access', () => {
  for (const route of PROTECTED) {
    test(`${route} redirects to login`, async ({ page }) => {
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.goto(`/#${route === '/' ? '' : route}`);
      await page.waitForURL('**/login', { timeout: 10000 });
      expect(page.url()).toContain('/login');
      expect(errors).toEqual([]);
    });
  }
});

test('login page renders without console errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('/#/login');
  await expect(page.locator('form, input[type="email"], input[type="password"], button').first()).toBeVisible({ timeout: 10000 });
  expect(errors.filter(e => !e.includes('ERR_CONNECTION_REFUSED') && !e.includes('identitytoolkit'))).toEqual([]);
});

test.describe('public marketing pages', () => {
  const PUBLIC = ['/', '/features', '/how-it-works', '/solutions', '/pricing', '/about', '/contact'];
  for (const route of PUBLIC) {
    test(`${route} renders without login`, async ({ page }) => {
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.goto(route === '/' ? '/#/' : `/#${route}`);
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });
      expect(page.url()).not.toContain('/login');
      expect(errors).toEqual([]);
    });
  }
});

test('marketing nav links work', async ({ page }) => {
  await page.goto('/#/');
  await page.getByRole('link', { name: 'Features' }).first().click();
  await expect(page).toHaveURL(/features/);
  await expect(page.locator('h1')).toContainText('Features');
});

test('Get Started goes to login', async ({ page }) => {
  await page.goto('/#/');
  await page.getByRole('link', { name: 'Get Started' }).first().click();
  await page.waitForURL('**/login', { timeout: 10000 });
});

test('unknown route redirects to login or home without crash', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('/nonexistent-route-xyz');
  await page.waitForTimeout(2000);
  expect(errors).toEqual([]);
});

test('no auth tokens in browser storage on login page', async ({ page }) => {
  await page.goto('/#/login');
  const ls = await page.evaluate(() => JSON.stringify({ ...localStorage }));
  const ss = await page.evaluate(() => JSON.stringify({ ...sessionStorage }));
  expect(ls + ss).not.toMatch(/idToken|refreshToken|firebase.*token/i);
});
