package com.gympro.api.platform;

import com.gympro.api.auth.OrgContextService;
import com.gympro.api.model.OwnerActivationKey;
import com.gympro.api.model.SystemLog;
import com.gympro.api.model.User;
import com.gympro.api.repository.OwnerActivationKeyRepository;
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

    public PlatformAdminController(OwnerActivationKeyRepository keyRepository,
                                   UserRepository userRepository,
                                   SystemLogRepository logRepository,
                                   OrgContextService orgContext) {
        this.keyRepository = keyRepository;
        this.userRepository = userRepository;
        this.logRepository = logRepository;
        this.orgContext = orgContext;
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
}
