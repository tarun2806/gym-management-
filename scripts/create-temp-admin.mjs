// One-off provisioning helper. NOT for production use and NOT committed.
// Creates an Auth user and writes its users/{uid} profile with role 'owner'.
// Usage: node scripts/create-temp-admin.mjs <email> <password>
import { readFileSync } from 'node:fs';

const env = Object.fromEntries(
  readFileSync(new URL('../.env', import.meta.url), 'utf8')
    .split('\n')
    .map((l) => l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/))
    .filter(Boolean)
    .map(([, k, v]) => [k, v.trim().replace(/^["']|["']$/g, '')]),
);

const KEY = env.VITE_FIREBASE_API_KEY;
const PROJECT = env.VITE_FIREBASE_PROJECT_ID;
if (!KEY || !PROJECT) throw new Error('Missing VITE_FIREBASE_API_KEY / VITE_FIREBASE_PROJECT_ID in .env');

const [email, password] = process.argv.slice(2);
if (!email || !password) throw new Error('Usage: node scripts/create-temp-admin.mjs <email> <password>');

const send = async (method, url, body, token) => {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
  return { status: res.status, json: await res.json().catch(() => ({})) };
};

// 1. Create the Auth user and grab its ID token.
const created = await send(
  'POST',
  `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${KEY}`,
  { email, password, returnSecureToken: true },
);

if (!created.json.idToken) {
  console.log(JSON.stringify({ step: 'auth-signUp', status: created.status, error: created.json.error?.message }));
  process.exit(1);
}
const uid = created.json.localId;
console.log(JSON.stringify({ step: 'auth-signUp', ok: true, uid }));

// 2. Write the profile document. Rules allow self-create only with role 'user',
// so try 'owner' first and report honestly if the deployed rules reject it.
const doc = {
  fields: {
    email: { stringValue: email },
    username: { stringValue: 'Temp Admin' },
    role: { stringValue: 'owner' },
    status: { stringValue: 'active' },
  },
};
const paths = Object.keys(doc.fields).map((f) => `updateMask.fieldPaths=${f}`).join('&');
let result = await send(
  'PATCH',
  `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/users/${uid}?${paths}`,
  doc,
  created.json.idToken,
);

if (result.status >= 400) {
  result = await send(
    'POST',
    `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/users?key=${uid}`,
    doc,
    created.json.idToken,
  );
}

console.log(JSON.stringify({ step: 'firestore-users-doc', status: result.status, message: result.json?.error?.message ?? 'written' }));
