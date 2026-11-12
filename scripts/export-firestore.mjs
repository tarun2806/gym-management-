/**
 * Firestore export for MySQL migration (read-only — never modifies Firestore).
 *
 *   GOOGLE_APPLICATION_CREDENTIALS=./service-account.json \
 *   FIREBASE_PROJECT_ID=your-project node scripts/export-firestore.mjs [outDir]
 *
 * Writes <outDir>/<collection>.json — array of {id, ...fields} with Firestore
 * Timestamps converted to ISO strings and nested objects preserved.
 */
import admin from 'firebase-admin';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const projectId = process.env.FIREBASE_PROJECT_ID;
if (!projectId) {
  console.error('FIREBASE_PROJECT_ID is required');
  process.exit(1);
}

admin.initializeApp({ projectId });
const db = admin.firestore();

function serialize(value) {
  if (value == null) return value;
  if (typeof value === 'object') {
    if (value.toDate) return value.toDate().toISOString();       // Timestamp
    if (value._seconds != null) return new Date(value._seconds * 1000).toISOString();
    if (Array.isArray(value)) return value.map(serialize);
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = serialize(v);
    return out;
  }
  return value;
}

const outDir = process.argv[2] || `firestore-export/${new Date().toISOString().replace(/[:.]/g, '-')}`;
mkdirSync(outDir, { recursive: true });

const collections = await db.listCollections();
let total = 0;
for (const col of collections) {
  const snap = await col.get();
  const docs = snap.docs.map(d => ({ id: d.id, ...serialize(d.data()) }));
  writeFileSync(join(outDir, `${col.id}.json`), JSON.stringify(docs, null, 2));
  total += docs.length;
  console.log(`${col.id}: ${docs.length} docs`);
}
console.log(`Export complete: ${total} docs -> ${outDir}`);
