package com.gympro.api;

import com.gympro.api.admin.AdminController;
import com.gympro.api.auth.OrgContextService;
import com.gympro.api.model.OrganizationMembership;
import com.gympro.api.repository.*;
import com.gympro.api.security.AppUserPrincipal;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AdminRoleEscalationTest {

    private OrganizationMembershipRepository membershipRepo;
    private SystemLogRepository logRepo;
    private AdminController controller;

    private void login(String orgId, String role) {
        var view = new AppUserPrincipal.OrgMembershipView(orgId, null, role, "active");
        var p = new AppUserPrincipal("uid-" + role, "a@b.c", List.of(view));
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(p, null, List.of()));
    }

    @BeforeEach
    void setUp() {
        membershipRepo = mock(OrganizationMembershipRepository.class);
        logRepo = mock(SystemLogRepository.class);
        controller = new AdminController(mock(UserRepository.class), membershipRepo,
                logRepo, new OrgContextService(mock(OrganizationMembershipRepository.class), mock(BranchRepository.class), mock(com.gympro.api.repository.OrganizationRepository.class), mock(com.gympro.api.repository.OrganizationSubscriptionRepository.class), mock(com.gympro.api.subscription.SubscriptionService.class)));
    }

    @AfterEach
    void tearDown() { SecurityContextHolder.clearContext(); }

    private OrganizationMembership target() {
        var m = new OrganizationMembership();
        m.setId("u1:org1");
        m.setOrganizationId("org1");
        m.setUserId("u1");
        m.setRole("staff");
        m.setStatus("active");
        return m;
    }

    @Test
    void orgAdminCannotAssignPlatformAdmin() {
        login("org1", "org_admin");
        when(membershipRepo.findById("u1:org1")).thenReturn(Optional.of(target()));
        assertThrows(ResponseStatusException.class, () -> controller.setRole("org1", "u1:org1",
                Map.of("role", "platform_admin")));
        verify(membershipRepo, never()).save(any());
    }

    @Test
    void orgAdminCannotAssignOrgOwner() {
        login("org1", "org_admin");
        when(membershipRepo.findById("u1:org1")).thenReturn(Optional.of(target()));
        assertThrows(ResponseStatusException.class, () -> controller.setRole("org1", "u1:org1",
                Map.of("role", "org_owner")));
        verify(membershipRepo, never()).save(any());
    }

    @Test
    void unknownRoleRejected() {
        login("org1", "org_owner");
        when(membershipRepo.findById("u1:org1")).thenReturn(Optional.of(target()));
        var ex = assertThrows(ResponseStatusException.class, () -> controller.setRole("org1", "u1:org1",
                Map.of("role", "superuser")));
        assertEquals(400, ex.getStatusCode().value());
        verify(membershipRepo, never()).save(any());
    }

    @Test
    void orgOwnerCanAssignStaffAndAuditLogged() {
        login("org1", "org_owner");
        when(membershipRepo.findById("u1:org1")).thenReturn(Optional.of(target()));
        when(membershipRepo.save(any())).thenAnswer(i -> i.getArgument(0));
        var saved = controller.setRole("org1", "u1:org1", Map.of("role", "trainer"));
        assertEquals("trainer", saved.getRole());
        verify(logRepo).save(argThat(l -> "membership.role_changed".equals(l.getAction())));
    }

    @Test
    void orgAdminCannotAddMemberWithOwnerRole() {
        login("org1", "org_admin");
        when(membershipRepo.findById("u1:org1")).thenReturn(Optional.of(target()));
        assertThrows(ResponseStatusException.class, () -> controller.addMember("org1",
                Map.of("user_id", "u2", "role", "org_owner")));
        verify(membershipRepo, never()).save(any());
    }
}
