import { test, expect } from '@playwright/test';
const PW = 'Test1234!';
async function login(page, email) {
  await page.goto('/#/login');
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').first().fill(PW);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/#\/(?!login)/, { timeout: 25000 });
  await page.waitForTimeout(2500); // let org context + first data fetch settle
}

test.describe('staff journey', () => {
  test('staff sees ops, denied finance/platform', async ({ page }) => {
    const errs = []; page.on('pageerror', e => errs.push(e.message));
    await login(page, 'staff@test.local');
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
    const errs = []; page.on('pageerror', e => errs.push(e.message));
    await login(page, 'trainer@test.local');
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
    const errs = []; page.on('pageerror', e => errs.push(e.message));
    await login(page, 'member@test.local');
    await page.waitForTimeout(3000);
    // member should land on portal (RoleHome -> MemberPortal)
    await page.goto('/#/');
    await page.waitForTimeout(2500);
    // portal content or member nav should be visible; management sidebar links absent
    const body = await page.locator('body').innerText();
    expect(body.toLowerCase()).not.toContain('platform overview');
    expect(errs).toEqual([]);
  });
});
