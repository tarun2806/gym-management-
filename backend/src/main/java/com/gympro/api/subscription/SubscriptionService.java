package com.gympro.api.subscription;

import com.gympro.api.model.OrganizationSubscription;
import com.gympro.api.model.SubscriptionEvent;
import com.gympro.api.model.SubscriptionPayment;
import com.gympro.api.model.SubscriptionPlan;
import com.gympro.api.repository.OrganizationSubscriptionRepository;
import com.gympro.api.repository.SubscriptionEventRepository;
import com.gympro.api.repository.SubscriptionPaymentRepository;
import com.gympro.api.repository.SubscriptionPlanRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Central subscription entitlement logic. All status transitions, trial
 * creation, paid activation and renewal extension rules live here —
 * controllers must not duplicate them.
 */
@Service
public class SubscriptionService {

    public static final int TRIAL_DAYS = 14;
    public static final int SUBSCRIPTION_DAYS = 365;

    private final OrganizationSubscriptionRepository subRepo;
    private final SubscriptionPlanRepository planRepo;
    private final SubscriptionPaymentRepository paymentRepo;
    private final SubscriptionEventRepository eventRepo;

    public SubscriptionService(OrganizationSubscriptionRepository subRepo,
                               SubscriptionPlanRepository planRepo,
                               SubscriptionPaymentRepository paymentRepo,
                               SubscriptionEventRepository eventRepo) {
        this.subRepo = subRepo;
        this.planRepo = planRepo;
        this.paymentRepo = paymentRepo;
        this.eventRepo = eventRepo;
    }

    /** Effective status: TRIALING/ACTIVE may lapse to EXPIRED based on time. */
    public String effectiveStatus(OrganizationSubscription s, Instant now) {
        if (s == null) return "NONE";
        if ("SUSPENDED".equals(s.getStatus()) || "CANCELLED".equals(s.getStatus())) return s.getStatus();
        if ("TRIALING".equals(s.getStatus())) {
            return (s.getTrialEnd() != null && s.getTrialEnd().isAfter(now)) ? "TRIALING" : "EXPIRED";
        }
        if ("ACTIVE".equals(s.getStatus()) || "PAST_DUE".equals(s.getStatus())) {
            return (s.getSubscriptionEnd() != null && s.getSubscriptionEnd().isAfter(now))
                    ? s.getStatus() : "EXPIRED";
        }
        return s.getStatus();
    }

    /** Whether the org may use paid gym-management features. */
    public boolean hasEntitlement(String orgId) {
        OrganizationSubscription s = subRepo.findByOrganizationId(orgId).orElse(null);
        String eff = effectiveStatus(s, Instant.now());
        return "TRIALING".equals(eff) || "ACTIVE".equals(eff) || "PAST_DUE".equals(eff);
    }

    /** Create the single TRIALING subscription for a new org (idempotent). */
    @Transactional
    public OrganizationSubscription createTrial(String orgId, String actorId) {
        if (subRepo.findByOrganizationId(orgId).isPresent()) {
            return subRepo.findByOrganizationId(orgId).get(); // one trial per org
        }
        SubscriptionPlan plan = planRepo.findFirstByStatusOrderByCreatedAtAsc("active").orElse(null);
        Instant now = Instant.now();
        OrganizationSubscription s = new OrganizationSubscription();
        s.setId(UUID.randomUUID().toString());
        s.setOrganizationId(orgId);
        s.setPlanId(plan != null ? plan.getId() : null);
        s.setPlanSnapshot(plan != null ? planSnapshot(plan) : null);
        s.setStatus("TRIALING");
        s.setTrialStart(now);
        s.setTrialEnd(now.plus(TRIAL_DAYS, ChronoUnit.DAYS));
        s.setCreatedAt(now);
        s.setUpdatedAt(now);
        OrganizationSubscription saved = subRepo.save(s);
        recordEvent(orgId, saved.getId(), "TRIAL_STARTED", actorId, "14-day trial started");
        return saved;
    }

