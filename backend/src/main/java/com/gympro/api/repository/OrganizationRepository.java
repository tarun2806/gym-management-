package com.gympro.api.repository;

import com.gympro.api.model.Organization;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrganizationRepository extends JpaRepository<Organization, String> {
    List<Organization> findByOwnerId(String ownerId);

    Optional<Organization> findBySlug(String slug);
}
