package com.gympro.api.subscription;

import com.gympro.api.auth.OrgContextService;
import com.gympro.api.model.OrganizationMembership;
import com.gympro.api.model.OrganizationSubscription;
import com.gympro.api.model.SubscriptionPlan;
import com.gympro.api.repository.OrganizationMembershipRepository;
import com.gympro.api.repository.OrganizationSubscriptionRepository;
import com.gympro.api.repository.SubscriptionPaymentRepository;
import com.gympro.api.repository.SubscriptionPlanRepository;
import com.gympro.api.security.AppUserPrincipal;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Owner-facing subscription APIs. The organization is always resolved from
 * the caller's org_owner membership — never from client input. Amounts come
 * from the plan record, never the request body.
 */
@RestController
public class SubscriptionController {

    private final OrganizationMembershipRepository membershipRepo;
    private final OrganizationSubscriptionRepository subRepo;
    private final SubscriptionPlanRepository planRepo;
    private final SubscriptionPaymentRepository paymentRepo;
    private final SubscriptionService subscriptionService;
    private final OrgContextService orgContext;
    private final RazorpayClient razorpay;
    private final String keySecret;

    public SubscriptionController(OrganizationMembershipRepository membershipRepo,
                                  OrganizationSubscriptionRepository subRepo,
                                  SubscriptionPlanRepository planRepo,
                                  SubscriptionPaymentRepository paymentRepo,
                                  SubscriptionService subscriptionService,
                                  OrgContextService orgContext,
                                  @Value("${razorpay.key-id:}") String keyId,
                                  @Value("${razorpay.key-secret:}") String keySecret) {
        this.membershipRepo = membershipRepo;
        this.subRepo = subRepo;
        this.planRepo = planRepo;
        this.paymentRepo = paymentRepo;
        this.subscriptionService = subscriptionService;
        this.orgContext = orgContext;
        this.keySecret = keySecret;
        RazorpayClient client = null;
        if (keyId != null && !keyId.isBlank() && keySecret != null && !keySecret.isBlank()) {
            try { client = new RazorpayClient(keyId, keySecret); }
            catch (RazorpayException ignored) { }
        }
        this.razorpay = client;
    }

    /**
     * The caller's owned organization. Prefers X-Org-Id when the caller is
     * org_owner of that org so multi-org owners cannot charge the wrong gym.
     */
    private String ownerOrgId() {
        AppUserPrincipal p = orgContext.principal();
        List<OrganizationMembership> owned = membershipRepo.findByUserIdAndStatus(p.uid(), "active")
                .stream()
                .filter(m -> "org_owner".equals(m.getRole()))
                .toList();
        if (owned.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "organization owner required");
        }
        jakarta.servlet.http.HttpServletRequest req =
                ((org.springframework.web.context.request.ServletRequestAttributes)
                        org.springframework.web.context.request.RequestContextHolder.currentRequestAttributes())
                        .getRequest();
        String header = req.getHeader("X-Org-Id");
        if (header != null && !header.isBlank()) {
            return owned.stream()
                    .map(OrganizationMembership::getOrganizationId)
                    .filter(header::equals)
                    .findFirst()
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN,
                            "organization owner required"));
        }
        if (owned.size() > 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "X-Org-Id required");
        }
        return owned.get(0).getOrganizationId();
    }

    @GetMapping("/api/me/subscription")
    public Map<String, Object> mySubscription() {
        String orgId = ownerOrgId();
        OrganizationSubscription s = subRepo.findByOrganizationId(orgId).orElse(null);
        Map<String, Object> view = subscriptionService.subscriptionView(s, Instant.now());
        view.put("payments", subscriptionService.paymentsForOrg(orgId).stream()
                .map(this::paymentView).toList());
        return view;
    }

    /** Public plan catalog for the marketing pricing page — no sensitive data. */
    @GetMapping("/api/subscription/plans")
    public List<SubscriptionPlan> plans() {
        return planRepo.findByStatus("active");
    }

    /** Create a Razorpay order for an annual plan — amount from plan record. */
    @PostMapping("/api/subscription/checkout")
    public Map<String, Object> checkout(@RequestBody Map<String, Object> body) {
        String orgId = ownerOrgId();
        if (razorpay == null) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Payment gateway not configured");
        }
        String planId = String.valueOf(body.getOrDefault("plan_id", ""));
        SubscriptionPlan plan = planRepo.findById(planId)
                .filter(p -> "active".equals(p.getStatus()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "plan not found"));
        try {
            JSONObject options = new JSONObject();
            // Amount is server-side from the plan — never client input.
            options.put("amount", plan.getAnnualPrice().movePointRight(2).intValueExact());
            options.put("currency", plan.getCurrency());
            JSONObject notes = new JSONObject();
            notes.put("org_id", orgId);
            notes.put("plan_id", plan.getId());
            notes.put("purpose", "subscription");
            options.put("notes", notes);
            Order order = razorpay.orders.create(options);
            String orderId = order.get("id");
            subscriptionService.recordPendingPayment(orgId, plan.getId(), orderId,
                    plan.getAnnualPrice(), plan.getCurrency());
            return Map.of("order_id", orderId, "amount", plan.getAnnualPrice(),
                    "currency", plan.getCurrency(), "plan_id", plan.getId());
        } catch (RazorpayException e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Order creation failed");
        }
    }

    /**
     * Verify checkout signature + fetch order status from Razorpay, then
     * activate/extend the subscription atomically. Idempotent on
     * razorpay_payment_id — replayed callbacks cannot extend twice.
     */
    @PostMapping("/api/subscription/verify")
    @Transactional
    public Map<String, Object> verify(@RequestBody Map<String, Object> body) {
        String orgId = ownerOrgId();
        if (razorpay == null || keySecret == null || keySecret.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Payment gateway not configured");
        }
        String orderId = str(body, "razorpay_order_id");
        String paymentId = str(body, "razorpay_payment_id");
        String signature = str(body, "razorpay_signature");
        if (orderId == null || paymentId == null || signature == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing payment fields");
        }
        if (!hmacEquals(orderId + "|" + paymentId, signature, keySecret)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid payment signature");
        }
        if (subscriptionService.paymentAlreadyProcessed(paymentId)) {
            return Map.of("status", "already_processed");
        }
        // Confirm the order belongs to this org and is actually paid.
        var pending = paymentRepo.findByRazorpayOrderId(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "unknown order"));
        if (!pending.getOrganizationId().equals(orgId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "order belongs to another organization");
        }
        try {
            com.razorpay.Payment rp = razorpay.payments.fetch(paymentId);
            if (!"captured".equals(rp.toJson().optString("status"))) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "payment not captured");
            }
        } catch (RazorpayException e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Could not verify payment with gateway");
        }
        String planId = pending.getPlanId();
        if (planId == null) planId = str(body, "plan_id");
        var holder = new SubscriptionService.BigDecimalHolder(pending.getAmount(), pending.getCurrency());
        subscriptionService.activatePaidSubscription(orgId, planId, orderId, paymentId,
                holder, orgContext.principal().uid());
        return Map.of("status", "activated");
    }

    private Map<String, Object> paymentView(com.gympro.api.model.SubscriptionPayment p) {
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

    private static boolean hmacEquals(String data, String signature, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            String expected = HexFormat.of().formatHex(mac.doFinal(data.getBytes(StandardCharsets.UTF_8)));
            return MessageDigest.isEqual(expected.getBytes(), signature.getBytes());
        } catch (Exception e) {
            return false;
        }
    }

    private static String str(Map<String, Object> b, String k) {
        Object v = b.get(k);
        return v != null ? v.toString() : null;
    }
}
