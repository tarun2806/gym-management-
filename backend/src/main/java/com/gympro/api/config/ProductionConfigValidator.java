package com.gympro.api.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * Fail-fast validation of required production configuration. Only runs when
 * the "production" Spring profile is active — dev/test startup is unaffected.
 * Never logs secret values, only variable names.
 */
@Component
public class ProductionConfigValidator implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(ProductionConfigValidator.class);

    private final Environment env;
    private final String firebaseProjectId;
    private final String firebaseSaPath;
    private final String corsOrigins;
    private final String dbUrl;

    public ProductionConfigValidator(Environment env,
                                     @Value("${firebase.project-id:}") String firebaseProjectId,
                                     @Value("${firebase.service-account-path:}") String firebaseSaPath,
                                     @Value("${app.cors.allowed-origins:}") String corsOrigins,
                                     @Value("${spring.datasource.url:}") String dbUrl) {
        this.env = env;
        this.firebaseProjectId = firebaseProjectId;
        this.firebaseSaPath = firebaseSaPath;
        this.corsOrigins = corsOrigins;
        this.dbUrl = dbUrl;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!env.acceptsProfiles(Profiles.of("production"))) return;
        List<String> missing = new ArrayList<>();
        if (isBlank(firebaseProjectId)) missing.add("FIREBASE_PROJECT_ID");
        if (isBlank(firebaseSaPath)) missing.add("FIREBASE_SERVICE_ACCOUNT_PATH");
        if (isBlank(corsOrigins) || corsOrigins.contains("localhost"))
            missing.add("CORS_ALLOWED_ORIGINS (must be a real production origin)");
        if (isBlank(dbUrl) || dbUrl.contains("localhost"))
            missing.add("DB_URL (must not be localhost in production)");
        if (missing.isEmpty()) {
            log.info("Production configuration validated");
            return;
        }
        throw new IllegalStateException(
                "Missing/invalid production configuration: " + String.join(", ", missing));
    }

    private static boolean isBlank(String s) { return s == null || s.isBlank(); }
}
