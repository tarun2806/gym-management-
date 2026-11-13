ALTER TABLE members ADD COLUMN user_id VARCHAR(36) NULL;
CREATE UNIQUE INDEX uq_members_user ON members(user_id);

CREATE TABLE member_invitations (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    token_hash VARCHAR(64) NOT NULL,
    organization_id VARCHAR(36) NOT NULL,
    branch_id VARCHAR(36) NULL,
    member_id VARCHAR(36) NOT NULL,
    invited_by VARCHAR(36) NOT NULL,
    expires_at DATETIME(3) NOT NULL,
    redeemed_by VARCHAR(36) NULL,
    redeemed_at DATETIME(3) NULL,
    revoked_at DATETIME(3) NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE KEY uq_invite_hash (token_hash)
);
