import { test, expect } from '@playwright/test';
const SIZES = [
  [375, 812, 'mobile-s'], [390, 844, 'mobile'], [768, 1024, 'tablet'],
  [1366, 768, 'laptop'], [1920, 1080, 'desktop'],
];
for (const [w, h, name] of SIZES) {
  test(`${name} ${w}x${h}: marketing pages no overflow`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    const errs = []; page.on('pageerror', e => errs.push(e.message));
    for (const r of ['/', '/features', '/pricing', '/contact']) {
      await page.goto(`/#${r}`);
      await page.waitForTimeout(800);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
      expect(overflow, `${r} overflow at ${w}x${h}`).toBe(false);
    }
    expect(errs).toEqual([]);
  });
}
