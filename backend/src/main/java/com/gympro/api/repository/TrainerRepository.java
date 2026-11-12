package com.gympro.api.repository;

import com.gympro.api.model.Trainer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TrainerRepository extends JpaRepository<Trainer, String> {
    List<Trainer> findByOrganizationId(String organizationId);
    List<Trainer> findByOrganizationIdAndBranchId(String organizationId, String branchId);
}
