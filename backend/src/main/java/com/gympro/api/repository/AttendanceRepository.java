package com.gympro.api.repository;

import com.gympro.api.model.Attendance;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, String> {

    @Query("SELECT a FROM Attendance a WHERE a.organizationId = :orgId AND a.checkIn >= :from AND a.checkIn < :to ORDER BY a.checkIn DESC")
    List<Attendance> findInRange(@Param("orgId") String orgId,
                                 @Param("from") LocalDateTime from,
                                 @Param("to") LocalDateTime to);

    Page<Attendance> findByOrganizationIdOrderByCheckInDesc(String organizationId, Pageable pageable);

    Optional<Attendance> findFirstByOrganizationIdAndMemberIdAndCheckOutIsNullOrderByCheckInDesc(
            String organizationId, String memberId);

    Optional<Attendance> findFirstByMemberIdAndCheckOutIsNullOrderByCheckInDesc(String memberId);
}
