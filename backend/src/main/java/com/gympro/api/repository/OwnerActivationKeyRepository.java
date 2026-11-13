package com.gympro.api.repository;

import com.gympro.api.model.OwnerActivationKey;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface OwnerActivationKeyRepository extends JpaRepository<OwnerActivationKey, String> {
    Optional<OwnerActivationKey> findByKeyHash(String keyHash);
    List<OwnerActivationKey> findAllByOrderByCreatedAtDesc();

    /** Atomic single-use redemption — succeeds only if still unredeemed/unrevoked/unexpired. */
    @Modifying
    @Query("UPDATE OwnerActivationKey k SET k.redeemedBy = :uid, k.redeemedAt = :now " +
           "WHERE k.id = :id AND k.redeemedAt IS NULL AND k.revokedAt IS NULL AND k.expiresAt > :now")
    int redeem(@Param("id") String id, @Param("uid") String uid, @Param("now") Instant now);
}
