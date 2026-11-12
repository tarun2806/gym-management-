package com.gympro.api.repository;

import com.gympro.api.model.PayrollEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface PayrollEntryRepository extends JpaRepository<PayrollEntry, String> {
    List<PayrollEntry> findByOrganizationId(String organizationId);

    Optional<PayrollEntry> findByEmployeeIdAndPeriodStartAndPeriodEnd(
            String employeeId, java.time.LocalDate periodStart, java.time.LocalDate periodEnd);
}
