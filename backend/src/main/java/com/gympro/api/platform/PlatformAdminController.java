package com.gympro.api.platform;

import com.gympro.api.auth.OrgContextService;
import com.gympro.api.model.OwnerActivationKey;
import com.gympro.api.model.SystemLog;
import com.gympro.api.model.User;
import com.gympro.api.model.Organization;
import com.gympro.api.model.OrganizationSubscription;
import com.gympro.api.model.SubscriptionEvent;
import com.gympro.api.model.SubscriptionPayment;
import com.gympro.api.model.SubscriptionPlan;
import com.gympro.api.repository.BranchRepository;
import com.gympro.api.repository.OrganizationMembershipRepository;
import com.gympro.api.repository.OrganizationRepository;
import com.gympro.api.repository.OrganizationSubscriptionRepository;
import com.gympro.api.repository.OwnerActivationKeyRepository;
import com.gympro.api.repository.SubscriptionEventRepository;
import com.gympro.api.repository.SubscriptionPaymentRepository;
import com.gympro.api.repository.SubscriptionPlanRepository;
import com.gympro.api.subscription.SubscriptionService;
import com.gympro.api.repository.SystemLogRepository;
import com.gympro.api.repository.UserRepository;
import com.gympro.api.security.AppUserPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/** Platform-level administration — activation key lifecycle. */
@RestController
@RequestMapping("/api/platform")
public class PlatformAdminController {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final int KEY_TTL_DAYS = 14;

    private final OwnerActivationKeyRepository keyRepository;
    private final UserRepository userRepository;
    private final SystemLogRepository logRepository;
    private final OrgContextService orgContext;
    private final OrganizationRepository organizationRepository;
    private final OrganizationMembershipRepository membershipRepository;
    private final BranchRepository branchRepository;
    private final OrganizationSubscriptionRepository subscriptionRepository;
    private final SubscriptionPlanRepository planRepository;
    private final SubscriptionPaymentRepository subscriptionPaymentRepository;
    private final SubscriptionEventRepository subscriptionEventRepository;
    private final SubscriptionService subscriptionService;

    public PlatformAdminController(OwnerActivationKeyRepository keyRepository,
                                   UserRepository userRepository,
                                   SystemLogRepository logRepository,
                                   OrgContextService orgContext,
                                   OrganizationRepository organizationRepository,
                                   OrganizationMembershipRepository membershipRepository,
                                   BranchRepository branchRepository,
                                   OrganizationSubscriptionRepository subscriptionRepository,
                                   SubscriptionPlanRepository planRepository,
                                   SubscriptionPaymentRepository subscriptionPaymentRepository,
                                   SubscriptionEventRepository subscriptionEventRepository,
                                   SubscriptionService subscriptionService) {
        this.keyRepository = keyRepository;
        this.userRepository = userRepository;
        this.logRepository = logRepository;
        this.orgContext = orgContext;
        this.organizationRepository = organizationRepository;
        this.membershipRepository = membershipRepository;
        this.branchRepository = branchRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.planRepository = planRepository;
        this.subscriptionPaymentRepository = subscriptionPaymentRepository;
        this.subscriptionEventRepository = subscriptionEventRepository;
        this.subscriptionService = subscriptionService;
    }

