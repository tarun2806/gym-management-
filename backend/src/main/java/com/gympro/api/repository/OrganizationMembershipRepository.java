package com.gympro.api.repository;

import com.gympro.api.model.OrganizationMembership;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrganizationMembershipRepository extends JpaRepository<OrganizationMembership, String> {

    List<OrganizationMembership> findByUserId(String userId);

    List<OrganizationMembership> findByUserIdAndStatus(String userId, String status);

    List<OrganizationMembership> findByOrganizationId(String organizationId);
    List<OrganizationMembership> findByOrganizationIdAndBranchId(String organizationId, String branchId);
}