    /**
     * Activate/extend a paid subscription after verified payment.
     * Active sub extends from existing end; expired starts from payment time.
     * Idempotent per razorpayPaymentId — a replayed payment cannot extend twice.
     */
    @Transactional
    public SubscriptionPayment activatePaidSubscription(String orgId, String planId,
                                                         String razorpayOrderId,
                                                         String razorpayPaymentId,
                                                         BigDecimalHolder amountHolder,
                                                         String actorId) {
        // Lock the subscription row to serialize concurrent activations.
        OrganizationSubscription s = subRepo.findByOrganizationIdForUpdate(orgId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "no subscription"));
        SubscriptionPlan plan = planRepo.findById(planId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "plan not found"));
        if (!"active".equals(plan.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "plan is not active");
        }

        SubscriptionPayment p = new SubscriptionPayment();
        p.setId(UUID.randomUUID().toString());
        p.setOrganizationId(orgId);
        p.setSubscriptionId(s.getId());
        p.setPlanId(planId);
        p.setAmount(amountHolder.amount());
        p.setCurrency(amountHolder.currency());
        p.setStatus("completed");
        p.setRazorpayOrderId(razorpayOrderId);
        p.setRazorpayPaymentId(razorpayPaymentId);
        p.setPurpose("subscription");

        Instant now = Instant.now();
        Instant newEnd;
        String eff = effectiveStatus(s, now);
        if ("ACTIVE".equals(eff) && s.getSubscriptionEnd() != null && s.getSubscriptionEnd().isAfter(now)) {
            newEnd = s.getSubscriptionEnd().plus(SUBSCRIPTION_DAYS, ChronoUnit.DAYS);
        } else {
            newEnd = now.plus(SUBSCRIPTION_DAYS, ChronoUnit.DAYS);
        }
        Instant periodStart = "ACTIVE".equals(eff) && s.getSubscriptionEnd() != null
                && s.getSubscriptionEnd().isAfter(now) ? s.getSubscriptionEnd() : now;

        s.setPlanId(planId);
        s.setPlanSnapshot(planSnapshot(plan));
        s.setStatus("ACTIVE");
        s.setSubscriptionStart(periodStart);
        s.setSubscriptionEnd(newEnd);
        s.setNextRenewalDate(newEnd);
        s.setUpdatedAt(now);
        subRepo.save(s);

        p.setPeriodStart(periodStart);
        p.setPeriodEnd(newEnd);
        SubscriptionPayment saved = paymentRepo.save(p);
        recordEvent(orgId, s.getId(), "SUBSCRIPTION_ACTIVATED", actorId,
                "plan=" + plan.getName() + " until=" + newEnd);
        return saved;
    }

    /** Idempotency guard: has this razorpay payment already been processed? */
    public boolean paymentAlreadyProcessed(String razorpayPaymentId) {
        return razorpayPaymentId != null && paymentRepo.existsByRazorpayPaymentId(razorpayPaymentId);
    }

    public void recordPendingPayment(String orgId, String planId, String orderId,
                                     BigDecimal amount, String currency) {
        SubscriptionPayment p = new SubscriptionPayment();
        p.setId(UUID.randomUUID().toString());
        p.setOrganizationId(orgId);
        p.setPlanId(planId);
        p.setAmount(amount);
        p.setCurrency(currency);
        p.setStatus("pending");
        p.setRazorpayOrderId(orderId);
        p.setPurpose("subscription");
        paymentRepo.save(p);
    }

    public void recordEvent(String orgId, String subId, String type, String actorId, String detail) {
        SubscriptionEvent e = new SubscriptionEvent();
        e.setId(UUID.randomUUID().toString());
        e.setOrganizationId(orgId);
        e.setSubscriptionId(subId);
        e.setEventType(type);
        e.setActorId(actorId);
        e.setDetail(detail);
        eventRepo.save(e);
    }

    public static String planSnapshot(SubscriptionPlan p) {
        return p.getName() + " | " + p.getAnnualPrice() + " " + p.getCurrency()
                + " | " + p.getBillingInterval() + " | " + p.getDurationDays() + "d";
    }

    /** Tiny holder to pass verified amount+currency through activation. */
    public record BigDecimalHolder(java.math.BigDecimal amount, String currency) {}

    public Map<String, Object> subscriptionView(OrganizationSubscription s, Instant now) {
        if (s == null) return Map.of("status", "NONE");
        String eff = effectiveStatus(s, now);
        java.util.Map<String, Object> m = new java.util.LinkedHashMap<>();
        m.put("id", s.getId());
        m.put("status", eff);
        m.put("raw_status", s.getStatus());
        m.put("plan_id", s.getPlanId());
        m.put("plan_snapshot", s.getPlanSnapshot());
        m.put("trial_start", s.getTrialStart() != null ? s.getTrialStart().toString() : null);
        m.put("trial_end", s.getTrialEnd() != null ? s.getTrialEnd().toString() : null);
        m.put("subscription_start", s.getSubscriptionStart() != null ? s.getSubscriptionStart().toString() : null);
        m.put("subscription_end", s.getSubscriptionEnd() != null ? s.getSubscriptionEnd().toString() : null);
        m.put("next_renewal_date", s.getNextRenewalDate() != null ? s.getNextRenewalDate().toString() : null);
        long daysLeft = -1;
        Instant end = "TRIALING".equals(eff) ? s.getTrialEnd() : s.getSubscriptionEnd();
        if (end != null && end.isAfter(now)) daysLeft = ChronoUnit.DAYS.between(now, end);
        m.put("days_remaining", daysLeft);
        m.put("entitled", "TRIALING".equals(eff) || "ACTIVE".equals(eff) || "PAST_DUE".equals(eff));
        return m;
    }

    public List<SubscriptionPayment> paymentsForOrg(String orgId) {
        return paymentRepo.findByOrganizationIdOrderByCreatedAtDesc(orgId);
    }
}
