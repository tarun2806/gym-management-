package com.gympro.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gympro.api.auth.OrgContextService;
import com.gympro.api.model.OwnerActivationKey;
import com.gympro.api.model.OrganizationMembership;
import com.gympro.api.owner.OwnerRegistrationController;
import com.gympro.api.platform.PlatformAdminController;
import com.gympro.api.repository.*;
import com.gympro.api.security.AppUserPrincipal;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;

class OwnerRegistrationTest {

    private OwnerActivationKeyRepository keyRepo;
    private OrganizationRepository orgRepo;
    private OrganizationMembershipRepository memberRepo;
    private BranchRepository branchRepo;
    private SystemLogRepository logRepo;
    private OwnerRegistrationController controller;

    private static final String RAW = "gympro_own_testtoken123";
    private static final String HASH = PlatformAdminController.sha256(RAW);

    @BeforeEach
    void setUp() {
        keyRepo = mock(OwnerActivationKeyRepository.class);
        orgRepo = mock(OrganizationRepository.class);
        memberRepo = mock(OrganizationMembershipRepository.class);
        branchRepo = mock(BranchRepository.class);
        logRepo = mock(SystemLogRepository.class);
        controller = new OwnerRegistrationController(keyRepo, orgRepo, memberRepo,
                branchRepo, logRepo, new OrgContextService(memberRepo, branchRepo),
                new ObjectMapper());
        var p = new AppUserPrincipal("uid-1", "o@x.com", List.of());
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(p, null, List.of()));
        when(orgRepo.findBySlug(anyString())).thenReturn(Optional.empty());
    }

    @AfterEach
    void tearDown() { SecurityContextHolder.clearContext(); }

    private OwnerActivationKey key(boolean expired, boolean revoked, boolean redeemed) {
        var k = new OwnerActivationKey();
        k.setId("k1"); k.setKeyHash(HASH); k.setLabel("test");
        k.setCreatedBy("admin");
        k.setExpiresAt(expired ? Instant.now().minus(1, ChronoUnit.DAYS)
                               : Instant.now().plus(7, ChronoUnit.DAYS));
        if (revoked) k.setRevokedAt(Instant.now());
        if (redeemed) { k.setRedeemedAt(Instant.now()); k.setRedeemedBy("other"); }
        return k;
    }

    private void stubKey(OwnerActivationKey k) { when(keyRepo.findByKeyHash(HASH)).thenReturn(Optional.of(k)); }

    @Test void validKeyPasses() {
        stubKey(key(false, false, false));
        var r = controller.validateKey(Map.of("key", RAW));
        assertEquals(true, r.get("valid"));
    }

    @Test void invalidKeyRejected() {
        when(keyRepo.findByKeyHash(anyString())).thenReturn(Optional.empty());
        assertThrows(ResponseStatusException.class, () -> controller.validateKey(Map.of("key", "bad")));
    }

    @Test void expiredKeyRejected() {
        stubKey(key(true, false, false));
        var ex = assertThrows(ResponseStatusException.class, () -> controller.validateKey(Map.of("key", RAW)));
        assertEquals(410, ex.getStatusCode().value());
    }

    @Test void revokedKeyRejected() {
        stubKey(key(false, true, false));
        assertThrows(ResponseStatusException.class, () -> controller.validateKey(Map.of("key", RAW)));
    }

    @Test void redeemedKeyRejected() {
        stubKey(key(false, false, true));
        assertThrows(ResponseStatusException.class, () -> controller.validateKey(Map.of("key", RAW)));
    }

    @Test void registerCreatesOrgOwnerBranchAndRedeems() {
        stubKey(key(false, false, false));
        when(keyRepo.redeem(eq("k1"), eq("uid-1"), any())).thenReturn(1);
        when(orgRepo.save(any())).thenAnswer(i -> i.getArgument(0));
        when(memberRepo.save(any())).thenAnswer(i -> i.getArgument(0));
        when(branchRepo.save(any())).thenAnswer(i -> i.getArgument(0));
        var r = controller.register(Map.of("key", RAW, "org_name", "Test Gym", "branch_name", "Main"));
        assertEquals("org_owner", r.get("role"));
        verify(memberRepo).save(argThat((OrganizationMembership m) -> "org_owner".equals(m.getRole())));
        verify(branchRepo).save(any());
        verify(logRepo).save(argThat(l -> "owner.registration_completed".equals(l.getAction())));
    }

    @Test void concurrentRedemptionDeniedWhenUpdateAffectsZero() {
        stubKey(key(false, false, false));
        when(keyRepo.redeem(any(), any(), any())).thenReturn(0);
        var ex = assertThrows(ResponseStatusException.class, () -> controller.register(
                Map.of("key", RAW, "org_name", "G", "branch_name", "B")));
        assertEquals(409, ex.getStatusCode().value());
        verify(orgRepo, never()).save(any());
        verify(memberRepo, never()).save(any());
    }

    @Test void missingFieldsRejectedBeforeRedemption() {
        stubKey(key(false, false, false));
        assertThrows(ResponseStatusException.class, () -> controller.register(
                Map.of("key", RAW, "org_name", "G")));
        verify(keyRepo, never()).redeem(any(), any(), any());
    }

    @Test void duplicateSlugRejectedBeforeRedemption() {
        stubKey(key(false, false, false));
        when(orgRepo.findBySlug("test-gym")).thenReturn(Optional.of(new com.gympro.api.model.Organization()));
        assertThrows(ResponseStatusException.class, () -> controller.register(
                Map.of("key", RAW, "org_name", "Test Gym", "branch_name", "B")));
        verify(keyRepo, never()).redeem(any(), any(), any());
    }
}
