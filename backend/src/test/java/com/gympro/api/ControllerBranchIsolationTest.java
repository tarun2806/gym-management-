package com.gympro.api;

import com.gympro.api.attendance.AttendanceController;
import com.gympro.api.auth.OrgContextService;
import com.gympro.api.billing.InvoiceController;
import com.gympro.api.classes.ClassController;
import com.gympro.api.dashboard.DashboardController;
import com.gympro.api.equipment.EquipmentController;
import com.gympro.api.expenses.ExpenseController;
import com.gympro.api.inventory.InventoryController;
import com.gympro.api.mail.EmailService;
import com.gympro.api.members.MemberController;
import com.gympro.api.payments.PaymentController;
import com.gympro.api.payroll.PayrollController;
import com.gympro.api.pt.PtController;
import com.gympro.api.repository.*;
import com.gympro.api.security.AppUserPrincipal;
import com.gympro.api.trainers.TrainerController;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class ControllerBranchIsolationTest {

    private OrgContextService orgContext;
    private MemberRepository memberRepo;
    private TrainerRepository trainerRepo;
    private GymClassRepository classRepo;
    private ClassBookingRepository bookingRepo;
    private AttendanceRepository attendanceRepo;
    private PaymentRepository paymentRepo;
    private InvoiceRepository invoiceRepo;
    private ExpenseRepository expenseRepo;
    private PayrollEntryRepository payrollRepo;
    private ProductRepository productRepo;
    private StockMovementRepository movementRepo;
    private EquipmentRepository equipmentRepo;
    private PtPackageRepository packageRepo;
    private PtSessionRepository sessionRepo;

    private void login(String orgId, String branchId, String role) {
        var view = new AppUserPrincipal.OrgMembershipView(orgId, branchId, role, "active");
        var p = new AppUserPrincipal("uid1", "a@b.c", List.of(view));
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(p, null, List.of()));
    }

    @BeforeEach
    void setUp() {
        memberRepo = mock(MemberRepository.class);
        trainerRepo = mock(TrainerRepository.class);
        classRepo = mock(GymClassRepository.class);
        bookingRepo = mock(ClassBookingRepository.class);
        attendanceRepo = mock(AttendanceRepository.class);
        paymentRepo = mock(PaymentRepository.class);
        invoiceRepo = mock(InvoiceRepository.class);
        expenseRepo = mock(ExpenseRepository.class);
        payrollRepo = mock(PayrollEntryRepository.class);
        productRepo = mock(ProductRepository.class);
        movementRepo = mock(StockMovementRepository.class);
        equipmentRepo = mock(EquipmentRepository.class);
        packageRepo = mock(PtPackageRepository.class);
        sessionRepo = mock(PtSessionRepository.class);
        orgContext = new OrgContextService(mock(OrganizationMembershipRepository.class), mock(BranchRepository.class), mock(com.gympro.api.repository.OrganizationRepository.class), mock(com.gympro.api.repository.OrganizationSubscriptionRepository.class), mock(com.gympro.api.subscription.SubscriptionService.class));
    }

    @AfterEach
    void tearDown() { SecurityContextHolder.clearContext(); }

    // ── List endpoints: branch predicate selection ──────────────────────────

    @Test
    void trainerListBranchScoped() {
        login("org1", "bA", "staff");
        var c = new TrainerController(trainerRepo, orgContext);
        when(trainerRepo.findByOrganizationIdAndBranchId("org1", "bA")).thenReturn(List.of());
        c.list("org1");
        verify(trainerRepo).findByOrganizationIdAndBranchId("org1", "bA");
        verify(trainerRepo, never()).findByOrganizationId("org1");
    }

    @Test
    void invoiceListOrgWide() {
        login("org1", null, "org_admin");
        var c = new InvoiceController(invoiceRepo, orgContext);
        when(invoiceRepo.findByOrganizationId("org1")).thenReturn(List.of());
        c.list("org1");
        verify(invoiceRepo).findByOrganizationId("org1");
        verify(invoiceRepo, never()).findByOrganizationIdAndBranchId(any(), any());
    }

    @Test
    void expenseListCrossOrgDenied() {
        login("org1", null, "org_owner");
        var c = new ExpenseController(expenseRepo, orgContext);
        assertEquals(403, assertThrows(ResponseStatusException.class,
                () -> c.list("org2")).getStatusCode().value());
        verifyNoInteractions(expenseRepo);
    }

    @Test
    void payrollListBranchScoped() {
        login("org1", "bA", "org_admin");
        var c = new PayrollController(payrollRepo, orgContext);
        when(payrollRepo.findByOrganizationIdAndBranchId("org1", "bA")).thenReturn(List.of());
        c.list("org1");
        verify(payrollRepo).findByOrganizationIdAndBranchId("org1", "bA");
    }

    @Test
    void equipmentListBranchScoped() {
        login("org1", "bA", "staff");
        var c = new EquipmentController(equipmentRepo, orgContext);
        when(equipmentRepo.findByOrganizationIdAndBranchId("org1", "bA")).thenReturn(List.of());
        c.list("org1");
        verify(equipmentRepo).findByOrganizationIdAndBranchId("org1", "bA");
    }

    @Test
    void ptPackagesListBranchScoped() {
        login("org1", "bA", "trainer");
        var c = new PtController(packageRepo, sessionRepo, orgContext);
        when(packageRepo.findByOrganizationIdAndBranchId("org1", "bA")).thenReturn(List.of());
        c.listPackages("org1");
        verify(packageRepo).findByOrganizationIdAndBranchId("org1", "bA");
    }

    // ── Detail endpoints: IDOR ──────────────────────────────────────────────

    @Test
    void paymentGetOtherBranchDenied() {
        login("org1", "bA", "org_admin");
        var c = new PaymentController(paymentRepo, orgContext);
        var p = new com.gympro.api.model.Payment();
        p.setOrganizationId("org1"); p.setBranchId("bB");
        when(paymentRepo.findById("p1")).thenReturn(java.util.Optional.of(p));
        assertEquals(404, assertThrows(ResponseStatusException.class,
                () -> c.get("org1", "p1")).getStatusCode().value());
    }

    @Test
    void classBookingsRequireParentBranchAccess() {
        login("org1", "bA", "staff");
        var c = new ClassController(classRepo, bookingRepo, memberRepo, orgContext);
        var gymClass = new com.gympro.api.model.GymClass();
        gymClass.setOrganizationId("org1"); gymClass.setBranchId("bB"); gymClass.setId("c1");
        when(classRepo.findById("c1")).thenReturn(java.util.Optional.of(gymClass));
        assertEquals(404, assertThrows(ResponseStatusException.class,
                () -> c.bookings("org1", "c1")).getStatusCode().value());
        verify(bookingRepo, never()).findByClassId(any());
    }

    @Test
    void classBookOtherBranchDenied() {
        login("org1", "bA", "staff");
        var c = new ClassController(classRepo, bookingRepo, memberRepo, orgContext);
        var gymClass = new com.gympro.api.model.GymClass();
        gymClass.setOrganizationId("org1"); gymClass.setBranchId("bB"); gymClass.setId("c1");
        gymClass.setStatus("Active"); gymClass.setCapacity(10); gymClass.setEnrolled(0);
        when(classRepo.findById("c1")).thenReturn(java.util.Optional.of(gymClass));
        assertEquals(404, assertThrows(ResponseStatusException.class,
                () -> c.book("org1", "c1", Map.of("member_id", "m1"))).getStatusCode().value());
        verify(bookingRepo, never()).save(any());
        verify(classRepo, never()).save(any());
    }

    // ── Inventory: product + movement ownership ─────────────────────────────

    @Test
    void inventoryProductMovementsEnforceOwnership() {
        login("org1", "bA", "staff");
        var c = new InventoryController(productRepo, movementRepo, orgContext);
        var p = new com.gympro.api.model.Product();
        p.setOrganizationId("org1"); p.setBranchId("bB"); p.setId("prod1");
        when(productRepo.findById("prod1")).thenReturn(java.util.Optional.of(p));
        assertEquals(404, assertThrows(ResponseStatusException.class,
                () -> c.movements("org1", "prod1")).getStatusCode().value());
    }

    @Test
    void inventoryProductsListBranchScoped() {
        login("org1", "bA", "staff");
        var c = new InventoryController(productRepo, movementRepo, orgContext);
        when(productRepo.findByOrganizationIdAndBranchId("org1", "bA")).thenReturn(List.of());
        c.list("org1");
        verify(productRepo).findByOrganizationIdAndBranchId("org1", "bA");
    }

    // ── Dashboard aggregates ────────────────────────────────────────────────

    @Test
    void dashboardBranchScopedAggregates() {
        login("org1", "bA", "staff");
        var c = new DashboardController(memberRepo, trainerRepo, classRepo,
                attendanceRepo, paymentRepo, equipmentRepo, orgContext);
        when(memberRepo.countByOrganizationIdAndBranchId("org1", "bA")).thenReturn(5L);
        when(memberRepo.findByOrganizationIdAndBranchIdAndStatus("org1", "bA", "Active"))
                .thenReturn(List.of());
        when(trainerRepo.findByOrganizationIdAndBranchId("org1", "bA")).thenReturn(List.of());
        when(classRepo.findByOrganizationIdAndBranchId("org1", "bA")).thenReturn(List.of());
        when(equipmentRepo.findByOrganizationIdAndBranchId("org1", "bA")).thenReturn(List.of());
        when(attendanceRepo.findInRange(eq("org1"), any(), any())).thenReturn(List.of());
        when(paymentRepo.findByOrganizationIdOrderByCreatedAtDesc(eq("org1"), any()))
                .thenReturn(new PageImpl<>(List.of()));
        var result = c.summary("org1");
        assertEquals(5L, result.get("total_members"));
        verify(memberRepo).countByOrganizationIdAndBranchId("org1", "bA");
        verify(memberRepo, never()).countByOrganizationId("org1");
    }

    @Test
    void dashboardCrossOrgDenied() {
        login("org1", null, "org_owner");
        var c = new DashboardController(memberRepo, trainerRepo, classRepo,
                attendanceRepo, paymentRepo, equipmentRepo, orgContext);
        assertEquals(403, assertThrows(ResponseStatusException.class,
                () -> c.summary("org2")).getStatusCode().value());
        verifyNoInteractions(memberRepo, paymentRepo);
    }

    @Test
    void dashboardDeniedForMemberRole() {
        login("org1", null, "member");
        var c = new DashboardController(memberRepo, trainerRepo, classRepo,
                attendanceRepo, paymentRepo, equipmentRepo, orgContext);
        assertEquals(403, assertThrows(ResponseStatusException.class,
                () -> c.summary("org1")).getStatusCode().value());
        verifyNoInteractions(memberRepo, paymentRepo, attendanceRepo);
    }

    @Test
    void dashboardDeniedForLegacyUserRole() {
        // Legacy "user" role must never gain management access.
        login("org1", null, "user");
        var c = new DashboardController(memberRepo, trainerRepo, classRepo,
                attendanceRepo, paymentRepo, equipmentRepo, orgContext);
        assertEquals(403, assertThrows(ResponseStatusException.class,
                () -> c.summary("org1")).getStatusCode().value());
    }

    @Test
    void memberDeniedOrgWideManagementReads() {
        login("org1", null, "member");
        // Org-wide member list (PII), payments and invoices must 403 for members.
        var members = new MemberController(memberRepo,
                mock(MemberInvitationRepository.class), orgContext, mock(EmailService.class));
        assertEquals(403, statusOf(() -> members.list("org1", null, null)));
        var payments = new PaymentController(paymentRepo, orgContext);
        assertEquals(403, statusOf(() -> payments.list("org1", 0, 20)));
        var invoices = new InvoiceController(invoiceRepo, orgContext);
        assertEquals(403, statusOf(() -> invoices.list("org1")));
        var payroll = new PayrollController(payrollRepo, orgContext);
        assertEquals(403, statusOf(() -> payroll.list("org1")));
        var equipment = new EquipmentController(equipmentRepo, orgContext);
        assertEquals(403, statusOf(() -> equipment.list("org1")));
        var attendance = new AttendanceController(attendanceRepo, memberRepo, orgContext);
        assertEquals(403, statusOf(() -> attendance.list("org1", null)));
        verifyNoInteractions(memberRepo, paymentRepo, invoiceRepo, payrollRepo,
                equipmentRepo, attendanceRepo);
    }

    @Test
    void staffReadsOpsDataButNotFinances() {
        login("org1", null, "staff");
        // Staff keep operational reads (invoices, members, attendance)…
        var invoices = new InvoiceController(invoiceRepo, orgContext);
        when(invoiceRepo.findByOrganizationId("org1")).thenReturn(List.of());
        assertDoesNotThrow(() -> invoices.list("org1"));
        // …but payroll/payments/expenses are owner+admin only.
        var payments = new PaymentController(paymentRepo, orgContext);
        assertEquals(403, statusOf(() -> payments.list("org1", 0, 20)));
        var payroll = new PayrollController(payrollRepo, orgContext);
        assertEquals(403, statusOf(() -> payroll.list("org1")));
        var expenses = new ExpenseController(expenseRepo, orgContext);
        assertEquals(403, statusOf(() -> expenses.list("org1")));
    }

    @Test
    void trainerDeniedFinancesAndOpsReads() {
        login("org1", null, "trainer");
        var payments = new PaymentController(paymentRepo, orgContext);
        assertEquals(403, statusOf(() -> payments.list("org1", 0, 20)));
        var members = new MemberController(memberRepo,
                mock(MemberInvitationRepository.class), orgContext, mock(EmailService.class));
        assertEquals(403, statusOf(() -> members.list("org1", null, null)));
        var attendance = new AttendanceController(attendanceRepo, memberRepo, orgContext);
        assertEquals(403, statusOf(() -> attendance.list("org1", null)));
        // Trainers keep plan-management reads.
        var plans = new com.gympro.api.training.PlanController(
                mock(WorkoutPlanRepository.class), mock(DietPlanRepository.class), orgContext);
        assertDoesNotThrow(() -> plans.listWorkouts("org1"));
    }

    private static int statusOf(ThrowingRunnable r) {
        try { r.run(); return 200; }
        catch (ResponseStatusException e) { return e.getStatusCode().value(); }
    }

    @FunctionalInterface
    private interface ThrowingRunnable { void run(); }

    // ── Write-path: denied ops must not modify data ─────────────────────────

    @Test
    void memberUpdateOtherBranchDenied() {
        login("org1", "bA", "staff");
        var c = new MemberController(memberRepo,
                mock(MemberInvitationRepository.class), orgContext, mock(EmailService.class));
        var m = new com.gympro.api.model.Member();
        m.setOrganizationId("org1"); m.setBranchId("bB");
        when(memberRepo.findById("m1")).thenReturn(java.util.Optional.of(m));
        assertEquals(404, assertThrows(ResponseStatusException.class,
                () -> c.update("org1", "m1", Map.of("name", "X"))).getStatusCode().value());
        verify(memberRepo, never()).save(any());
    }

    @Test
    void ptSessionStatusOtherBranchDenied() {
        login("org1", "bA", "staff");
        var c = new PtController(packageRepo, sessionRepo, orgContext);
        var s = new com.gympro.api.model.PtSession();
        s.setOrganizationId("org1"); s.setBranchId("bB");
        when(sessionRepo.findById("s1")).thenReturn(java.util.Optional.of(s));
        assertEquals(404, assertThrows(ResponseStatusException.class,
                () -> c.setSessionStatus("org1", "s1", Map.of("status", "completed")))
                .getStatusCode().value());
        verify(sessionRepo, never()).save(any());
    }

    // ── Unauthenticated ─────────────────────────────────────────────────────

    @Test
    void unauthenticatedListDenied() {
        SecurityContextHolder.clearContext();
        var c = new TrainerController(trainerRepo, orgContext);
        assertEquals(401, assertThrows(ResponseStatusException.class,
                () -> c.list("org1")).getStatusCode().value());
        verifyNoInteractions(trainerRepo);
    }
}
