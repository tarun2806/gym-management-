package com.gympro.api.repository;

import com.gympro.api.model.DietPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DietPlanRepository extends JpaRepository<DietPlan, String> {
    List<DietPlan> findByOrganizationId(String organizationId);
}
