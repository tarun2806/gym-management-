package com.gympro.api.repository;

import com.gympro.api.model.Member;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface MemberRepository extends JpaRepository<Member, String> {

    List<Member> findByOrganizationIdOrderByCreatedAtDesc(String organizationId);

    Page<Member> findByOrganizationId(String organizationId, Pageable pageable);

    List<Member> findByOrganizationIdAndStatus(String organizationId, String status);

    long countByOrganizationId(String organizationId);

    List<Member> findByOrganizationIdAndExpiryDateBefore(String organizationId, LocalDate date);

    List<Member> findByOrganizationIdAndExpiryDate(String organizationId, LocalDate date);

    // Cross-org queries for the scheduled expiry job.
    List<Member> findByExpiryDateBeforeAndStatus(LocalDate date, String status);

    List<Member> findByExpiryDateAndStatus(LocalDate date, String status);
}
