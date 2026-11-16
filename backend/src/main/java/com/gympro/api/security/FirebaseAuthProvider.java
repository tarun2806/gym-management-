package com.gympro.api.security;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.FileInputStream;
import java.util.List;

/**
 * Verifies Firebase ID tokens via the Admin SDK.
 *
 * Credential resolution order:
 *  1. firebase.service-account-path -> service account JSON file
 *  2. Application Default Credentials
 * If none are available the provider stays disabled and all token
 * verification fails closed (requests are rejected).
 */
@Component
public class FirebaseAuthProvider {

    private static final Logger log = LoggerFactory.getLogger(FirebaseAuthProvider.class);

    @Value("${firebase.project-id:}")
    private String projectId;

    @Value("${firebase.service-account-path:}")
    private String serviceAccountPath;

    private FirebaseAuth firebaseAuth;

    @PostConstruct
    void init() {
        try {
            if (FirebaseApp.getApps().isEmpty()) {
                FirebaseOptions.Builder builder = FirebaseOptions.builder();
                if (serviceAccountPath != null && !serviceAccountPath.isBlank()) {
                    builder.setCredentials(
                            GoogleCredentials.fromStream(new FileInputStream(serviceAccountPath)));
                } else {
                    builder.setCredentials(GoogleCredentials.getApplicationDefault());
                }
                if (projectId != null && !projectId.isBlank()) {
                    builder.setProjectId(projectId);
                }
                FirebaseApp.initializeApp(builder.build());
            }
            firebaseAuth = FirebaseAuth.getInstance();
            log.info("FirebaseAuthProvider initialized (projectId={})", projectId);
        } catch (Exception e) {
            log.warn("Firebase Admin SDK not initialized — token verification disabled: {}", e.getMessage());
            firebaseAuth = null;
        }
    }

    /** Returns verified token claims, or null if invalid/disabled. */
    public FirebaseToken verify(String idToken) {
        if (firebaseAuth == null || idToken == null || idToken.isBlank()) {
            return null;
        }
        try {
            return firebaseAuth.verifyIdToken(idToken);
        } catch (Exception e) {
            log.debug("ID token verification failed: {}", e.getMessage());
            return null;
        }
    }

    @SuppressWarnings("unchecked")
    public static String roleClaim(FirebaseToken token) {
        Object role = token.getClaims().get("role");
        return role instanceof String s ? s : null;
    }

    public static List<?> membershipsClaim(FirebaseToken token) {
        Object m = token.getClaims().get("memberships");
        return m instanceof List<?> l ? l : List.of();
    }
}
