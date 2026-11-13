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
const SIZES = [[375,812],[390,844],[768,1024],[1366,768],[1920,1080]];
for (const [w,h] of SIZES) {
  test(`app shell ${w}x${h}: owner pages no overflow`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    const errs = []; page.on('pageerror', e => errs.push(e.message));
    await login(page, 'owner@test.local');
    for (const r of ['/', '/members', '/subscription', '/classes']) {
      await page.goto(`/#${r}`); await page.waitForTimeout(1500);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
      expect(overflow, `${r} overflow at ${w}x${h}`).toBe(false);
    }
    expect(errs).toEqual([]);
  });
}
test('platform admin shell 390px', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await login(page, 'platform@test.local');
  await page.goto('/#/platform'); await page.waitForTimeout(2000);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  expect(overflow).toBe(false);
  expect(errs).toEqual([]);
});
