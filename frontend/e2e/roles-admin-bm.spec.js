import { test, expect } from '@playwright/test';
import { login, skipUnlessAccounts, getIdToken, apiBase } from './helpers.js';

const FOREIGN_ORG = '00000000-0000-4000-8000-000000000000';
const FOREIGN_BRANCH = '00000000-0000-4000-8000-000000000001';

test.describe('org_admin role', () => {
  test.beforeEach(() => skipUnlessAccounts('orgadmin'));

  test('login, session restore, dashboard, sidebar, finance access', async ({ page }) => {
    const errs = []; page.on('pageerror', e => errs.push(e.message));
    await login(page, 'orgadmin', { settleMs: 3000 });
    // dashboard + shell immediately on /
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator('nav, aside').first()).toBeVisible();
    // finance capability → Payments nav present
    await expect(page.locator('a[href$="/payments"]').first()).toBeVisible();
    // session restoration: reload keeps authenticated shell
    await page.reload();
    await page.waitForTimeout(3000);
    await expect(page.locator('nav, aside').first()).toBeVisible({ timeout: 15000 });
    // platform denied
    await page.goto('/#/platform');
    await page.waitForTimeout(2000);
    await expect(page.locator('text=Platform Overview')).not.toBeVisible();
    expect(errs).toEqual([]);
  });

  test('API: org_admin reads own org members, denied foreign org', async ({ page, request }) => {
    skipUnlessAccounts('orgadmin');
    await login(page, 'orgadmin');
    const token = await getIdToken(page);
    expect(token).toBeTruthy();
    const base = apiBase();
    const auth = { Authorization: `Bearer ${token}` };
    const memberships = await request.get(`${base}/api/me/memberships`, { headers: auth });
    expect(memberships.ok()).toBeTruthy();
    const orgId = (await memberships.json())[0].organization_id;
    expect(orgId).toBeTruthy();
    const own = await request.get(`${base}/api/members`, {
      headers: { ...auth, 'X-Org-Id': orgId },
    });
    expect(own.ok()).toBeTruthy();
    // org_admin is org-wide — sees the other branch's member
    const ownIds = (await own.json()).map((m) => m.id);
    expect(ownIds).toContain('e2e00000-0000-4000-8000-0000000000m2');
    const foreign = await request.get(`${base}/api/members`, {
      headers: { ...auth, 'X-Org-Id': FOREIGN_ORG },
    });
    expect(foreign.status()).toBe(403);
  });
});

test.describe('branch_manager role', () => {
  test.beforeEach(() => skipUnlessAccounts('branchmanager'));

  test('login, session restore, branch-scoped ops, finance/platform denied', async ({ page }) => {
    const errs = []; page.on('pageerror', e => errs.push(e.message));
    await login(page, 'branchmanager', { settleMs: 3000 });
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator('nav, aside').first()).toBeVisible();
    // ops pages reachable
    await page.goto('/#/members');
    await page.waitForTimeout(2500);
    await expect(page.locator('body')).not.toContainText('Platform Overview');
    // finance nav hidden (no "payments" capability)
    await expect(page.locator('a[href$="/payments"]')).toHaveCount(0);
    // finance API denied
    await page.goto('/#/payments');
    await page.waitForTimeout(2500);
    await expect(page.locator('text=Platform Overview')).not.toBeVisible();
    // platform denied
    await page.goto('/#/platform');
    await page.waitForTimeout(2000);
    await expect(page.locator('text=Platform Overview')).not.toBeVisible();
    // session restore
    await page.reload();
    await page.waitForTimeout(3000);
    await expect(page.locator('nav, aside').first()).toBeVisible({ timeout: 15000 });
    expect(errs).toEqual([]);
  });

  test('API: branch_manager denied finance + foreign org/branch', async ({ page, request }) => {
    skipUnlessAccounts('branchmanager');
    await login(page, 'branchmanager');
    const token = await getIdToken(page);
    expect(token).toBeTruthy();
    const base = apiBase();
    const auth = { Authorization: `Bearer ${token}` };
    const memberships = await request.get(`${base}/api/me/memberships`, { headers: auth });
    expect(memberships.ok()).toBeTruthy();
    const orgId = (await memberships.json())[0].organization_id;
    expect(orgId).toBeTruthy();
    // finance endpoints are FINANCE_ROLES — branch_manager must 403
    for (const path of ['/api/payments', '/api/payroll', '/api/expenses']) {
      const res = await request.get(`${base}${path}`, {
        headers: { ...auth, 'X-Org-Id': orgId },
      });
      expect(res.status(), `${path} should deny branch_manager`).toBe(403);
    }
    // ops read still allowed (branch-scoped)
    const members = await request.get(`${base}/api/members`, {
      headers: { ...auth, 'X-Org-Id': orgId },
    });
    expect(members.ok()).toBeTruthy();
    const memberIds = (await members.json()).map((m) => m.id);
    // seeded member lives in a different branch — must be invisible
    expect(memberIds).not.toContain('e2e00000-0000-4000-8000-0000000000m2');
    // a forged X-Branch-Id header must not widen scope either
    const forged = await request.get(`${base}/api/members`, {
      headers: { ...auth, 'X-Org-Id': orgId, 'X-Branch-Id': FOREIGN_BRANCH },
    });
    expect(forged.ok()).toBeTruthy();
    const forgedIds = (await forged.json()).map((m) => m.id);
    expect(forgedIds).not.toContain('e2e00000-0000-4000-8000-0000000000m2');
    expect(forgedIds).toEqual(memberIds);
    // foreign org → 403
    const foreign = await request.get(`${base}/api/members`, {
      headers: { ...auth, 'X-Org-Id': FOREIGN_ORG },
    });
    expect(foreign.status()).toBe(403);
  });
});
