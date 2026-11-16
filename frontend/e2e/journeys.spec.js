import { test, expect } from '@playwright/test';
import { login, skipUnlessAccounts } from './helpers.js';

test.describe('staff journey', () => {
  test('staff sees ops, denied finance/platform', async ({ page }) => {
    skipUnlessAccounts('staff');
    const errs = []; page.on('pageerror', e => errs.push(e.message));
    await login(page, 'staff', { settleMs: 2500 });
    await page.goto('/#/members');
    await page.waitForTimeout(2500);
    // staff may view members; must NOT see Subscription nav or platform
    await expect(page.locator('text=Subscription')).toHaveCount(0);
    await page.goto('/#/platform');
    await page.waitForTimeout(1500);
    await expect(page.locator('text=Platform Overview')).not.toBeVisible();
    await page.goto('/#/payments');
    await page.waitForTimeout(1500);
    // financial page must not render management data for staff
    await expect(page.locator('text=Platform Overview')).not.toBeVisible();
    expect(errs).toEqual([]);
  });
});

test.describe('trainer journey', () => {
  test('trainer reaches plans, denied admin', async ({ page }) => {
    skipUnlessAccounts('trainer');
    const errs = []; page.on('pageerror', e => errs.push(e.message));
    await login(page, 'trainer', { settleMs: 2500 });
    await page.goto('/#/workouts');
    await page.waitForTimeout(2500);
    await page.goto('/#/admin');
    await page.waitForTimeout(1500);
    await expect(page.locator('text=Platform Overview')).not.toBeVisible();
    expect(errs).toEqual([]);
  });
});

test.describe('member invite journey', () => {
  test('member portal reachable after membership', async ({ page }) => {
    skipUnlessAccounts('member');
    const errs = []; page.on('pageerror', e => errs.push(e.message));
    await login(page, 'member', { settleMs: 3000 });
    // member should land on portal (RoleHome -> MemberPortal)
    await page.goto('/#/');
    await page.waitForTimeout(2500);
    // portal content or member nav should be visible; management sidebar links absent
    const body = await page.locator('body').innerText();
    expect(body.toLowerCase()).not.toContain('platform overview');
    expect(errs).toEqual([]);
  });
});
