package com.gympro.api;

import com.gympro.api.model.OrganizationSubscription;
import com.gympro.api.model.SubscriptionPayment;
import com.gympro.api.model.SubscriptionPlan;
import com.gympro.api.repository.OrganizationSubscriptionRepository;
import com.gympro.api.repository.SubscriptionEventRepository;
import com.gympro.api.repository.SubscriptionPaymentRepository;
import com.gympro.api.repository.SubscriptionPlanRepository;
import com.gympro.api.subscription.SubscriptionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class SubscriptionServiceTest {

    private OrganizationSubscriptionRepository subRepo;
    private SubscriptionPlanRepository planRepo;
    private SubscriptionPaymentRepository paymentRepo;
    private SubscriptionEventRepository eventRepo;
    private SubscriptionService svc;

    @BeforeEach
    void setUp() {
        subRepo = mock(OrganizationSubscriptionRepository.class);
        planRepo = mock(SubscriptionPlanRepository.class);
        paymentRepo = mock(SubscriptionPaymentRepository.class);
        eventRepo = mock(SubscriptionEventRepository.class);
        svc = new SubscriptionService(subRepo, planRepo, paymentRepo, eventRepo);
        when(subRepo.save(any())).thenAnswer(i -> i.getArgument(0));
        when(paymentRepo.save(any())).thenAnswer(i -> i.getArgument(0));
        when(eventRepo.save(any())).thenAnswer(i -> i.getArgument(0));
    }

    private OrganizationSubscription sub(String status) {
        var s = new OrganizationSubscription();
        s.setId("sub-1");
        s.setOrganizationId("org-1");
        s.setStatus(status);
        return s;
    }

    @Test
    void trialCreatedOncePerOrg() {
        when(subRepo.findByOrganizationId("org-1")).thenReturn(Optional.of(sub("TRIALING")));
        var s = svc.createTrial("org-1", "u1");
        assertEquals("TRIALING", s.getStatus());
        verify(subRepo, never()).save(any()); // existing returned, not duplicated
    }

    @Test
    void newTrialGets14Days() {
        when(subRepo.findByOrganizationId("org-2")).thenReturn(Optional.empty());
        var plan = new SubscriptionPlan();
        plan.setId("plan-1"); plan.setName("Annual"); plan.setAnnualPrice(new BigDecimal("999"));
        plan.setCurrency("INR"); plan.setBillingInterval("YEARLY"); plan.setDurationDays(365);
        when(planRepo.findFirstByStatusOrderByCreatedAtAsc("active")).thenReturn(Optional.of(plan));
        Instant before = Instant.now();
        var s = svc.createTrial("org-2", "u1");
        assertEquals("TRIALING", s.getStatus());
        assertTrue(s.getTrialEnd().isAfter(before.plus(13, ChronoUnit.DAYS)));
        assertTrue(s.getTrialEnd().isBefore(before.plus(15, ChronoUnit.DAYS)));
    }

    @Test
    void expiredTrialIsNotEntitled() {
        var s = sub("TRIALING");
        s.setTrialEnd(Instant.now().minus(1, ChronoUnit.DAYS));
        assertEquals("EXPIRED", svc.effectiveStatus(s, Instant.now()));
    }

    @Test
    void activeSubscriptionExtendsFromExistingEnd() {
        var s = sub("ACTIVE");
        Instant end = Instant.now().plus(100, ChronoUnit.DAYS);
        s.setSubscriptionEnd(end);
        when(subRepo.findByOrganizationIdForUpdate("org-1")).thenReturn(Optional.of(s));
        var plan = new SubscriptionPlan();
        plan.setId("plan-1"); plan.setName("Annual"); plan.setAnnualPrice(new BigDecimal("999"));
        plan.setCurrency("INR"); plan.setStatus("active");
        when(planRepo.findById("plan-1")).thenReturn(Optional.of(plan));
        var p = svc.activatePaidSubscription("org-1", "plan-1", "order-1", "pay-1",
                new SubscriptionService.BigDecimalHolder(new BigDecimal("999"), "INR"), "u1");
        assertEquals(end.plus(365, ChronoUnit.DAYS), s.getSubscriptionEnd());
        assertEquals("completed", p.getStatus());
        assertEquals("pay-1", p.getRazorpayPaymentId());
    }

    @Test
    void expiredSubscriptionStartsFromPaymentDate() {
        var s = sub("TRIALING");
        s.setTrialEnd(Instant.now().minus(1, ChronoUnit.DAYS));
        when(subRepo.findByOrganizationIdForUpdate("org-1")).thenReturn(Optional.of(s));
        var plan = new SubscriptionPlan();
        plan.setId("plan-1"); plan.setName("Annual"); plan.setAnnualPrice(new BigDecimal("999"));
        plan.setCurrency("INR"); plan.setStatus("active");
        when(planRepo.findById("plan-1")).thenReturn(Optional.of(plan));
        svc.activatePaidSubscription("org-1", "plan-1", "order-1", "pay-1",
                new SubscriptionService.BigDecimalHolder(new BigDecimal("999"), "INR"), "u1");
        assertEquals("ACTIVE", s.getStatus());
        assertTrue(s.getSubscriptionEnd().isAfter(Instant.now().plus(364, ChronoUnit.DAYS)));
    }

    @Test
    void inactivePlanRejected() {
        var s = sub("TRIALING");
        when(subRepo.findByOrganizationIdForUpdate("org-1")).thenReturn(Optional.of(s));
        var plan = new SubscriptionPlan();
        plan.setId("plan-x"); plan.setStatus("inactive");
        when(planRepo.findById("plan-x")).thenReturn(Optional.of(plan));
        assertThrows(ResponseStatusException.class, () -> svc.activatePaidSubscription(
                "org-1", "plan-x", "o", "p",
                new SubscriptionService.BigDecimalHolder(BigDecimal.TEN, "INR"), "u"));
    }

    @Test
    void paymentReplayDetected() {
        when(paymentRepo.existsByRazorpayPaymentId("pay-1")).thenReturn(true);
        assertTrue(svc.paymentAlreadyProcessed("pay-1"));
    }

    @Test
    void suspendedSubBlocksEntitlement() {
        var s = sub("SUSPENDED");
        when(subRepo.findByOrganizationId("org-1")).thenReturn(Optional.of(s));
        assertFalse(svc.hasEntitlement("org-1"));
    }

    @Test
    void pastDueStillEntitled() {
        var s = sub("PAST_DUE");
        s.setSubscriptionEnd(Instant.now().plus(30, ChronoUnit.DAYS));
        when(subRepo.findByOrganizationId("org-1")).thenReturn(Optional.of(s));
        assertTrue(svc.hasEntitlement("org-1"));
    }
}
