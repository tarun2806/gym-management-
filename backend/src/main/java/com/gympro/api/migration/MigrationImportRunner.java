package com.gympro.api.migration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.io.File;
import java.nio.file.Files;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;

/**
 * One-shot Firestore→MySQL importer. Runs ONLY when
 * MIGRATION_IMPORT_DIR points at an export-firestore.mjs output directory.
 * Preserves document IDs; maps Firestore field names (org_id) to column
 * names (organization_id); inserts in FK-safe order. Idempotent-ish: skips
 * rows whose PK already exists (INSERT IGNORE).
 *
 * Firestore is never modified — rollback is simply not running this.
 */
@Component
@ConditionalOnProperty(name = "migration.import-dir")
public class MigrationImportRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(MigrationImportRunner.class);

    /** jsonKey -> column name. jsonKey null means take column name as-is. */
    private record TableSpec(String file, String table, Map<String, String> columns, int batchSize) {}

    private final JdbcTemplate jdbc;
    private final ObjectMapper mapper = new ObjectMapper();
    private final String importDir;

    public MigrationImportRunner(JdbcTemplate jdbc,
                                 @org.springframework.beans.factory.annotation.Value("${migration.import-dir}") String importDir) {
        this.jdbc = jdbc;
        this.importDir = importDir;
    }

    @Override
    public void run(ApplicationArguments args) throws Exception {
        File dir = new File(importDir);
        if (!dir.isDirectory()) {
            log.warn("MIGRATION_IMPORT_DIR '{}' is not a directory — skipping import", importDir);
            return;
        }

        // FK-safe order: identity/tenancy first, then dependents.
        List<TableSpec> specs = List.of(
                spec("users", "users"),
                spec("organizations", "organizations"),
                spec("organization_memberships", "organization_memberships"),
                spec("branches", "branches"),
                spec("membership_plans", "membership_plans"),
                spec("trainers", "trainers"),
                spec("members", "members"),
                spec("classes", "classes"),
                spec("class_bookings", "class_bookings"),
                spec("attendance", "attendance"),
                spec("payments", "payments"),
                spec("invoices", "invoices"),
                spec("expenses", "expenses"),
                spec("payroll", "payroll_entries"),
                spec("workout_plans", "workout_plans"),
                spec("diet_plans", "diet_plans"),
                spec("pt_packages", "pt_packages"),
                spec("pt_sessions", "pt_sessions"),
                spec("equipment", "equipment"),
                spec("products", "products"),
                spec("stock_movements", "stock_movements"),
                spec("settings", "settings"),
                spec("system_logs", "system_logs"),
                spec("notifications", "notifications")
        );

        int grandTotal = 0;
        for (TableSpec spec : specs) {
            File f = new File(dir, spec.file() + ".json");
            if (!f.exists()) continue;
            JsonNode rows = mapper.readTree(Files.readString(f.toPath()));
            int inserted = importTable(spec, rows);
            grandTotal += inserted;
            log.info("Imported {} -> {} ({} rows read)", spec.table(), inserted, rows.size());
        }
        log.info("Migration import complete: {} rows", grandTotal);
    }

    private int importTable(TableSpec spec, JsonNode rows) {
        if (!rows.isArray() || rows.isEmpty()) return 0;
        // Collect columns present in data, intersect with spec mapping.
        Set<String> jsonKeys = new LinkedHashSet<>();
        rows.forEach(r -> r.fieldNames().forEachRemaining(jsonKeys::add));

        List<String> cols = new ArrayList<>();
        List<String> colNames = new ArrayList<>();
        for (String jk : jsonKeys) {
            String col = spec.columns().getOrDefault(jk, jk);
            cols.add(jk);
            colNames.add(col);
        }
        String sql = "INSERT IGNORE INTO " + spec.table() + " (" + String.join(",", colNames) + ") VALUES ("
                + String.join(",", Collections.nCopies(colNames.size(), "?")) + ")";

        int count = 0;
        List<Object[]> batch = new ArrayList<>();
        for (JsonNode row : rows) {
            Object[] vals = new Object[cols.size()];
            for (int i = 0; i < cols.size(); i++) {
                vals[i] = normalize(row.get(cols.get(i)));
            }
            batch.add(vals);
            if (batch.size() >= spec.batchSize()) {
                jdbc.batchUpdate(sql, batch);
                count += batch.size();
                batch.clear();
            }
        }
        if (!batch.isEmpty()) {
            jdbc.batchUpdate(sql, batch);
            count += batch.size();
        }
        return count;
    }

    /** Convert JSON values to JDBC-friendly types. */
    private Object normalize(JsonNode node) {
        if (node == null || node.isNull()) return null;
        if (node.isTextual()) {
            String s = node.asText();
            // ISO datetime -> MySQL 'YYYY-MM-DD HH:MM:SS[.SSS]'
            if (s.matches("\\d{4}-\\d{2}-\\d{2}T.*")) {
                try {
                    return LocalDateTime.parse(s.replace("Z", ""),
                            DateTimeFormatter.ISO_LOCAL_DATE_TIME);
                } catch (DateTimeParseException e) {
                    return s;
                }
            }
            if (s.matches("\\d{4}-\\d{2}-\\d{2}")) {
                try {
                    return LocalDate.parse(s);
                } catch (DateTimeParseException e) {
                    return s;
                }
            }
            return s;
        }
        if (node.isBoolean()) return node.asBoolean();
        if (node.isInt() || node.isLong()) return node.asLong();
        if (node.isDouble() || node.isFloat() || node.isBigDecimal()) return node.decimalValue();
        if (node.isObject() || node.isArray()) return node.toString(); // JSON column
        return node.asText();
    }

    private static TableSpec spec(String file, String table) {
        // Firestore field -> MySQL column renames needed across all tables.
        Map<String, String> map = new HashMap<>();
        map.put("org_id", "organization_id");
        map.put("read", "read_flag");
        map.put("condition", "equipment_condition");
        map.put("uid", "user_id");
        return new TableSpec(file, table, map, 200);
    }
}
