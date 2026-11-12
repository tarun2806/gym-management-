/**
 * Firestore backup: exports every top-level collection to a timestamped JSON
 * directory. Run on a schedule (e.g. daily cron / GitHub Action with a
 * read-only service account):
 *
 *   GOOGLE_APPLICATION_CREDENTIALS=./service-account.json \
 *   FIREBASE_PROJECT_ID=your-project node scripts/backup-firestore.mjs [outDir]
 *
 * Output: <outDir>/<timestamp>/<collection>.json — plain JSON, restorable via
 * the companion restore script or the Firebase console import.
 *
 * This is the low-cost baseline backup. For point-in-time recovery and
 * managed exports, enable Firestore scheduled exports (requires Blaze plan —
 * do NOT enable without approval).
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

const outDir = process.argv[2] || `backups/${new Date().toISOString().replace(/[:.]/g, '-')}`;
mkdirSync(outDir, { recursive: true });

const collections = await db.listCollections();
let totalDocs = 0;

for (const col of collections) {
  const snap = await col.get();
  const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  writeFileSync(join(outDir, `${col.id}.json`), JSON.stringify(docs, null, 2));
  totalDocs += docs.length;
  console.log(`${col.id}: ${docs.length} docs`);
}

console.log(`Backup complete: ${totalDocs} documents across ${collections.length} collections -> ${outDir}`);
