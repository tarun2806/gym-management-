// Backend type definitions (for documentation - pure JS runtime)

// UserRequest: { uid, email, role, orgId?, branchId? }
// PaymentRequest: { amount, currency, receipt_email?, notes?, member_id?, branch_id? }
// PaymentVerificationRequest: { razorpay_order_id, razorpay_payment_id, razorpay_signature, member_id?, branch_id? }
// CreateOrganizationRequest: { name, slug, owner_id, subscription_tier, max_branches, max_members }
// CreateBranchRequest: { org_id, name, address, manager_id?, capacity? }
// FileUploadRequest: { type, entity_id, org_id, branch_id? }
// AuditLog: { level, message, user_name, user_id, action, org_id?, branch_id?, target_type?, target_id?, metadata?, created_at }
// SubscriptionRecord: { org_id, plan, status, current_period_start, current_period_end, max_branches, max_members, features, created_at }
