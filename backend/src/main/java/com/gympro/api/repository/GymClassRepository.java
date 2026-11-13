package com.gympro.api.repository;

import com.gympro.api.model.GymClass;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GymClassRepository extends JpaRepository<GymClass, String> {
    List<GymClass> findByOrganizationId(String organizationId);
    List<GymClass> findByOrganizationIdAndBranchId(String organizationId, String branchId);

    /** Pessimistic write lock — serializes bookings/cancellations per class. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from GymClass c where c.id = :id")
    Optional<GymClass> findByIdForUpdate(@Param("id") String id);

    /**
     * Atomic seat claim: increments enrolled only while a seat remains.
     * Returns 1 on success, 0 when the class is full — safe under
     * concurrent bookings (no check-then-act race).
     */
    @org.springframework.data.jpa.repository.Modifying
    @Query("update GymClass c set c.enrolled = c.enrolled + 1 where c.id = :id and c.enrolled < c.capacity")
    int claimSeat(@Param("id") String id);
}
