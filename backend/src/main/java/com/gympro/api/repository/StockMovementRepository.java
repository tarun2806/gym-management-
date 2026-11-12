package com.gympro.api.repository;

import com.gympro.api.model.StockMovement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface StockMovementRepository extends JpaRepository<StockMovement, String> {
    List<StockMovement> findByProductIdOrderByDateDesc(String productId);

    List<StockMovement> findByOrganizationIdOrderByDateDesc(String organizationId);
}