    private void requirePlatformAdmin() {
        AppUserPrincipal p = orgContext.principal();
        boolean admin = userRepository.findById(p.uid())
                .map(User::isPlatformAdmin).orElse(false);
        if (!admin) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "platform admin required");
        }
    }

    private void audit(String action, String detail) {
        SystemLog log = new SystemLog();
        log.setId(UUID.randomUUID().toString());
        log.setLevel("info");
        log.setAction(action);
        log.setMessage(detail);
        log.setUserId(orgContext.principal().uid());
        log.setCreatedAt(Instant.now());
        logRepository.save(log);
    }

    /** Issue a new owner activation key — raw token returned ONCE. */
    @PostMapping("/activation-keys")
    public Map<String, Object> createKey(@RequestBody(required = false) Map<String, Object> body) {
        requirePlatformAdmin();
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        String raw = "gympro_own_" + Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        String hash = sha256(raw);

        OwnerActivationKey k = new OwnerActivationKey();
        k.setId(UUID.randomUUID().toString());
        k.setKeyHash(hash);
        k.setLabel(body != null && body.get("label") != null ? String.valueOf(body.get("label")) : null);
        k.setCreatedBy(orgContext.principal().uid());
        k.setExpiresAt(Instant.now().plus(KEY_TTL_DAYS, ChronoUnit.DAYS));
        keyRepository.save(k);
        audit("platform.activation_key_created", "key " + k.getId());

        // Raw key shown exactly once — only the hash is stored.
        return Map.of("id", k.getId(), "key", raw, "expires_at", k.getExpiresAt().toString());
    }

    /** List key metadata — never includes hashes or raw tokens. */
    @GetMapping("/activation-keys")
    public List<Map<String, Object>> listKeys() {
        requirePlatformAdmin();
        return keyRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(k -> Map.<String, Object>of(
                        "id", k.getId(),
                        "label", k.getLabel() != null ? k.getLabel() : "",
                        "created_by", k.getCreatedBy(),
                        "created_at", k.getCreatedAt().toString(),
                        "expires_at", k.getExpiresAt().toString(),
                        "redeemed", k.getRedeemedAt() != null,
                        "redeemed_by", k.getRedeemedBy() != null ? k.getRedeemedBy() : "",
                        "revoked", k.getRevokedAt() != null))
                .toList();
    }

    @PostMapping("/activation-keys/{id}/revoke")
    public Map<String, Object> revoke(@PathVariable String id) {
        requirePlatformAdmin();
        OwnerActivationKey k = keyRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (k.getRedeemedAt() != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "key already redeemed");
        }
        k.setRevokedAt(Instant.now());
        keyRepository.save(k);
        audit("platform.activation_key_revoked", "key " + id);
        return Map.of("id", id, "revoked", true);
    }

    public static String sha256(String input) {
        try {
            var md = java.security.MessageDigest.getInstance("SHA-256");
            byte[] d = md.digest(input.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(64);
            for (byte b : d) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    // ── Subscription plans ─────────────────────────────────────────────────

    @GetMapping("/subscription-plans")
    public List<SubscriptionPlan> listPlans() {
        requirePlatformAdmin();
        return planRepository.findAllByOrderByCreatedAtDesc();
    }

    @PostMapping("/subscription-plans")
    public SubscriptionPlan createPlan(@RequestBody Map<String, Object> body) {
        requirePlatformAdmin();
        SubscriptionPlan p = new SubscriptionPlan();
        p.setId(UUID.randomUUID().toString());
        p.setName(str(body, "name"));
        p.setDescription(str(body, "description"));
        p.setAnnualPrice(new java.math.BigDecimal(String.valueOf(body.getOrDefault("annual_price", "0"))));
        p.setCurrency(strOr(body, "currency", "INR"));
        p.setBillingInterval(strOr(body, "billing_interval", "YEARLY"));
        p.setDurationDays(intVal(body, "duration_days", 365));
        p.setTrialEligible(!Boolean.FALSE.equals(body.get("trial_eligible")));
        p.setFeatures(str(body, "features"));
        p.setStatus(strOr(body, "status", "active"));
        p.setCreatedAt(Instant.now());
        p.setUpdatedAt(Instant.now());
        if (p.getName() == null || p.getName().isBlank() || p.getAnnualPrice().signum() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "name and non-negative annual_price required");
        }
        SubscriptionPlan saved = planRepository.save(p);
        audit("platform.plan_created", "plan=" + saved.getId() + " " + saved.getName());
        return saved;
    }

    @PutMapping("/subscription-plans/{id}")
    public SubscriptionPlan updatePlan(@PathVariable String id, @RequestBody Map<String, Object> body) {
        requirePlatformAdmin();
        SubscriptionPlan p = planRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        // Price changes apply to FUTURE subscriptions only — existing
        // subscriptions keep their plan_snapshot.
        if (body.containsKey("name")) p.setName(str(body, "name"));
        if (body.containsKey("description")) p.setDescription(str(body, "description"));
        if (body.containsKey("annual_price"))
            p.setAnnualPrice(new java.math.BigDecimal(String.valueOf(body.get("annual_price"))));
        if (body.containsKey("currency")) p.setCurrency(str(body, "currency"));
        if (body.containsKey("duration_days")) p.setDurationDays(intVal(body, "duration_days", p.getDurationDays()));
        if (body.containsKey("trial_eligible")) p.setTrialEligible(Boolean.TRUE.equals(body.get("trial_eligible")));
        if (body.containsKey("features")) p.setFeatures(str(body, "features"));
        if (body.containsKey("status")) p.setStatus(str(body, "status"));
        p.setUpdatedAt(Instant.now());
        SubscriptionPlan saved = planRepository.save(p);
        audit("platform.plan_updated", "plan=" + id);
        return saved;
    }

    // ── Organizations ──────────────────────────────────────────────────────

    @GetMapping("/organizations")
    public List<Map<String, Object>> listOrganizations() {
        requirePlatformAdmin();
        Instant now = Instant.now();
        return organizationRepository.findAll().stream().map(o -> {
            Map<String, Object> m = new java.util.LinkedHashMap<>();
            m.put("id", o.getId());
            m.put("name", o.getName());
            m.put("slug", o.getSlug());
            m.put("status", o.getStatus());
            m.put("created_at", o.getCreatedAt() != null ? o.getCreatedAt().toString() : null);
            subscriptionRepository.findByOrganizationId(o.getId()).ifPresent(s ->
                    m.put("subscription", subscriptionService.subscriptionView(s, now)));
            return m;
        }).toList();
    }

    @GetMapping("/organizations/{id}")
    public Map<String, Object> organizationDetails(@PathVariable String id) {
        requirePlatformAdmin();
        Organization o = organizationRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        Map<String, Object> m = new java.util.LinkedHashMap<>();
        m.put("id", o.getId());
        m.put("name", o.getName());
        m.put("slug", o.getSlug());
        m.put("status", o.getStatus());
        m.put("owner_id", o.getOwnerId());
        m.put("created_at", o.getCreatedAt() != null ? o.getCreatedAt().toString() : null);
        m.put("owners", membershipRepository.findByOrganizationId(id).stream()
                .filter(x -> "org_owner".equals(x.getRole()) || "org_admin".equals(x.getRole()))
                .map(x -> Map.of("user_id", x.getUserId(), "role", x.getRole()))
                .toList());
        m.put("branches", branchRepository.findByOrganizationId(id).stream()
                .map(b -> Map.of("id", b.getId(), "name", b.getName(), "status", b.getStatus()))
                .toList());
        subscriptionRepository.findByOrganizationId(id).ifPresent(s ->
                m.put("subscription", subscriptionService.subscriptionView(s, Instant.now())));
        m.put("payments", subscriptionPaymentRepository
                .findByOrganizationIdOrderByCreatedAtDesc(id).stream()
                .map(this::paymentView).toList());
        m.put("events", subscriptionEventRepository
                .findByOrganizationIdOrderByCreatedAtDesc(id).stream()
                .limit(50).map(this::eventView).toList());
        return m;
    }

    @PostMapping("/organizations/{id}/suspend")
    public Map<String, Object> suspend(@PathVariable String id, @RequestBody Map<String, Object> body) {
        requirePlatformAdmin();
        Organization o = organizationRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        o.setStatus("suspended");
        o.setUpdatedAt(Instant.now());
        organizationRepository.save(o);
        String reason = str(body, "reason");
        subscriptionRepository.findByOrganizationId(id).ifPresent(s -> {
            s.setStatus("SUSPENDED");
            s.setUpdatedAt(Instant.now());
            subscriptionRepository.save(s);
        });
        audit("platform.org_suspended", "org=" + id + " reason=" + (reason != null ? reason : ""));
        return Map.of("id", id, "status", "suspended");
    }

    @PostMapping("/organizations/{id}/reactivate")
    public Map<String, Object> reactivate(@PathVariable String id) {
        requirePlatformAdmin();
        Organization o = organizationRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        o.setStatus("active");
        o.setUpdatedAt(Instant.now());
        organizationRepository.save(o);
        audit("platform.org_reactivated", "org=" + id);
        return Map.of("id", id, "status", "active");
    }

    // ── Metrics ────────────────────────────────────────────────────────────

    @GetMapping("/metrics")
    public Map<String, Object> metrics() {
        requirePlatformAdmin();
        Instant now = Instant.now();
        long totalOrgs = organizationRepository.count();
        long suspended = organizationRepository.findAll().stream()
                .filter(o -> "suspended".equals(o.getStatus())).count();
        long trialing = 0, activeSub = 0, expired = 0, trialsExpiringSoon = 0, renewalsDueSoon = 0;
        java.math.BigDecimal revenue = java.math.BigDecimal.ZERO;
        Instant soon7 = now.plus(7, java.time.temporal.ChronoUnit.DAYS);
        for (OrganizationSubscription s : subscriptionRepository.findAll()) {
            String eff = subscriptionService.effectiveStatus(s, now);
            if ("TRIALING".equals(eff)) {
                trialing++;
                if (s.getTrialEnd() != null && s.getTrialEnd().isBefore(soon7)) trialsExpiringSoon++;
            } else if ("ACTIVE".equals(eff) || "PAST_DUE".equals(eff)) {
                activeSub++;
                if (s.getNextRenewalDate() != null && s.getNextRenewalDate().isBefore(soon7)) renewalsDueSoon++;
            } else if ("EXPIRED".equals(eff)) {
                expired++;
            }
        }
        revenue = subscriptionPaymentRepository.findAll().stream()
                .filter(p -> "completed".equals(p.getStatus()) && p.getAmount() != null)
                .map(SubscriptionPayment::getAmount)
                .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);
        long owners = membershipRepository.findAll().stream()
                .filter(m -> "org_owner".equals(m.getRole())).count();
        return Map.of(
                "total_organizations", totalOrgs,
                "active_organizations", totalOrgs - suspended,
                "suspended_organizations", suspended,
                "trialing", trialing,
                "active_subscriptions", activeSub,
                "expired_subscriptions", expired,
                "trials_expiring_soon", trialsExpiringSoon,
                "renewals_due_soon", renewalsDueSoon,
                "total_gym_owners", owners,
                "verified_revenue", revenue);
    }

    private Map<String, Object> paymentView(SubscriptionPayment p) {
        Map<String, Object> m = new java.util.LinkedHashMap<>();
        m.put("id", p.getId());
        m.put("amount", p.getAmount());
        m.put("currency", p.getCurrency());
        m.put("status", p.getStatus());
        m.put("purpose", p.getPurpose());
        m.put("period_start", p.getPeriodStart() != null ? p.getPeriodStart().toString() : null);
        m.put("period_end", p.getPeriodEnd() != null ? p.getPeriodEnd().toString() : null);
        m.put("created_at", p.getCreatedAt() != null ? p.getCreatedAt().toString() : null);
        return m;
    }

    private Map<String, Object> eventView(SubscriptionEvent e) {
        Map<String, Object> m = new java.util.LinkedHashMap<>();
        m.put("id", e.getId());
        m.put("event_type", e.getEventType());
        m.put("actor_id", e.getActorId());
        m.put("detail", e.getDetail());
        m.put("created_at", e.getCreatedAt() != null ? e.getCreatedAt().toString() : null);
        return m;
    }

    private static String str(Map<String, Object> b, String k) {
        Object v = b.get(k);
        return v != null ? v.toString() : null;
    }
    private static String strOr(Map<String, Object> b, String k, String def) {
        String v = str(b, k);
        return v != null && !v.isBlank() ? v : def;
    }
    private static int intVal(Map<String, Object> b, String k, int def) {
        Object v = b.get(k);
        if (v == null) return def;
        try { return Integer.parseInt(v.toString()); } catch (NumberFormatException e) { return def; }
    }

}
