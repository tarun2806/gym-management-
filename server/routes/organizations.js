import { verifyToken, verifyOrganization } from '../middleware.js';
import { db } from '../firebase.js';
import { logAudit } from '../audit.js';

export default function organizationRoutes(app) {
  // Create organization
  app.post('/api/organizations', verifyToken, async (req, res) => {
    try {
      const { name, slug, subscription_tier, max_branches, max_members } = req.body;
      
      const orgRef = await db.collection('organizations').add({
        name,
        slug,
        owner_id: req.user.uid,
        subscription_tier,
        max_branches,
        max_members,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      
      // Add owner as organization member
      await db.collection('organization_memberships').add({
        org_id: orgRef.id,
        user_id: req.user.uid,
        role: 'org_owner',
        status: 'active',
        joined_at: new Date().toISOString(),
      });
      
      await logAudit({
        level: 'info',
        message: `Organization created: ${name}`,
        user_name: req.user.email || req.user.uid,
        user_id: req.user.uid,
        action: 'org_create',
        target_type: 'organization',
        target_id: orgRef.id,
      });
      
      res.json({ id: orgRef.id, name, slug });
    } catch (error) {
      res.status(500).json({ error: 'Organization creation failed' });
    }
  });
  
  // Create branch
  app.post('/api/branches', verifyToken, verifyOrganization, async (req, res) => {
    try {
      const { name, address, manager_id, capacity } = req.body;
      
      if (req.role !== 'org_owner' && req.role !== 'org_admin') {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      
      const branchRef = await db.collection('branches').add({
        org_id: req.orgId,
        name,
        address,
        manager_id,
        capacity,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      
      await logAudit({
        level: 'info',
        message: `Branch created: ${name}`,
        user_name: req.user.email || req.user.uid,
        user_id: req.user.uid,
        action: 'branch_create',
        org_id: req.orgId,
        target_type: 'branch',
        target_id: branchRef.id,
      });
      
      res.json({ id: branchRef.id, name });
    } catch (error) {
      res.status(500).json({ error: 'Branch creation failed' });
    }
  });
}
