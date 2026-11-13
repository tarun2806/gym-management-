package com.gympro.api;

import com.gympro.api.auth.OrgContextService;
import com.gympro.api.members.MemberController;
import com.gympro.api.model.Member;
import com.gympro.api.repository.BranchRepository;
import com.gympro.api.repository.MemberRepository;
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

class MemberControllerAuthzTest {

    private MemberRepository memberRepo;
    private MemberController controller;

    private void login(String orgId, String branchId, String role) {
        var view = new AppUserPrincipal.OrgMembershipView(orgId, branchId, role, "active");
        var p = new AppUserPrincipal("uid1", "a@b.c", List.of(view));
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(p, null, List.of()));
    }

    @BeforeEach
    void setUp() {
        memberRepo = mock(MemberRepository.class);
        controller = new MemberController(memberRepo,
                new OrgContextService(mock(OrganizationMembershipRepository.class), mock(BranchRepository.class), mock(com.gympro.api.repository.OrganizationRepository.class), mock(com.gympro.api.repository.OrganizationSubscriptionRepository.class), mock(com.gympro.api.subscription.SubscriptionService.class)));
    }

    @AfterEach
    void tearDown() { SecurityContextHolder.clearContext(); }

    @Test
    void branchScopedListUsesBranchPredicate() {
        login("org1", "branchA", "staff");
        when(memberRepo.findByOrganizationIdAndBranchIdOrderByCreatedAtDesc("org1", "branchA"))
                .thenReturn(List.of());
        controller.list("org1", null, null);
        verify(memberRepo).findByOrganizationIdAndBranchIdOrderByCreatedAtDesc("org1", "branchA");
        verify(memberRepo, never()).findByOrganizationIdOrderByCreatedAtDesc("org1");
    }

    @Test
    void orgWideListUsesOrgPredicate() {
        login("org1", null, "org_admin");
        when(memberRepo.findByOrganizationIdOrderByCreatedAtDesc("org1")).thenReturn(List.of());
        controller.list("org1", null, null);
        verify(memberRepo).findByOrganizationIdOrderByCreatedAtDesc("org1");
        verify(memberRepo, never()).findByOrganizationIdAndBranchIdOrderByCreatedAtDesc(any(), any());
    }

    @Test
    void branchScopedCannotGetOtherBranchMemberById() {
        login("org1", "branchA", "staff");
        Member m = new Member();
        m.setOrganizationId("org1");
        m.setBranchId("branchB");
        when(memberRepo.findById("m1")).thenReturn(java.util.Optional.of(m));
        var ex = assertThrows(ResponseStatusException.class,
                () -> controller.get("org1", "m1"));
        assertEquals(404, ex.getStatusCode().value());
    }

    @Test
    void branchScopedCanGetOwnBranchMemberById() {
        login("org1", "branchA", "staff");
        Member m = new Member();
        m.setOrganizationId("org1");
        m.setBranchId("branchA");
        when(memberRepo.findById("m1")).thenReturn(java.util.Optional.of(m));
        assertSame(m, controller.get("org1", "m1"));
    }

    @Test
    void crossOrgListDenied() {
        login("org1", null, "org_owner");
        var ex = assertThrows(ResponseStatusException.class,
                () -> controller.list("org2", null, null));
        assertEquals(403, ex.getStatusCode().value());
        verifyNoInteractions(memberRepo);
    }

    @Test
    void clientCannotOverrideBranchViaBody() {
        login("org1", "branchA", "staff");
        when(memberRepo.save(any())).thenAnswer(i -> i.getArgument(0));
        var ex = assertThrows(ResponseStatusException.class,
                () -> controller.create("org1", java.util.Map.of(
                        "name", "Test", "branch_id", "branchB")));
        assertEquals(403, ex.getStatusCode().value());
        verify(memberRepo, never()).save(any());
    }
}
