package com.gympro.api.repository;

import com.gympro.api.model.GymClass;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface GymClassRepository extends JpaRepository<GymClass, String> {
    List<GymClass> findByOrganizationId(String organizationId);
    List<GymClass> findByOrganizationIdAndBranchId(String organizationId, String branchId);
}
