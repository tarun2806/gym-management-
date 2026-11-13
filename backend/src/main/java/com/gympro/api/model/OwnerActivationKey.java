package com.gympro.api.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "owner_activation_keys")
public class OwnerActivationKey {
    @Id private String id;
    @Column(name = "key_hash", nullable = false, unique = true, length = 64) private String keyHash;
    private String label;
    @Column(name = "created_by", nullable = false) private String createdBy;
    @Column(name = "expires_at", nullable = false) private Instant expiresAt;
    @Column(name = "redeemed_by") private String redeemedBy;
    @Column(name = "redeemed_at") private Instant redeemedAt;
    @Column(name = "revoked_at") private Instant revokedAt;
    @Column(name = "created_at", nullable = false) private Instant createdAt = Instant.now();

    public String getId() { return id; } public void setId(String v) { id = v; }
    public String getKeyHash() { return keyHash; } public void setKeyHash(String v) { keyHash = v; }
    public String getLabel() { return label; } public void setLabel(String v) { label = v; }
    public String getCreatedBy() { return createdBy; } public void setCreatedBy(String v) { createdBy = v; }
    public Instant getExpiresAt() { return expiresAt; } public void setExpiresAt(Instant v) { expiresAt = v; }
    public String getRedeemedBy() { return redeemedBy; } public void setRedeemedBy(String v) { redeemedBy = v; }
    public Instant getRedeemedAt() { return redeemedAt; } public void setRedeemedAt(Instant v) { redeemedAt = v; }
    public Instant getRevokedAt() { return revokedAt; } public void setRevokedAt(Instant v) { revokedAt = v; }
    public Instant getCreatedAt() { return createdAt; } public void setCreatedAt(Instant v) { createdAt = v; }
}
