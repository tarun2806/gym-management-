#!/usr/env node

/**
 * One-Time Migration Script: Migrate Roles to Firebase Custom Claims
 * 
 * This script migrates all user roles from Firestore documents to Firebase Auth custom claims.
 * After migration, Firestore rules should read from custom claims instead of Firestore documents.
 * 
 * USAGE:
 * 1. Generate a service account key:
 *    - Firebase Console → Project Settings → Service Accounts
 *    - Click "Generate New Private Key"
 *    - Save as service-account.json (NEVER commit to git)
 * 2. Install dependencies: npm install firebase-admin
 * 3. Run this script: node scripts/migrate-to-custom-claims.js
 * 4. Verify migration in Firebase Console → Authentication → Users
 * 5. Update Firestore rules to read from custom claims
 * 6. Deploy updated rules
 * 7. Delete service-account.json (CRITICAL!)
 * 
 * SECURITY NOTES:
 * - Service account key provides full administrative access
 * - Never commit to version control
 * - Delete after migration
 * - Store securely if needed for future migrations
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Check for service account key
const serviceAccountPath = path.join(__dirname, '../service-account.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ ERROR: service-account.json not found');
  console.error('');
  console.error('To generate a service account key:');
  console.error('1. Go to Firebase Console → Project Settings → Service Accounts');
  console.error('2. Click "Generate New Private Key"');
  console.error('3. Save the key as service-account.json in the project root');
  console.error('4. Re-run this script');
  process.exit(1);
}

// Initialize Firebase Admin SDK
const serviceAccount = require(serviceAccountPath);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function migrateRolesToCustomClaims() {
  console.log('🔐 Starting migration to Firebase Custom Claims...\n');

  try {
    // Fetch all users from Firestore
    console.log('📋 Fetching users from Firestore...');
    const usersSnapshot = await db.collection('users').get();
    
    if (usersSnapshot.empty) {
      console.log('⚠️  No users found in Firestore. Nothing to migrate.');
      return;
    }

    const totalUsers = usersSnapshot.size;
    let migrated = 0;
    let failed = 0;
    const failedUsers = [];

    console.log(`👥 Found ${totalUsers} user(s)\n`);

    // Migrate each user
    for (const doc of usersSnapshot.docs) {
      const userId = doc.id;
      const userData = doc.data();
      const role = userData.role || 'user';
      const username = userData.username || 'Unknown';

      try {
        // Set custom claim
        await admin.auth().setCustomUserClaims(userId, { role });
        
        // Update Firestore document to mark as migrated
        await db.collection('users').doc(userId).update({
          roleSource: 'custom_claim',
          migratedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`✅ ${username} (${userId}): ${role} → custom claim`);
        migrated++;
      } catch (error) {
        console.error(`❌ ${username} (${userId}): FAILED - ${error.message}`);
        failed++;
        failedUsers.push({ userId, username, error: error.message });
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total users:     ${totalUsers}`);
    console.log(`Migrated:       ${migrated}`);
    console.log(`Failed:         ${failed}`);
    console.log('='.repeat(60));

    if (failed > 0) {
      console.log('\n⚠️  Failed users:');
      failedUsers.forEach(({ userId, username, error }) => {
        console.log(`   - ${username} (${userId}): ${error}`);
      });
    }

    if (migrated === totalUsers) {
      console.log('\n✅ SUCCESS: All users migrated to custom claims');
      console.log('');
      console.log('NEXT STEPS:');
      console.log('1. Update firestore.rules to read from custom claims');
      console.log('2. Deploy updated rules: firebase deploy --only firestore:rules');
      console.log('3. Test the application');
      console.log('4. Delete service-account.json (CRITICAL!)');
    } else if (migrated > 0) {
      console.log('\n⚠️  PARTIAL SUCCESS: Some users migrated, some failed');
      console.log('Review failed users and retry if needed');
    } else {
      console.log('\n❌ FAILURE: Migration failed for all users');
      console.log('Review errors and service account configuration');
    }

  } catch (error) {
    console.error('\n❌ CRITICAL ERROR during migration:', error);
    process.exit(1);
  }
}

// Run migration
migrateRolesToCustomClaims()
  .then(() => {
    console.log('\n✅ Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
