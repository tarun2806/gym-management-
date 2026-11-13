package com.gympro.api;

import com.gympro.api.auth.OrgContextService;
import com.gympro.api.model.OrganizationMembership;
import com.gympro.api.repository.BranchRepository;
import com.gympro.api.repository.OrganizationMembershipRepository;
import com.gympro.api.security.AppUserPrincipal;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class OrgContextServiceTest {

    private OrgContextService svc;
    private BranchRepository branchRepo;

    private void login(String orgId, String branchId, String role) {
        var view = new AppUserPrincipal.OrgMembershipView(orgId, branchId, role, "active");
        var p = new AppUserPrincipal("uid1", "a@b.c", List.of(view));
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(p, null, List.of()));
    }

    @BeforeEach
    void setUp() {
        branchRepo = mock(BranchRepository.class);
        svc = new OrgContextService(mock(OrganizationMembershipRepository.class), branchRepo, mock(com.gympro.api.repository.OrganizationRepository.class), mock(com.gympro.api.repository.OrganizationSubscriptionRepository.class), mock(com.gympro.api.subscription.SubscriptionService.class));
    }

    @AfterEach
    void tearDown() { SecurityContextHolder.clearContext(); }

    private OrganizationMembership membershipOf(String orgId) {
        return svc.requireMembership(orgId);
    }

    @Test
    void orgWideMemberSeesAllBranches() {
        login("org1", null, "org_admin");
        var m = membershipOf("org1");
        assertNull(m.getBranchId());
        assertNull(svc.readBranchScope(m));
        assertTrue(svc.canSeeBranch(m, "branchA"));
        assertTrue(svc.canSeeBranch(m, "branchB"));
        assertTrue(svc.canSeeBranch(m, null));
    }

    @Test
    void branchScopedMemberSeesOnlyOwnBranch() {
        login("org1", "branchA", "staff");
        var m = membershipOf("org1");
        assertEquals("branchA", svc.readBranchScope(m));
        assertTrue(svc.canSeeBranch(m, "branchA"));
        assertFalse(svc.canSeeBranch(m, "branchB"));
        assertFalse(svc.canSeeBranch(m, null));
    }

    @Test
    void crossOrgAccessDenied() {
        login("org1", null, "org_owner");
        var ex = assertThrows(ResponseStatusException.class, () -> membershipOf("org2"));
        assertEquals(403, ex.getStatusCode().value());
    }

    @Test
    void inactiveMembershipDenied() {
        var view = new AppUserPrincipal.OrgMembershipView("org1", null, "staff", "suspended");
        var p = new AppUserPrincipal("u", "e", List.of(view));
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(p, null, List.of()));
        var ex = assertThrows(ResponseStatusException.class, () -> membershipOf("org1"));
        assertEquals(403, ex.getStatusCode().value());
    }

    @Test
    void unauthenticatedDenied() {
        SecurityContextHolder.clearContext();
        var ex = assertThrows(ResponseStatusException.class, () -> membershipOf("org1"));
        assertEquals(401, ex.getStatusCode().value());
    }

    @Test
    void roleEnforcement() {
        login("org1", null, "staff");
        var ex = assertThrows(ResponseStatusException.class,
                () -> svc.requireRole("org1", "org_owner", "org_admin"));
        assertEquals(403, ex.getStatusCode().value());
        assertDoesNotThrow(() -> svc.requireRole("org1", "staff"));
    }

    @Test
    void branchScopedWriteCannotTargetOtherBranch() {
        login("org1", "branchA", "staff");
        var m = membershipOf("org1");
        var ex = assertThrows(ResponseStatusException.class,
                () -> svc.resolveBranchId("org1", m, "branchB"));
        assertEquals(403, ex.getStatusCode().value());
        assertEquals("branchA", svc.resolveBranchId("org1", m, null));
        assertEquals("branchA", svc.resolveBranchId("org1", m, "branchA"));
    }

    @Test
    void orgWideWriteValidatesBranchBelongsToOrg() {
        login("org1", null, "org_admin");
        var m = membershipOf("org1");
        var branch = new com.gympro.api.model.Branch();
        branch.setId("branchA");
        when(branchRepo.findByOrganizationId("org1")).thenReturn(List.of(branch));
        assertEquals("branchA", svc.resolveBranchId("org1", m, "branchA"));
        var ex = assertThrows(ResponseStatusException.class,
                () -> svc.resolveBranchId("org1", m, "branchFromOrg2"));
        assertEquals(400, ex.getStatusCode().value());
        verify(branchRepo, times(2)).findByOrganizationId("org1");
    }
}
