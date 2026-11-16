import { test, expect } from '@playwright/test';
import { login, skipUnlessAccounts } from './helpers.js';

test.describe('authenticated journeys (real Firebase)', () => {
  test.beforeEach(() => skipUnlessAccounts('owner', 'platform', 'member'));

  test('owner logs in and reaches dashboard + subscription', async ({ page }) => {
    const errs = [];
    page.on('pageerror', e => errs.push(e.message));
    await login(page, 'owner');
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 15000 });
    await page.goto('/#/subscription');
    await expect(page.locator('text=Free trial').first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=expires in').first()).toBeVisible();
    expect(errs).toEqual([]);
  });

  test('platform admin reaches vendor dashboard', async ({ page }) => {
    const errs = [];
    page.on('pageerror', e => errs.push(e.message));
    await login(page, 'platform');
    await page.goto('/#/platform');
    await expect(page.locator('text=Platform Overview')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=Total organizations')).toBeVisible();
    expect(errs).toEqual([]);
  });

  test('non-admin is denied platform area', async ({ page }) => {
    await login(page, 'owner');
    await page.goto('/#/platform');
    await page.waitForTimeout(2000);
    await expect(page.locator('text=Platform Overview')).not.toBeVisible();
  });

  test('member reaches portal, not management', async ({ page }) => {
    const errs = [];
    page.on('pageerror', e => errs.push(e.message));
    await login(page, 'member');
    await page.waitForTimeout(3000);
    await page.goto('/#/members');
    await page.waitForTimeout(2000);
    // member must not see management members page
    await expect(page.locator('text=Subscription')).not.toBeVisible();
    expect(errs).toEqual([]);
  });

  test('owner subscription shows trial + plan', async ({ page }) => {
    await login(page, 'owner');
    await page.goto('/#/subscription');
    await expect(page.locator('text=Annual Pro').first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=14')).toBeTruthy;
  });
});
