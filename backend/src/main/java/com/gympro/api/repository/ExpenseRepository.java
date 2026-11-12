package com.gympro.api.repository;

import com.gympro.api.model.Expense;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, String> {
    List<Expense> findByOrganizationId(String organizationId);
    List<Expense> findByOrganizationIdAndBranchId(String organizationId, String branchId);
    Page<Expense> findByOrganizationIdOrderByDateDesc(String organizationId, Pageable pageable);
    Page<Expense> findByOrganizationIdAndBranchIdOrderByDateDesc(String organizationId, String branchId, Pageable pageable);
}
