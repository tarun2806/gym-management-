CREATE TABLE owner_activation_keys (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    key_hash VARCHAR(64) NOT NULL,
    label VARCHAR(100) NULL,
    created_by VARCHAR(36) NOT NULL,
    expires_at DATETIME(3) NOT NULL,
    redeemed_by VARCHAR(36) NULL,
    redeemed_at DATETIME(3) NULL,
    revoked_at DATETIME(3) NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE KEY uq_owner_key_hash (key_hash)
);

ALTER TABLE users ADD COLUMN platform_admin TINYINT(1) NOT NULL DEFAULT 0;
