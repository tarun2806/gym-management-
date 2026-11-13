package com.gympro.api;

import com.gympro.api.model.Branch;
import com.gympro.api.model.Member;
import com.gympro.api.model.Organization;
import com.gympro.api.model.User;
import com.gympro.api.repository.BranchRepository;
import com.gympro.api.repository.MemberRepository;
import com.gympro.api.repository.OrganizationRepository;
import com.gympro.api.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Repository integration test against a dedicated `gympro_it` schema on the
 * local MySQL instance. The development `gympro` schema is never touched —
 * createDatabaseIfNotExist gives Flyway a clean, disposable database.
 */
@SpringBootTest
@Transactional
class RepositoryIsolationTest {

    @DynamicPropertySource
    static void itDatasource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url",
                () -> "jdbc:mysql://localhost:3307/gympro_it?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true");
        registry.add("spring.datasource.username", () -> "gympro");
        registry.add("spring.datasource.password", () -> "gympro");
    }

    @Autowired MemberRepository memberRepository;
    @Autowired OrganizationRepository organizationRepository;
    @Autowired BranchRepository branchRepository;
    @Autowired UserRepository userRepository;

    private void seedOrg(String orgId) {
        String ownerId = "owner-" + orgId;
        User u = new User();
        u.setId(ownerId);
        u.setEmail(ownerId + "@test.local");
        u.setStatus("active");
        u.setCreatedAt(Instant.now());
        userRepository.save(u);
        Organization o = new Organization();
        o.setId(orgId);
        o.setName("Org " + orgId);
        o.setSlug(orgId);
        o.setOwnerId(ownerId);
        o.setStatus("active");
        o.setCreatedAt(Instant.now());
        organizationRepository.save(o);
        for (String b : List.of("branchA", "branchB", "b1", "b2")) {
            Branch br = new Branch();
            br.setId(orgId + "-" + b);
            br.setOrganizationId(orgId);
            br.setName(b);
            br.setStatus("active");
            br.setCreatedAt(Instant.now());
            branchRepository.save(br);
        }
    }

    private Member member(String org, String branch) {
        Member m = new Member();
        m.setId(UUID.randomUUID().toString());
        m.setOrganizationId(org);
        m.setBranchId(branch);
        m.setName("T");
        m.setStatus("Active");
        m.setCreatedAt(Instant.now());
        return memberRepository.save(m);
    }

    @Test
    void flywayMigratedSchemaSupportsBranchFiltering() {
        seedOrg("orgA"); seedOrg("orgB");
        member("orgA", "orgA-branchA");
        member("orgA", "orgA-branchB");
        member("orgB", "orgB-branchA");

        List<Member> a = memberRepository.findByOrganizationIdAndBranchIdOrderByCreatedAtDesc("orgA", "orgA-branchA");
        assertEquals(1, a.size());
        assertEquals("orgA", a.get(0).getOrganizationId());
        assertEquals("orgA-branchA", a.get(0).getBranchId());

        assertEquals(2, memberRepository.findByOrganizationIdOrderByCreatedAtDesc("orgA").size());
        assertEquals(1, memberRepository.findByOrganizationIdOrderByCreatedAtDesc("orgB").size());
    }

    @Test
    void orgWideSeesBothBranchesBranchScopedDoesNot() {
        seedOrg("orgC");
        member("orgC", "orgC-b1");
        member("orgC", "orgC-b2");
        assertEquals(2, memberRepository.findByOrganizationIdOrderByCreatedAtDesc("orgC").size());
        assertEquals(1, memberRepository.findByOrganizationIdAndBranchIdOrderByCreatedAtDesc("orgC", "orgC-b1").size());
        assertEquals(1, memberRepository.findByOrganizationIdAndBranchIdOrderByCreatedAtDesc("orgC", "orgC-b2").size());
    }
}
