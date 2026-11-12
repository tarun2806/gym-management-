package com.gympro.api.repository;

import com.gympro.api.model.PtSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface PtSessionRepository extends JpaRepository<PtSession, String> {
    List<PtSession> findByOrganizationIdAndScheduledDate(String organizationId, LocalDate date);
    List<PtSession> findByOrganizationId(String organizationId);
}
