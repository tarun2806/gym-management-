package com.gympro.api.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * In-memory fixed-window rate limiter for authentication-adjacent endpoints.
 * Limits are per client IP + endpoint. Suitable for single-instance
 * deployments; put an edge limiter (nginx/Cloudflare) in front for multi-node.
 * Raw tokens are never logged — only method+path and the client IP hash.
 */
@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private record Bucket(AtomicInteger count, Instant windowStart) {}

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();
    private final int maxRequests;
    private final long windowSeconds;
    private final String trustedProxies;

    public RateLimitFilter(
            @Value("${app.ratelimit.max-requests:20}") int maxRequests,
            @Value("${app.ratelimit.window-seconds:60}") long windowSeconds,
            @Value("${app.ratelimit.trusted-proxies:}") String trustedProxies) {
        this.maxRequests = maxRequests;
        this.windowSeconds = windowSeconds;
        this.trustedProxies = trustedProxies;
    }

    private static final String[] LIMITED = {
            "/api/owner/validate-key", "/api/owner/register",
            "/api/member-invitations/redeem",
            "/api/payments/gateway/verify"
    };

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res,
                                    FilterChain chain) throws ServletException, IOException {
        if (!isLimited(req)) {
            chain.doFilter(req, res);
            return;
        }
        String key = clientIp(req) + "|" + req.getRequestURI();
        Instant now = Instant.now();
        Bucket b = buckets.compute(key, (k, old) -> {
            if (old == null || old.windowStart().plusSeconds(windowSeconds).isBefore(now)) {
                return new Bucket(new AtomicInteger(0), now);
            }
            return old;
        });
        if (b.count().incrementAndGet() > maxRequests) {
            long retryAfter = windowSeconds - java.time.Duration.between(b.windowStart(), now).getSeconds();
            res.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            res.setHeader("Retry-After", String.valueOf(Math.max(1, retryAfter)));
            res.setContentType("application/json");
            res.getWriter().write("{\"message\":\"Too many requests, try again later\"}");
            return;
        }
        chain.doFilter(req, res);
    }

    private boolean isLimited(HttpServletRequest req) {
        if (!"POST".equalsIgnoreCase(req.getMethod())) return false;
        String path = req.getRequestURI();
        for (String p : LIMITED) if (path.equals(p) || path.startsWith(p + "/")) return true;
        // member-invitations redeem is under /api/member-invitations/redeem
        return path.equals("/api/member-invitations/redeem");
    }

    private String clientIp(HttpServletRequest req) {
        // Trust X-Forwarded-For only when the direct peer is a configured proxy.
        String remote = req.getRemoteAddr();
        boolean trusted = trustedProxies != null && !trustedProxies.isBlank()
                && java.util.Arrays.asList(trustedProxies.split(",")).contains(remote);
        if (trusted) {
            String xff = req.getHeader("X-Forwarded-For");
            if (xff != null && !xff.isBlank()) {
                return xff.split(",")[0].trim();
            }
        }
        return remote;
    }
}
