package com.gympro.api;

import com.gympro.api.auth.OrgContextService;
import com.gympro.api.memberinvite.MemberSelfController;
import com.gympro.api.model.*;
import com.gympro.api.repository.*;
import com.gympro.api.security.AppUserPrincipal;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class MemberSelfControllerTest {

    private MemberRepository memberRepo;
    private AttendanceRepository attendanceRepo;
    private PaymentRepository paymentRepo;
    private InvoiceRepository invoiceRepo;
    private WorkoutPlanRepository workoutRepo;
    private DietPlanRepository dietRepo;
    private GymClassRepository classRepo;
    private ClassBookingRepository bookingRepo;
    private MemberSelfController controller;

    private static final String UID = "uid-member-1";
    private static final String MEMBER_ID = "member-1";
    private static final String ORG = "org-1";

    @BeforeEach
    void setUp() {
        memberRepo = mock(MemberRepository.class);
        attendanceRepo = mock(AttendanceRepository.class);
        paymentRepo = mock(PaymentRepository.class);
        invoiceRepo = mock(InvoiceRepository.class);
        workoutRepo = mock(WorkoutPlanRepository.class);
        dietRepo = mock(DietPlanRepository.class);
        classRepo = mock(GymClassRepository.class);
        bookingRepo = mock(ClassBookingRepository.class);
        controller = new MemberSelfController(memberRepo, attendanceRepo, paymentRepo,
                invoiceRepo, workoutRepo, dietRepo, classRepo, bookingRepo,
                new OrgContextService(mock(OrganizationMembershipRepository.class),
                        mock(BranchRepository.class)));
    }

    @AfterEach
    void tearDown() { SecurityContextHolder.clearContext(); }

    private void login(String uid) {
        var p = new AppUserPrincipal(uid, "m@x.com", List.of());
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(p, null, List.of()));
    }

    private Member linkedMember() {
        var m = new Member();
        m.setId(MEMBER_ID);
        m.setOrganizationId(ORG);
        m.setUserId(UID);
        m.setName("Test Member");
        return m;
    }

    @Test
    void unlinkedUserGets404() {
        login("uid-stranger");
        when(memberRepo.findByUserId("uid-stranger")).thenReturn(Optional.empty());
        assertThrows(ResponseStatusException.class, () -> controller.attendance(null, null, 0));
        assertThrows(ResponseStatusException.class, () -> controller.payments(0));
        assertThrows(ResponseStatusException.class, () -> controller.invoices());
        assertThrows(ResponseStatusException.class, () -> controller.workoutPlans());
        assertThrows(ResponseStatusException.class, () -> controller.dietPlans());
    }

    @Test
    void attendanceScopedToOwnMemberId() {
        login(UID);
        when(memberRepo.findByUserId(UID)).thenReturn(Optional.of(linkedMember()));
        var a = new Attendance();
        a.setId("att-1");
        a.setMemberId(MEMBER_ID);
        a.setCheckIn(LocalDateTime.now());
        when(attendanceRepo.findByMemberIdOrderByCheckInDesc(eq(MEMBER_ID), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(a)));

        Map<String, Object> res = controller.attendance(null, null, 0);
        @SuppressWarnings("unchecked")
        var items = (List<Map<String, Object>>) res.get("items");
        assertEquals(1, items.size());
        assertEquals("att-1", items.get(0).get("id"));
        verify(attendanceRepo).findByMemberIdOrderByCheckInDesc(eq(MEMBER_ID), any());
        verify(attendanceRepo, never()).findByMemberIdAndCheckInBetweenOrderByCheckInDesc(
                any(), any(), any(), any());
    }

    @Test
    void attendanceDateFilterUsesRangeQuery() {
        login(UID);
        when(memberRepo.findByUserId(UID)).thenReturn(Optional.of(linkedMember()));
        when(attendanceRepo.findByMemberIdAndCheckInBetweenOrderByCheckInDesc(
                eq(MEMBER_ID), any(LocalDateTime.class), any(LocalDateTime.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));

        controller.attendance("2026-01-01T00:00:00", "2026-01-31T23:59:59", 0);
        verify(attendanceRepo).findByMemberIdAndCheckInBetweenOrderByCheckInDesc(
                eq(MEMBER_ID), any(), any(), any());
    }

    @Test
    void paymentsScopedToOwnMemberIdAndExcludesSensitiveFields() {
        login(UID);
        when(memberRepo.findByUserId(UID)).thenReturn(Optional.of(linkedMember()));
        var p = new Payment();
        p.setId("pay-1");
        p.setMemberId(MEMBER_ID);
        p.setAmount(new java.math.BigDecimal("500"));
        p.setStatus("completed");
        p.setRazorpayPaymentId("rzp_secret");
        when(paymentRepo.findByMemberIdOrderByCreatedAtDesc(eq(MEMBER_ID), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(p)));

        Map<String, Object> res = controller.payments(0);
        @SuppressWarnings("unchecked")
        var items = (List<Map<String, Object>>) res.get("items");
        assertEquals(1, items.size());
        assertFalse(items.get(0).containsKey("razorpay_payment_id"));
        assertFalse(items.get(0).containsKey("razorpay_order_id"));
        verify(paymentRepo).findByMemberIdOrderByCreatedAtDesc(eq(MEMBER_ID), any());
    }

    @Test
    void invoicesScopedToOwnMemberId() {
        login(UID);
        when(memberRepo.findByUserId(UID)).thenReturn(Optional.of(linkedMember()));
        var inv = new Invoice();
        inv.setId("inv-1");
        inv.setMemberId(MEMBER_ID);
        inv.setInvoiceNumber("INV-1");
        when(invoiceRepo.findByMemberId(MEMBER_ID)).thenReturn(List.of(inv));

        var res = controller.invoices();
        assertEquals(1, res.size());
        assertEquals("inv-1", res.get(0).get("id"));
        verify(invoiceRepo).findByMemberId(MEMBER_ID);
        verify(invoiceRepo, never()).findByOrganizationId(anyString());
    }

    @Test
    void workoutAndDietPlansScopedToOwnMemberId() {
        login(UID);
        when(memberRepo.findByUserId(UID)).thenReturn(Optional.of(linkedMember()));
        var w = new WorkoutPlan();
        w.setId("wp-1");
        w.setMemberId(MEMBER_ID);
        w.setName("Strength");
        when(workoutRepo.findByMemberId(MEMBER_ID)).thenReturn(List.of(w));
        var d = new DietPlan();
        d.setId("dp-1");
        d.setMemberId(MEMBER_ID);
        when(dietRepo.findByMemberId(MEMBER_ID)).thenReturn(List.of(d));

        assertEquals(1, controller.workoutPlans().size());
        assertEquals(1, controller.dietPlans().size());
        verify(workoutRepo).findByMemberId(MEMBER_ID);
        verify(dietRepo).findByMemberId(MEMBER_ID);
        verify(workoutRepo, never()).findByOrganizationId(anyString());
        verify(dietRepo, never()).findByOrganizationId(anyString());
    }

    @Test
    void memberBooksOnlyOwnRecord() {
        login(UID);
        var m = linkedMember();
        when(memberRepo.findByUserId(UID)).thenReturn(Optional.of(m));
        var c = new GymClass();
        c.setId("cls-1");
        c.setOrganizationId(ORG);
        c.setStatus("Active");
        c.setCapacity(10);
        c.setEnrolled(2);
        when(classRepo.findByIdForUpdate("cls-1")).thenReturn(Optional.of(c));
        when(bookingRepo.existsByClassIdAndMemberIdAndStatus("cls-1", MEMBER_ID, "booked"))
                .thenReturn(false);
        when(classRepo.claimSeat("cls-1")).thenReturn(1);
        when(bookingRepo.save(any())).thenAnswer(i -> i.getArgument(0));

        var res = controller.book("cls-1");
        assertNotNull(res.get("id"));
        // memberId comes from the linked record — never client input.
        verify(bookingRepo).save(argThat(b -> MEMBER_ID.equals(((ClassBooking) b).getMemberId())));
    }

    @Test
    void memberCannotBookOtherOrgClass() {
        login(UID);
        when(memberRepo.findByUserId(UID)).thenReturn(Optional.of(linkedMember()));
        var c = new GymClass();
        c.setId("cls-x");
        c.setOrganizationId("org-other");
        when(classRepo.findByIdForUpdate("cls-x")).thenReturn(Optional.of(c));
        assertEquals(404, assertThrows(ResponseStatusException.class,
                () -> controller.book("cls-x")).getStatusCode().value());
        verify(bookingRepo, never()).save(any());
    }

    @Test
    void memberCannotCancelOthersBooking() {
        login(UID);
        when(memberRepo.findByUserId(UID)).thenReturn(Optional.of(linkedMember()));
        var b = new ClassBooking();
        b.setId("bk-9");
        b.setOrganizationId(ORG);
        b.setMemberId("member-someone-else");
        b.setClassId("cls-1");
        b.setStatus("booked");
        when(bookingRepo.findById("bk-9")).thenReturn(Optional.of(b));
        assertEquals(404, assertThrows(ResponseStatusException.class,
                () -> controller.cancelBooking("bk-9")).getStatusCode().value());
        verify(bookingRepo, never()).save(any());
    }

    @Test
    void memberCancelsOwnBooking() {
        login(UID);
        when(memberRepo.findByUserId(UID)).thenReturn(Optional.of(linkedMember()));
        var b = new ClassBooking();
        b.setId("bk-1");
        b.setOrganizationId(ORG);
        b.setMemberId(MEMBER_ID);
        b.setClassId("cls-1");
        b.setStatus("booked");
        when(bookingRepo.findById("bk-1")).thenReturn(Optional.of(b));
        when(bookingRepo.save(any())).thenAnswer(i -> i.getArgument(0));
        var c = new GymClass();
        c.setId("cls-1");
        c.setEnrolled(3);
        when(classRepo.findByIdForUpdate("cls-1")).thenReturn(Optional.of(c));

        var res = controller.cancelBooking("bk-1");
        assertEquals("cancelled", res.get("status"));
        assertEquals(2, c.getEnrolled());
    }

    @Test
    void differentUsersResolveDifferentMembers() {
        login("uid-other");
        when(memberRepo.findByUserId("uid-other")).thenReturn(Optional.empty());
        assertThrows(ResponseStatusException.class, () -> controller.payments(0));
        verify(paymentRepo, never()).findByMemberIdOrderByCreatedAtDesc(anyString(), any());
    }
}
