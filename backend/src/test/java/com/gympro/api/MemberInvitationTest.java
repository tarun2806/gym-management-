package com.gympro.api;

import com.gympro.api.auth.OrgContextService;
import com.gympro.api.memberinvite.MemberInvitationController;
import com.gympro.api.model.Member;
import com.gympro.api.model.MemberInvitation;
import com.gympro.api.model.OrganizationMembership;
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

class MemberInvitationTest {

    private MemberInvitationRepository inviteRepo;
    private MemberRepository memberRepo;
    private OrganizationMembershipRepository memberShipRepo;
    private SystemLogRepository logRepo;
    private MemberInvitationController controller;

    private static final String RAW = "gympro_mem_testtoken";
    private static final String HASH = PlatformAdminController.sha256(RAW);

    private void login(String uid, String orgId, String role) {
        var view = new AppUserPrincipal.OrgMembershipView(orgId, null, role, "active");
        var p = new AppUserPrincipal(uid, "u@x.com", List.of(view));
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(p, null, List.of()));
    }

    @BeforeEach
    void setUp() {
        inviteRepo = mock(MemberInvitationRepository.class);
        memberRepo = mock(MemberRepository.class);
        memberShipRepo = mock(OrganizationMembershipRepository.class);
        logRepo = mock(SystemLogRepository.class);
        controller = new MemberInvitationController(inviteRepo, memberRepo, memberShipRepo,
                logRepo, mock(TrainerRepository.class), new OrgContextService(memberShipRepo, mock(BranchRepository.class)));
    }

    @AfterEach
    void tearDown() { SecurityContextHolder.clearContext(); }

    private Member member(String userId) {
        var m = new Member();
        m.setId("mem1"); m.setOrganizationId("org1"); m.setBranchId("br1");
        m.setName("Member One"); m.setStatus("Active"); m.setUserId(userId);
        return m;
    }

    private MemberInvitation invite(boolean expired, boolean revoked, boolean redeemed) {
        var i = new MemberInvitation();
        i.setId("inv1"); i.setTokenHash(HASH);
        i.setOrganizationId("org1"); i.setBranchId("br1"); i.setMemberId("mem1");
        i.setInvitedBy("staff1");
        i.setExpiresAt(expired ? Instant.now().minus(1, ChronoUnit.DAYS)
                               : Instant.now().plus(7, ChronoUnit.DAYS));
        if (revoked) i.setRevokedAt(Instant.now());
        if (redeemed) { i.setRedeemedAt(Instant.now()); i.setRedeemedBy("other"); }
        return i;
    }

    private void stubInvite(MemberInvitation i) { when(inviteRepo.findByTokenHash(HASH)).thenReturn(Optional.of(i)); }

    @Test void validInviteRedeemsAndLinks() {
        login("uid-new", null, "member");
        stubInvite(invite(false, false, false));
        when(inviteRepo.redeem(eq("inv1"), eq("uid-new"), any())).thenReturn(1);
        when(memberRepo.findById("mem1")).thenReturn(Optional.of(member(null)));
        when(memberRepo.save(any())).thenAnswer(i -> i.getArgument(0));
        when(memberShipRepo.findById("uid-new:org1")).thenReturn(Optional.empty());
        when(memberShipRepo.save(any())).thenAnswer(i -> i.getArgument(0));
        var r = controller.redeem(Map.of("token", RAW));
        assertEquals("member", r.get("role"));
        assertEquals("org1", r.get("organization_id"));
        verify(memberRepo).save(argThat((Member m) -> "uid-new".equals(m.getUserId())));
        verify(memberShipRepo).save(argThat((OrganizationMembership m) -> "member".equals(m.getRole())));
    }

    @Test void invalidTokenRejected() {
        login("uid", null, "member");
        when(inviteRepo.findByTokenHash(anyString())).thenReturn(Optional.empty());
        assertThrows(ResponseStatusException.class, () -> controller.redeem(Map.of("token", "bad")));
    }

    @Test void expiredInviteRejected() {
        login("uid", null, "member");
        stubInvite(invite(true, false, false));
        assertThrows(ResponseStatusException.class, () -> controller.redeem(Map.of("token", RAW)));
    }

    @Test void revokedInviteRejected() {
        login("uid", null, "member");
        stubInvite(invite(false, true, false));
        assertThrows(ResponseStatusException.class, () -> controller.redeem(Map.of("token", RAW)));
    }

    @Test void redeemedInviteRejected() {
        login("uid", null, "member");
        stubInvite(invite(false, false, true));
        assertThrows(ResponseStatusException.class, () -> controller.redeem(Map.of("token", RAW)));
    }

    @Test void concurrentRedemptionZeroRowsDenied() {
        login("uid", null, "member");
        stubInvite(invite(false, false, false));
        when(inviteRepo.redeem(any(), any(), any())).thenReturn(0);
        assertThrows(ResponseStatusException.class, () -> controller.redeem(Map.of("token", RAW)));
        verify(memberRepo, never()).save(any());
    }

    @Test void alreadyLinkedToOtherUserRejected() {
        login("uid-b", null, "member");
        stubInvite(invite(false, false, false));
        when(inviteRepo.redeem(any(), any(), any())).thenReturn(1);
        when(memberRepo.findById("mem1")).thenReturn(Optional.of(member("uid-a")));
        assertThrows(ResponseStatusException.class, () -> controller.redeem(Map.of("token", RAW)));
        verify(memberRepo, never()).save(any());
    }

    @Test void inviteForLinkedMemberRejected() {
        login("staff", "org1", "staff");
        when(memberRepo.findById("mem1")).thenReturn(Optional.of(member("uid-x")));
        var ex = assertThrows(ResponseStatusException.class, () -> controller.invite("org1",
                Map.of("member_id", "mem1")));
        assertEquals(409, ex.getStatusCode().value());
    }

    @Test void memberCannotAccessManagementAggregates() {
        // Dashboard is now role-gated; member role is absent from allowed set —
        // verified at controller level in ControllerBranchIsolationTest patterns.
        // Here: member redeeming gets role 'member', never elevated.
        login("uid", null, "member");
        stubInvite(invite(false, false, false));
        when(inviteRepo.redeem(any(), any(), any())).thenReturn(1);
        when(memberRepo.findById("mem1")).thenReturn(Optional.of(member(null)));
        when(memberRepo.save(any())).thenAnswer(i -> i.getArgument(0));
        when(memberShipRepo.findById(any())).thenReturn(Optional.empty());
        when(memberShipRepo.save(any())).thenAnswer(i -> i.getArgument(0));
        var r = controller.redeem(Map.of("token", RAW));
        assertEquals("member", r.get("role"));
        assertNotEquals("org_owner", r.get("role"));
    }

    @Test void myMemberReturnsOnlyOwnRecord() {
        login("uid-own", null, "member");
        when(memberRepo.findByUserId("uid-own")).thenReturn(Optional.of(member("uid-own")));
        var r = controller.myMember();
        assertEquals("mem1", r.get("id"));
        verify(memberRepo).findByUserId("uid-own");
        verify(memberRepo, never()).findById(anyString());
    }

    @Test void myMember404WhenUnlinked() {
        login("uid-none", null, "member");
        when(memberRepo.findByUserId("uid-none")).thenReturn(Optional.empty());
        assertThrows(ResponseStatusException.class, () -> controller.myMember());
    }
}
