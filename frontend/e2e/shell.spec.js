import { test, expect } from '@playwright/test';
import { login, skipUnlessAccounts } from './helpers.js';

const SIZES = [[375,812],[390,844],[768,1024],[1366,768],[1920,1080]];
for (const [w,h] of SIZES) {
  test(`app shell ${w}x${h}: owner pages no overflow`, async ({ page }) => {
    skipUnlessAccounts('owner');
    await page.setViewportSize({ width: w, height: h });
    const errs = []; page.on('pageerror', e => errs.push(e.message));
    await login(page, 'owner', { settleMs: 3000 });
    for (const r of ['/', '/members', '/subscription', '/classes']) {
      await page.goto(`/#${r}`); await page.waitForTimeout(1500);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
      expect(overflow, `${r} overflow at ${w}x${h}`).toBe(false);
    }
    expect(errs).toEqual([]);
  });
}
test('platform admin shell 390px', async ({ page }) => {
  skipUnlessAccounts('platform');
  await page.setViewportSize({ width: 390, height: 844 });
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await login(page, 'platform', { settleMs: 3000 });
  await page.goto('/#/platform'); await page.waitForTimeout(2000);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  expect(overflow).toBe(false);
  expect(errs).toEqual([]);
});
