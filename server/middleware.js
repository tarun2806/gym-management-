import { auth, db } from './firebase.js';

export async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }
  
  try {
    const token = authHeader.split(' ')[1];
    const decoded = await auth.verifyIdToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
}

export async function verifyOrganization(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  
  const orgId = req.headers['x-org-id'];
  if (!orgId) {
    return res.status(400).json({ error: 'Missing organization ID' });
  }
  
  try {
    const membershipDoc = await db.collection('organization_memberships')
      .where('user_id', '==', req.user.uid)
      .where('org_id', '==', orgId)
      .where('status', '==', 'active')
      .limit(1)
      .get();
    
    if (membershipDoc.empty) {
      return res.status(403).json({ error: 'Not a member of this organization' });
    }
    
    req.orgId = orgId;
    req.role = membershipDoc.docs[0].data().role;
    next();
  } catch (error) {
    return res.status(500).json({ error: 'Organization verification failed' });
  }
}
