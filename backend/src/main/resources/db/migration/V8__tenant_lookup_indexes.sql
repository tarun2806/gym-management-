-- Tenant-scoped lookup indexes for tables queried by organization_id
-- without a covering index (invoices, member_invitations). Additive only.

CREATE INDEX idx_invoices_org ON invoices (organization_id);
CREATE INDEX idx_invoices_org_branch ON invoices (organization_id, branch_id);
CREATE INDEX idx_invites_org_created ON member_invitations (organization_id, created_at);
CREATE INDEX idx_invites_member ON member_invitations (member_id);
