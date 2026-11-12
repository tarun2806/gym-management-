package com.gympro.api.payments;

import com.gympro.api.auth.OrgContextService;
import com.gympro.api.model.Payment;
import com.gympro.api.repository.PaymentRepository;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Map;
import java.util.UUID;

/**
 * Razorpay gateway — port of the fixed Express endpoints.
 * create-order: org-scoped, amount validated.
 * verify: checkout signature verified BEFORE trusting the payload, order↔payment
 *         match enforced, idempotent on razorpay_payment_id.
 * webhook: raw-body HMAC verified, idempotent writes.
 */
@RestController
@RequestMapping("/api/payments/gateway")
public class PaymentGatewayController {

    private final PaymentRepository paymentRepository;
    private final OrgContextService orgContext;
    private final RazorpayClient razorpay;
    private final String webhookSecret;
    private final String keySecret;

    public PaymentGatewayController(PaymentRepository paymentRepository,
                                    OrgContextService orgContext,
                                    @Value("${razorpay.key-id:}") String keyId,
                                    @Value("${razorpay.key-secret:}") String keySecret,
                                    @Value("${razorpay.webhook-secret:}") String webhookSecret) {
        this.paymentRepository = paymentRepository;
        this.orgContext = orgContext;
        this.webhookSecret = webhookSecret;
        this.keySecret = keySecret;
        RazorpayClient client = null;
        if (keyId != null && !keyId.isBlank() && keySecret != null && !keySecret.isBlank()) {
            try {
                client = new RazorpayClient(keyId, keySecret);
            } catch (RazorpayException e) {
                // Gateway disabled until keys are configured.
            }
        }
        this.razorpay = client;
    }

