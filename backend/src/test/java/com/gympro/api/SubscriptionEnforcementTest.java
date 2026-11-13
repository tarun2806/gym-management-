package com.gympro.api;

import com.gympro.api.auth.OrgContextService;
import com.gympro.api.model.OrganizationSubscription;
import com.gympro.api.repository.OrganizationMembershipRepository;
import com.gympro.api.repository.OrganizationRepository;
import com.gympro.api.repository.OrganizationSubscriptionRepository;
import com.gympro.api.repository.BranchRepository;
import com.gympro.api.security.AppUserPrincipal;
import com.gympro.api.subscription.SubscriptionService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class SubscriptionEnforcementTest {

    private OrgContextService svc;
    private OrganizationSubscriptionRepository subRepo;
    private OrganizationRepository orgRepo;

    @BeforeEach
    void setUp() {
        subRepo = mock(OrganizationSubscriptionRepository.class);
        orgRepo = mock(OrganizationRepository.class);
        var membershipRepo = mock(OrganizationMembershipRepository.class);
        var realSub = new SubscriptionService(subRepo,
                mock(com.gympro.api.repository.SubscriptionPlanRepository.class),
                mock(com.gympro.api.repository.SubscriptionPaymentRepository.class),
                mock(com.gympro.api.repository.SubscriptionEventRepository.class));
        svc = new OrgContextService(membershipRepo, mock(BranchRepository.class),
                orgRepo, subRepo, realSub);
        // membership record embedded in principal claims
        var p = new AppUserPrincipal("u1", "o@x.com", List.of(
                new AppUserPrincipal.OrgMembershipView("org1", null, "org_owner", "active")));
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(p, null, List.of()));
    }

    @AfterEach
    void tearDown() { SecurityContextHolder.clearContext(); }

    @Test
    void expiredSubscriptionBlocksManagementRole() {
        when(orgRepo.findById("org1")).thenReturn(Optional.empty()); // org row absent → skip status check
        var s = new OrganizationSubscription();
        s.setOrganizationId("org1");
        s.setStatus("TRIALING");
        s.setTrialEnd(Instant.now().minus(1, ChronoUnit.DAYS));
        when(subRepo.findByOrganizationId("org1")).thenReturn(Optional.of(s));
        var ex = assertThrows(ResponseStatusException.class,
                () -> svc.requireRole("org1", "org_owner", "org_admin"));
        assertEquals(402, ex.getStatusCode().value());
    }

    @Test
    void activeTrialAllowsManagementRole() {
        when(orgRepo.findById("org1")).thenReturn(Optional.empty());
        var s = new OrganizationSubscription();
        s.setOrganizationId("org1");
        s.setStatus("TRIALING");
        s.setTrialEnd(Instant.now().plus(5, ChronoUnit.DAYS));
        when(subRepo.findByOrganizationId("org1")).thenReturn(Optional.of(s));
        assertDoesNotThrow(() -> svc.requireRole("org1", "org_owner"));
    }

    @Test
    void suspendedOrgBlocksManagementRole() {
        var o = new com.gympro.api.model.Organization();
        o.setId("org1"); o.setStatus("suspended");
        when(orgRepo.findById("org1")).thenReturn(Optional.of(o));
        when(subRepo.findByOrganizationId("org1")).thenReturn(Optional.empty());
        var ex = assertThrows(ResponseStatusException.class,
                () -> svc.requireRole("org1", "org_owner"));
        assertEquals(403, ex.getStatusCode().value());
    }

    @Test
    void memberRoleUnaffectedByExpiredSubscription() {
        // Members never pass through requireRole — requireMembership stays open
        // so the portal keeps working (documented policy).
        var p = new AppUserPrincipal("u2", "m@x.com", List.of(
                new AppUserPrincipal.OrgMembershipView("org1", null, "member", "active")));
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(p, null, List.of()));
        assertDoesNotThrow(() -> svc.requireMembership("org1"));
    }
}
