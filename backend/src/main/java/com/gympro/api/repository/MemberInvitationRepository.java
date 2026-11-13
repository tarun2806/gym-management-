package com.gympro.api.repository;

import com.gympro.api.model.MemberInvitation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface MemberInvitationRepository extends JpaRepository<MemberInvitation, String> {
    Optional<MemberInvitation> findByTokenHash(String tokenHash);
    List<MemberInvitation> findByOrganizationIdOrderByCreatedAtDesc(String orgId);

    @Modifying
    @Query("UPDATE MemberInvitation i SET i.redeemedBy = :uid, i.redeemedAt = :now " +
           "WHERE i.id = :id AND i.redeemedAt IS NULL AND i.revokedAt IS NULL AND i.expiresAt > :now")
    int redeem(@Param("id") String id, @Param("uid") String uid, @Param("now") Instant now);
}
