import { test, expect } from '@playwright/test';
import { login, skipUnlessAccounts } from './helpers.js';

test.describe('browser-driven CRUD', () => {
  test.beforeEach(() => skipUnlessAccounts('owner', 'member'));

  test('owner creates a member via UI form', async ({ page }) => {
    const errs = []; page.on('pageerror', e => errs.push(e.message));
    await login(page, 'owner', { settleMs: 3000 });
    await page.goto('/#/members');
    await page.waitForTimeout(2500);
    await page.getByRole('button', { name: /add new/i }).click();
    const modal = page.locator('form').last();
    await modal.locator('input[type="text"]').first().fill('UI Created Member');
    await modal.locator('input[type="email"]').fill('uimember@test.local');
    await modal.locator('input[type="tel"]').fill('7777777777');
    await modal.locator('button[type="submit"], button:has-text("Save"), button:has-text("Add"), button:has-text("Create")').last().click();
    await page.waitForTimeout(2500);
    await expect(page.locator('text=UI Created Member').first()).toBeVisible({ timeout: 10000 });
    expect(errs).toEqual([]);
  });

  test('member cannot open management member creation', async ({ page }) => {
    await login(page, 'member', { settleMs: 2500 });
    await page.goto('/#/members');
    await page.waitForTimeout(2500);
    await expect(page.getByRole('button', { name: /add new/i })).toHaveCount(0);
  });
});
