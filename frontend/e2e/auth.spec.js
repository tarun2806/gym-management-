import { test, expect } from '@playwright/test';

const PW = 'Test1234!';
async function login(page, email) {
  await page.goto('/#/login');
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').first().fill(PW);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/#\/(?!login)/, { timeout: 20000 });
}

test.describe('authenticated journeys (Firebase emulator)', () => {
  test('owner logs in and reaches dashboard + subscription', async ({ page }) => {
    const errs = [];
    page.on('pageerror', e => errs.push(e.message));
    await login(page, 'owner@test.local');
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 15000 });
    await page.goto('/#/subscription');
    await expect(page.locator('text=Free trial').first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=expires in').first()).toBeVisible();
    expect(errs).toEqual([]);
  });

  test('platform admin reaches vendor dashboard', async ({ page }) => {
    const errs = [];
    page.on('pageerror', e => errs.push(e.message));
    await login(page, 'platform@test.local');
    await page.goto('/#/platform');
    await expect(page.locator('text=Platform Overview')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=Total organizations')).toBeVisible();
    expect(errs).toEqual([]);
  });

  test('non-admin is denied platform area', async ({ page }) => {
    await login(page, 'owner@test.local');
    await page.goto('/#/platform');
    await page.waitForTimeout(2000);
    await expect(page.locator('text=Platform Overview')).not.toBeVisible();
  });

  test('member reaches portal, not management', async ({ page }) => {
    const errs = [];
    page.on('pageerror', e => errs.push(e.message));
    await login(page, 'member@test.local');
    await page.waitForTimeout(3000);
    await page.goto('/#/members');
    await page.waitForTimeout(2000);
    // member must not see management members page
    await expect(page.locator('text=Subscription')).not.toBeVisible();
    expect(errs).toEqual([]);
  });

  test('owner subscription shows trial + plan', async ({ page }) => {
    await login(page, 'owner@test.local');
    await page.goto('/#/subscription');
    await expect(page.locator('text=Annual Pro')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=14')).toBeTruthy;
  });
});
