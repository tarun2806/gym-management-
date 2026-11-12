package com.gympro.api.repository;

import com.gympro.api.model.WorkoutPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface WorkoutPlanRepository extends JpaRepository<WorkoutPlan, String> {
    List<WorkoutPlan> findByOrganizationId(String organizationId);
}
