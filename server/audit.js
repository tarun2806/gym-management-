import { db } from './firebase.js';

export async function logAudit(audit) {
  try {
    await db.collection('system_logs').add({
      ...audit,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Audit] Failed to log:', error);
  }
}

export async function verifyBranchPermission(userId, orgId, branchId, requiredRole) {
  try {
    const membership = await db.collection('organization_memberships')
      .where('user_id', '==', userId)
      .where('org_id', '==', orgId)
      .where('branch_id', '==', branchId)
      .where('status', '==', 'active')
      .get();
    
    if (membership.empty) return false;
    
    const role = membership.docs[0].data().role;
    const roleHierarchy = ['member', 'trainer', 'staff', 'branch_manager', 'org_admin', 'org_owner'];
    return roleHierarchy.indexOf(role) >= roleHierarchy.indexOf(requiredRole);
  } catch (error) {
    console.error('[Permission] Verification failed:', error);
    return false;
  }
}
