package com.gympro.api.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "member_invitations")
public class MemberInvitation {
    @Id private String id;
    @Column(name = "token_hash", nullable = false, unique = true, length = 64) private String tokenHash;
    @Column(name = "organization_id", nullable = false) private String organizationId;
    @Column(name = "branch_id") private String branchId;
    @Column(name = "member_id", nullable = false) private String memberId;
    @Column(name = "invited_by", nullable = false) private String invitedBy;
    @Column(name = "expires_at", nullable = false) private Instant expiresAt;
    @Column(name = "redeemed_by") private String redeemedBy;
    @Column(name = "redeemed_at") private Instant redeemedAt;
    @Column(name = "revoked_at") private Instant revokedAt;
    @Column(name = "created_at", nullable = false) private Instant createdAt = Instant.now();

    public String getId() { return id; } public void setId(String v) { id = v; }
    public String getTokenHash() { return tokenHash; } public void setTokenHash(String v) { tokenHash = v; }
    public String getOrganizationId() { return organizationId; } public void setOrganizationId(String v) { organizationId = v; }
    public String getBranchId() { return branchId; } public void setBranchId(String v) { branchId = v; }
    public String getMemberId() { return memberId; } public void setMemberId(String v) { memberId = v; }
    public String getInvitedBy() { return invitedBy; } public void setInvitedBy(String v) { invitedBy = v; }
    public Instant getExpiresAt() { return expiresAt; } public void setExpiresAt(Instant v) { expiresAt = v; }
    public String getRedeemedBy() { return redeemedBy; } public void setRedeemedBy(String v) { redeemedBy = v; }
    public Instant getRedeemedAt() { return redeemedAt; } public void setRedeemedAt(Instant v) { redeemedAt = v; }
    public Instant getRevokedAt() { return revokedAt; } public void setRevokedAt(Instant v) { revokedAt = v; }
    public Instant getCreatedAt() { return createdAt; } public void setCreatedAt(Instant v) { createdAt = v; }
}
