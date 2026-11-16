import { test, expect } from '@playwright/test';
import { login, skipUnlessAccounts } from './helpers.js';

const VIEWPORTS = [
  [375, 812], [390, 844], [768, 1024], [1024, 768], [1366, 768], [1920, 1080],
];
const ROUTES = ['/', '/members', '/classes', '/subscription'];

test.describe('responsive shell screenshots', () => {
  test.beforeEach(() => skipUnlessAccounts('orgadmin'));

  for (const [w, h] of VIEWPORTS) {
    test(`capture ${w}x${h}`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: h });
      const errs = [];
      page.on('pageerror', (e) => errs.push(e.message));
      await login(page, 'orgadmin', { settleMs: 3000 });
      for (const r of ROUTES) {
        await page.goto(`/#${r}`);
        await page.waitForTimeout(1800);
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth > window.innerWidth + 1
        );
        expect(overflow, `${r} overflow at ${w}x${h}`).toBe(false);
        await page.screenshot({
          path: `test-results/shots/${w}x${h}${r === '/' ? '-home' : r}.png`,
          fullPage: false,
        });
      }
      expect(errs).toEqual([]);
    });
  }
});