    @PostMapping("/create-order")
    public ResponseEntity<?> createOrder(@RequestHeader("X-Org-Id") String orgId,
                                         @RequestBody Map<String, Object> body) {
        orgContext.requireMembership(orgId);
        if (razorpay == null) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Payment gateway not configured");
        }
        BigDecimal amount = dec(body.get("amount"));
        if (amount == null || amount.signum() <= 0 || amount.compareTo(new BigDecimal("100000")) > 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid amount");
        }
        try {
            JSONObject options = new JSONObject();
            options.put("amount", amount.multiply(new BigDecimal("100")).intValueExact());
            options.put("currency", strOr(body, "currency", "INR"));
            JSONObject notes = new JSONObject();
            notes.put("org_id", orgId);
            notes.put("user_id", orgContext.principal().uid());
            if (body.get("member_id") != null) notes.put("member_id", body.get("member_id").toString());
            options.put("notes", notes);
            Order order = razorpay.orders.create(options);
            return ResponseEntity.ok(order.toJson().toMap());
        } catch (RazorpayException e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Order creation failed");
        }
    }

    @PostMapping("/verify")
    public ResponseEntity<?> verify(@RequestHeader("X-Org-Id") String orgId,
                                    @RequestBody Map<String, Object> body) {
        orgContext.requireMembership(orgId);
        if (razorpay == null) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Payment gateway not configured");
        }
        String orderId = str(body, "razorpay_order_id");
        String paymentId = str(body, "razorpay_payment_id");
        String signature = str(body, "razorpay_signature");
        if (orderId == null || paymentId == null || signature == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing payment fields");
        }

        // Verify the checkout signature before trusting anything:
        // HMAC-SHA256 of "order_id|payment_id" keyed with the API secret.
        if (keySecret == null || keySecret.isBlank()
                || !hmacEquals(orderId + "|" + paymentId, signature, keySecret)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid payment signature");
        }

        // Idempotent: same razorpay_payment_id → same payment doc.
        var existing = paymentRepository.findByRazorpayPaymentId(paymentId);
        if (existing.isPresent()) {
            return ResponseEntity.ok(Map.of("paymentId", existing.get().getId(), "status", "already_recorded"));
        }

        try {
            com.razorpay.Payment razorpayPayment = razorpay.payments.fetch(paymentId);
            if (!"captured".equals(razorpayPayment.get("status"))) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payment not captured");
            }
            String rpOrderId = razorpayPayment.get("order_id") != null
                    ? razorpayPayment.get("order_id").toString() : null;
            if (!orderId.equals(rpOrderId)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Order mismatch");
            }

            Payment p = new Payment();
            p.setId(UUID.randomUUID().toString());
            p.setOrganizationId(orgId);
            p.setMemberId(str(body, "member_id"));
            p.setAmount(razorpayPayment.get("amount") != null
                    ? new BigDecimal(razorpayPayment.get("amount").toString()).divide(new BigDecimal("100"))
                    : BigDecimal.ZERO);
            p.setType("membership");
            p.setStatus("completed");
            p.setRazorpayOrderId(orderId);
            p.setRazorpayPaymentId(paymentId);
            p.setCreatedAt(Instant.now());
            paymentRepository.save(p);
            return ResponseEntity.ok(Map.of("paymentId", p.getId(), "status", "verified"));
        } catch (RazorpayException e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Payment verification failed");
        }
    }

    /** Razorpay webhook — public endpoint, HMAC-verified on raw body. */
    @PostMapping("/webhook")
    public ResponseEntity<?> webhook(@RequestBody String rawBody,
                                     @RequestHeader(value = "X-Razorpay-Signature", required = false) String signature) {
        if (webhookSecret == null || webhookSecret.isBlank()
                || !hmacEquals(rawBody, signature, webhookSecret)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid signature"));
        }
        try {
            JSONObject event = new JSONObject(rawBody);
            String eventType = event.optString("event");
            JSONObject entity = event.optJSONObject("payload") != null
                    ? event.getJSONObject("payload").optJSONObject("payment") != null
                    ? event.getJSONObject("payload").getJSONObject("payment").optJSONObject("entity")
                    : null : null;
            if (entity == null) return ResponseEntity.ok(Map.of("status", "ignored"));

            String razorpayPaymentId = entity.optString("id", null);
            if (razorpayPaymentId == null) return ResponseEntity.ok(Map.of("status", "ignored"));

            if ("payment.captured".equals(eventType)) {
                if (paymentRepository.findByRazorpayPaymentId(razorpayPaymentId).isEmpty()) {
                    Payment p = new Payment();
                    p.setId(UUID.randomUUID().toString());
                    JSONObject notes = entity.optJSONObject("notes");
                    p.setOrganizationId(notes != null ? notes.optString("org_id", null) : null);
                    p.setMemberId(notes != null ? notes.optString("member_id", null) : null);
                    p.setAmount(entity.has("amount")
                            ? new BigDecimal(entity.get("amount").toString()).divide(new BigDecimal("100"))
                            : BigDecimal.ZERO);
                    p.setType("membership");
                    p.setStatus("completed");
                    p.setRazorpayOrderId(entity.optString("order_id", null));
                    p.setRazorpayPaymentId(razorpayPaymentId);
                    p.setCreatedAt(Instant.now());
                    paymentRepository.save(p);
                }
            } else if ("payment.failed".equals(eventType)) {
                paymentRepository.findByRazorpayPaymentId(razorpayPaymentId).ifPresent(p -> {
                    p.setStatus("failed");
                    paymentRepository.save(p);
                });
            }
            return ResponseEntity.ok(Map.of("status", "processed"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Webhook processing failed"));
        }
    }

    private static boolean hmacEquals(String payload, String signature, String secret) {
        if (signature == null) return false;
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            String expected = HexFormat.of().formatHex(mac.doFinal(payload.getBytes(StandardCharsets.UTF_8)));
            return expected.equalsIgnoreCase(signature);
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            return false;
        }
    }

    private static String str(Map<String, Object> b, String k) {
        Object v = b.get(k);
        return v != null ? v.toString() : null;
    }

    private static String strOr(Map<String, Object> b, String k, String def) {
        String v = str(b, k);
        return v != null && !v.isBlank() ? v : def;
    }

    private static BigDecimal dec(Object v) {
        if (v == null) return null;
        try {
            return new BigDecimal(v.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
