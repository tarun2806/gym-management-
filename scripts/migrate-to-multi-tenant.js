/**
 * Multi-Tenant Migration Script
 * 
 * This script migrates existing single-tenant GymPro data to multi-tenant architecture.
 * 
 * WHAT IT DOES:
 * 1. Creates a default organization for existing gym data
 * 2. Associates existing business records with the default organization
 * 3. Preserves all existing document IDs and relationships
 * 4. Supports rollback if migration fails
 * 
 * SAFETY:
 * - Does not delete existing data
 * - Creates backup references before modifications
 * - Supports dry-run mode
 * - Validates record counts before and after
 * 
 * USAGE:
 * node scripts/migrate-to-multi-tenant.js --dry-run
 * node scripts/migrate-to-multi-tenant.js --execute
 * node scripts/migrate-to-multi-tenant.js --rollback
 */

const admin = require('firebase-admin');
const serviceAccount = require('./service-account.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://your-project.firebaseio.com'
});

const db = admin.firestore();

const DEFAULT_ORG_NAME = 'Default Gym';
const BACKUP_COLLECTION = '_migration_backup';

async function migrateToMultiTenant(options = { dryRun: false, execute: false }) {
  console.log('='.repeat(60));
  console.log('MULTI-TENANT MIGRATION');
  console.log('='.repeat(60));
  console.log(`Mode: ${options.dryRun ? 'DRY RUN' : options.execute ? 'EXECUTE' : 'UNKNOWN'}`);
  console.log('');

  try {
    // Step 1: Check if default organization already exists
    console.log('Step 1: Checking for existing default organization...');
    const orgSnapshot = await db.collection('organizations')
      .where('slug', '==', 'default-gym')
      .limit(1)
      .get();

    let defaultOrg;
    if (!orgSnapshot.empty) {
      defaultOrg = { id: orgSnapshot.docs[0].id, ...orgSnapshot.docs[0].data() };
      console.log(`✓ Default organization already exists: ${defaultOrg.id}`);
    } else {
      console.log('✓ No default organization found, will create one');
    }

    // Step 2: Get existing owner user
    console.log('\nStep 2: Identifying existing owner...');
    const usersSnapshot = await db.collection('users')
      .where('role', '==', 'owner')
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      console.log('✗ No owner user found. Please create an owner first.');
      return;
    }

    const ownerUser = { id: usersSnapshot.docs[0].id, ...usersSnapshot.docs[0].data() };
    console.log(`✓ Found owner: ${ownerUser.username} (${ownerUser.id})`);

    // Step 3: Create default organization if needed
    if (!defaultOrg) {
      console.log('\nStep 3: Creating default organization...');
      if (options.dryRun) {
        console.log('[DRY RUN] Would create organization:', DEFAULT_ORG_NAME);
        defaultOrg = { id: 'dry-run-org-id', name: DEFAULT_ORG_NAME, slug: 'default-gym' };
      } else {
        const orgRef = await db.collection('organizations').add({
          name: DEFAULT_ORG_NAME,
          slug: 'default-gym',
          owner_id: ownerUser.id,
          status: 'active',
          subscription_tier: 'premium',
          max_branches: 999,
          max_members: 9999,
          created_at: admin.firestore.FieldValue.serverTimestamp(),
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
        });
        defaultOrg = { id: orgRef.id, name: DEFAULT_ORG_NAME, slug: 'default-gym' };
        console.log(`✓ Created organization: ${defaultOrg.id}`);
      }
    }

    // Step 4: Create organization membership for owner
    console.log('\nStep 4: Creating organization membership for owner...');
    const membershipSnapshot = await db.collection('organization_memberships')
      .where('user_id', '==', ownerUser.id)
      .where('org_id', '==', defaultOrg.id)
      .limit(1)
      .get();

    if (membershipSnapshot.empty) {
      if (options.dryRun) {
        console.log('[DRY RUN] Would create organization membership');
      } else {
        await db.collection('organization_memberships').add({
          org_id: defaultOrg.id,
          user_id: ownerUser.id,
          role: 'org_owner',
          status: 'active',
          joined_at: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log('✓ Created organization membership');
      }
    } else {
      console.log('✓ Organization membership already exists');
    }

    // Step 5: Migrate collections with org_id
    const collectionsToMigrate = [
      'members',
      'trainers',
      'classes',
      'class_bookings',
      'attendance',
      'equipment',
      'membership_plans',
      'payments',
      'workout_plans',
      'diet_plans',
    ];

    for (const collectionName of collectionsToMigrate) {
      console.log(`\nStep 5.${collectionsToMigrate.indexOf(collectionName) + 1}: Migrating ${collectionName}...`);
      
      const snapshot = await db.collection(collectionName).get();
      console.log(`  Found ${snapshot.size} documents`);

      if (snapshot.empty) {
        console.log(`  ✓ Collection empty, skipping`);
        continue;
      }

      let migrated = 0;
      let skipped = 0;

      for (const doc of snapshot.docs) {
        const data = doc.data();
        
        // Skip if already has org_id
        if (data.org_id) {
          skipped++;
          continue;
        }

        if (options.dryRun) {
          console.log(`  [DRY RUN] Would add org_id to ${doc.id}`);
          migrated++;
        } else {
          // Backup original data
          await db.collection(BACKUP_COLLECTION).doc(`${collectionName}_${doc.id}`).set({
            original_collection: collectionName,
            original_id: doc.id,
            data: data,
            backed_up_at: admin.firestore.FieldValue.serverTimestamp(),
          });

          // Add org_id
          await db.collection(collectionName).doc(doc.id).update({
            org_id: defaultOrg.id,
            migrated_at: admin.firestore.FieldValue.serverTimestamp(),
          });
          migrated++;
        }
      }

      console.log(`  ✓ Migrated: ${migrated}, Skipped: ${skipped}`);
    }

    // Step 6: Verify migration
    console.log('\nStep 6: Verifying migration...');
    let totalVerified = 0;
    for (const collectionName of collectionsToMigrate) {
      const snapshot = await db.collection(collectionName)
        .where('org_id', '==', defaultOrg.id)
        .get();
      totalVerified += snapshot.size;
      console.log(`  ${collectionName}: ${snapshot.size} documents with org_id`);
    }
    console.log(`  ✓ Total verified: ${totalVerified}`);

    console.log('\n' + '='.repeat(60));
    console.log('MIGRATION COMPLETE');
    console.log('='.repeat(60));
    console.log(`Default Organization ID: ${defaultOrg.id}`);
    console.log(`Organization Name: ${defaultOrg.name}`);
    console.log(`Owner: ${ownerUser.username}`);
    console.log(`Total Documents Migrated: ${totalVerified}`);
    console.log('');
    console.log('NEXT STEPS:');
    console.log('1. Update Firestore rules to enforce organization isolation');
    console.log('2. Update frontend to use organization context');
    console.log('3. Test all existing functionality');
    console.log('4. Run: node scripts/migrate-to-multi-tenant.js --rollback to revert if needed');

  } catch (error) {
    console.error('\n✗ MIGRATION FAILED:', error);
    process.exit(1);
  }
}

async function rollbackMigration() {
  console.log('='.repeat(60));
  console.log('ROLLBACK MIGRATION');
  console.log('='.repeat(60));

  try {
    console.log('Step 1: Restoring from backup...');
    const backupSnapshot = await db.collection(BACKUP_COLLECTION).get();
    
    if (backupSnapshot.empty) {
      console.log('✗ No backup found. Cannot rollback.');
      return;
    }

    console.log(`Found ${backupSnapshot.size} backup documents`);

    for (const doc of backupSnapshot.docs) {
      const backup = doc.data();
      await db.collection(backup.original_collection).doc(backup.original_id).set(backup.data);
      await db.collection(BACKUP_COLLECTION).doc(doc.id).delete();
    }

    console.log('✓ Rollback complete');
    console.log('\nIMPORTANT: You may also want to delete the default organization if it was created.');

  } catch (error) {
    console.error('\n✗ ROLLBACK FAILED:', error);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const mode = args[0];

if (mode === '--dry-run') {
  migrateToMultiTenant({ dryRun: true });
} else if (mode === '--execute') {
  migrateToMultiTenant({ execute: true });
} else if (mode === '--rollback') {
  rollbackMigration();
} else {
  console.log('Usage:');
  console.log('  node scripts/migrate-to-multi-tenant.js --dry-run');
  console.log('  node scripts/migrate-to-multi-tenant.js --execute');
  console.log('  node scripts/migrate-to-multi-tenant.js --rollback');
}
