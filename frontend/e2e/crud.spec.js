import { test, expect } from '@playwright/test';
const PW = 'Test1234!';
async function login(page, email) {
  await page.goto('/#/login');
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').first().fill(PW);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/#\/(?!login)/, { timeout: 25000 });
  await page.waitForTimeout(3000);
}

test.describe('browser-driven CRUD', () => {
  test('owner creates a member via UI form', async ({ page }) => {
    const errs = []; page.on('pageerror', e => errs.push(e.message));
    await login(page, 'owner@test.local');
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
    await login(page, 'member@test.local');
    await page.goto('/#/members');
    await page.waitForTimeout(2500);
    await expect(page.getByRole('button', { name: /add new/i })).toHaveCount(0);
  });
});
