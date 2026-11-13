-- V7: SaaS subscription management (vendor control panel)
CREATE TABLE IF NOT EXISTS subscription_plans (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  description TEXT,
  annual_price DECIMAL(12,2) NOT NULL,
  currency VARCHAR(8) NOT NULL DEFAULT 'INR',
  billing_interval VARCHAR(20) NOT NULL DEFAULT 'YEARLY',
  duration_days INT NOT NULL DEFAULT 365,
  trial_eligible TINYINT(1) NOT NULL DEFAULT 1,
  features TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at DATETIME(6) NOT NULL,
  updated_at DATETIME(6) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS organization_subscriptions (
  id VARCHAR(36) PRIMARY KEY,
  organization_id VARCHAR(36) NOT NULL,
  plan_id VARCHAR(36) NULL,
  plan_snapshot VARCHAR(500) NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'TRIALING',
  trial_start DATETIME(6) NULL,
  trial_end DATETIME(6) NULL,
  subscription_start DATETIME(6) NULL,
  subscription_end DATETIME(6) NULL,
  next_renewal_date DATETIME(6) NULL,
  cancelled_at DATETIME(6) NULL,
  cancel_reason VARCHAR(255) NULL,
  created_at DATETIME(6) NOT NULL,
  updated_at DATETIME(6) NOT NULL,
  UNIQUE KEY uq_org_subscription (organization_id),
  KEY idx_sub_status (status),
  KEY idx_sub_end (subscription_end),
  CONSTRAINT fk_sub_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
  CONSTRAINT fk_sub_plan FOREIGN KEY (plan_id) REFERENCES subscription_plans(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS subscription_payments (
  id VARCHAR(36) PRIMARY KEY,
  organization_id VARCHAR(36) NOT NULL,
  subscription_id VARCHAR(36) NULL,
  plan_id VARCHAR(36) NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(8) NOT NULL DEFAULT 'INR',
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  razorpay_order_id VARCHAR(120) NULL,
  razorpay_payment_id VARCHAR(120) NULL,
  purpose VARCHAR(30) NOT NULL DEFAULT 'subscription',
  period_start DATETIME(6) NULL,
  period_end DATETIME(6) NULL,
  created_at DATETIME(6) NOT NULL,
  UNIQUE KEY uq_rzp_payment (razorpay_payment_id),
  UNIQUE KEY uq_rzp_order (razorpay_order_id),
  KEY idx_subpay_org (organization_id),
  CONSTRAINT fk_subpay_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
  CONSTRAINT fk_subpay_sub FOREIGN KEY (subscription_id) REFERENCES organization_subscriptions(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS subscription_events (
  id VARCHAR(36) PRIMARY KEY,
  organization_id VARCHAR(36) NOT NULL,
  subscription_id VARCHAR(36) NULL,
  event_type VARCHAR(40) NOT NULL,
  actor_id VARCHAR(36) NULL,
  detail VARCHAR(500) NULL,
  created_at DATETIME(6) NOT NULL,
  KEY idx_subev_org (organization_id),
  KEY idx_subev_type (event_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
