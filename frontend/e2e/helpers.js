import process from 'node:process';
import { test } from '@playwright/test';

// Real-Firebase E2E credentials — never hardcode accounts or passwords.
// Set these env vars (CI secrets / local shell) before running authenticated specs:
//   E2E_PASSWORD            shared password for all test accounts
//   E2E_OWNER_EMAIL         account with org_owner membership
//   E2E_PLATFORM_EMAIL      account with platform_admin = true
//   E2E_MEMBER_EMAIL        account linked to a gym member record
//   E2E_STAFF_EMAIL         account with staff membership
//   E2E_TRAINER_EMAIL       account with trainer membership
//   E2E_ORGADMIN_EMAIL      account with org_admin membership
//   E2E_BRANCHMANAGER_EMAIL account with branch_manager membership
// Tests skip cleanly when credentials are absent.

const ACCOUNTS = {
  owner: process.env.E2E_OWNER_EMAIL,
  platform: process.env.E2E_PLATFORM_EMAIL,
  member: process.env.E2E_MEMBER_EMAIL,
  staff: process.env.E2E_STAFF_EMAIL,
  trainer: process.env.E2E_TRAINER_EMAIL,
  orgadmin: process.env.E2E_ORGADMIN_EMAIL,
  branchmanager: process.env.E2E_BRANCHMANAGER_EMAIL,
};
export const E2E_PASSWORD = process.env.E2E_PASSWORD || '';
export function accountEmail(role) { return ACCOUNTS[role]; }

export function accountsReady(...roles) {
  return roles.every((r) => ACCOUNTS[r] && E2E_PASSWORD);
}

export function skipUnlessAccounts(...roles) {
  test.skip(
    !process.env.E2E_API_BASE_URL,
    'Set E2E_API_BASE_URL to the isolated test backend (e.g. http://localhost:8091) — refusing to run authenticated tests against an unconfigured API'
  );
  test.skip(
    !accountsReady(...roles),
    `Missing E2E credentials — set E2E_${roles.map((r) => r.toUpperCase()).join('_AND_E2E_')}_EMAIL and E2E_PASSWORD`
  );
}

export async function login(page, role, { settleMs = 0 } = {}) {
  skipUnlessAccounts(role);
  await page.goto('/#/login');
  await page.locator('input[type="email"]').fill(ACCOUNTS[role]);
  await page.locator('input[type="password"]').first().fill(E2E_PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/#\/(?!login)/, { timeout: 25000 });
  if (settleMs) await page.waitForTimeout(settleMs);
}

export function apiBase() {
  // No default: authenticated specs must target an explicitly configured
  // isolated backend so they can never write into the dev database.
  const base = process.env.E2E_API_BASE_URL || '';
  if (!base) return '';
  // Hard guard: the dev backend (:8090) serves the `gympro` database which
  // contains real tenant data (Fitness Den). Test writes must never reach it.
  const devBackends = ['localhost:8090', '127.0.0.1:8090'];
  const host = new URL(base).host;
  if (devBackends.includes(host)) {
    throw new Error(
      `REFUSING E2E run: E2E_API_BASE_URL=${base} targets the dev backend ` +
      'which uses the `gympro` database with real tenant data. Point it at ' +
      'the isolated test backend (e.g. http://localhost:8091) instead.'
    );
  }
  return base;
}

// Destructive/reset helpers must never run against `gympro`. Call this before
// any test-side cleanup. Requires E2E_DB_NAME to be explicitly set to the
// integration database name.
export function requireTestDatabase() {
  const db = process.env.E2E_DB_NAME || '';
  if (db !== 'gympro_it') {
    throw new Error(
      `REFUSING destructive E2E operation: E2E_DB_NAME must be 'gympro_it' ` +
      `(got '${db || 'unset'}'). Destructive test operations are blocked ` +
      'against the `gympro` development database.'
    );
  }
}

// Extract the Firebase ID token the app persisted in IndexedDB.
export async function getIdToken(page) {
  return page.evaluate(async () => {
    const dbs = await indexedDB.databases();
    const db = dbs.find((d) => d.name === 'firebaseLocalStorageDb');
    if (!db) return null;
    const idb = await new Promise((res, rej) => {
      const r = indexedDB.open(db.name);
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
    const tx = idb.transaction('firebaseLocalStorage', 'readonly');
    const store = tx.objectStore('firebaseLocalStorage');
    const keys = await new Promise((res) => {
      const r = store.getAllKeys();
      r.onsuccess = () => res(r.result);
    });
    for (const k of keys) {
      const v = await new Promise((res) => {
        const r = store.get(k);
        r.onsuccess = () => res(r.result);
      });
      const t = v?.value?.stsTokenManager?.accessToken;
      if (t) return t;
    }
    return null;
  });
}
