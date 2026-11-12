package com.gympro.api.repository;

import com.gympro.api.model.PtPackage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PtPackageRepository extends JpaRepository<PtPackage, String> {
    List<PtPackage> findByOrganizationId(String organizationId);
    List<PtPackage> findByOrganizationIdAndBranchId(String organizationId, String branchId);
}
