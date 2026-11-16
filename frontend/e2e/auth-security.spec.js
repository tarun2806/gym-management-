import { test, expect } from '@playwright/test';
import { skipUnlessAccounts, accountEmail, E2E_PASSWORD } from './helpers.js';

test.describe('authentication security', () => {
  test('wrong password is rejected and stays on login', async ({ page }) => {
    skipUnlessAccounts('owner');
    await page.goto('/#/login');
    await page.locator('input[type="email"]').fill('gympro-e2e-owner@gmail.com');
    await page.locator('input[type="password"]').first().fill('WrongPassword!999');
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(4000);
    expect(page.url()).toContain('login');
  });

  test('disabled account cannot reach the app', async ({ page }) => {
    skipUnlessAccounts('staff');
    // staff account disabled flag is toggled externally before this run
    await page.goto('/#/login');
    await page.locator('input[type="email"]').fill(accountEmail('staff'));
    await page.locator('input[type="password"]').first().fill(E2E_PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(5000);
    // disabled users are signed out and kept off protected routes
    await page.goto('/#/members');
    await page.waitForTimeout(2500);
    const body = await page.locator('body').innerText();
    expect(body.toLowerCase()).not.toContain('platform overview');
  });
});
