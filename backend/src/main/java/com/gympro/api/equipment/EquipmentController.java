package com.gympro.api.equipment;

import com.gympro.api.auth.OrgContextService;
import com.gympro.api.model.Equipment;
import com.gympro.api.model.OrganizationMembership;
import com.gympro.api.repository.EquipmentRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/equipment")
public class EquipmentController {

    private final EquipmentRepository equipmentRepository;
    private final OrgContextService orgContext;

    public EquipmentController(EquipmentRepository equipmentRepository, OrgContextService orgContext) {
        this.equipmentRepository = equipmentRepository;
        this.orgContext = orgContext;
    }

    @GetMapping
    public List<Equipment> list(@RequestHeader("X-Org-Id") String orgId) {
        OrganizationMembership m = orgContext.requireOps(orgId);
        String branch = orgContext.readBranchScope(m);
        return branch != null
                ? equipmentRepository.findByOrganizationIdAndBranchId(orgId, branch)
                : equipmentRepository.findByOrganizationId(orgId);
    }

    @PostMapping
    public Equipment create(@RequestHeader("X-Org-Id") String orgId, @RequestBody Map<String, Object> body) {
        OrganizationMembership m = orgContext.requireRole(orgId, "org_owner", "org_admin", "branch_manager", "staff");
        Equipment e = new Equipment();
        e.setId(UUID.randomUUID().toString());
        e.setOrganizationId(orgId);
        e.setBranchId(orgContext.resolveBranchId(orgId, m, body.get("branch_id")));
        e.setName(str(body, "name"));
        e.setType(str(body, "type"));
        e.setBrand(str(body, "brand"));
        e.setModel(str(body, "model"));
        e.setLocation(str(body, "location"));
        e.setStatus(strOr(body, "status", "operational"));
        e.setEquipmentCondition(str(body, "condition"));
        e.setSerialNumber(str(body, "serial_number"));
        e.setPurchaseDate(date(body, "purchase_date"));
        e.setWarranty(str(body, "warranty"));
        e.setNotes(str(body, "notes"));
        e.setServiceIntervalDays(intVal(body, "service_interval_days"));
        e.setLastMaintenance(date(body, "last_maintenance"));
        e.setNextMaintenance(date(body, "next_maintenance"));
        e.setCreatedAt(Instant.now());
        if (e.getName() == null || e.getName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "name is required");
        }
        return equipmentRepository.save(e);
    }

    @PutMapping("/{id}")
    public Equipment update(@RequestHeader("X-Org-Id") String orgId,
                            @PathVariable String id,
                            @RequestBody Map<String, Object> body) {
        OrganizationMembership m = orgContext.requireRole(orgId, "org_owner", "org_admin", "branch_manager", "staff");
        Equipment e = equipmentRepository.findById(id)
                .filter(x -> x.getOrganizationId().equals(orgId))
                .filter(x -> orgContext.canSeeBranch(m, x.getBranchId()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (body.containsKey("name")) e.setName(str(body, "name"));
        if (body.containsKey("type")) e.setType(str(body, "type"));
        if (body.containsKey("brand")) e.setBrand(str(body, "brand"));
        if (body.containsKey("model")) e.setModel(str(body, "model"));
        if (body.containsKey("location")) e.setLocation(str(body, "location"));
        if (body.containsKey("status")) e.setStatus(str(body, "status"));
        if (body.containsKey("condition")) e.setEquipmentCondition(str(body, "condition"));
        if (body.containsKey("serial_number")) e.setSerialNumber(str(body, "serial_number"));
        if (body.containsKey("notes")) e.setNotes(str(body, "notes"));
        if (body.containsKey("service_interval_days")) e.setServiceIntervalDays(intVal(body, "service_interval_days"));
        if (body.containsKey("last_maintenance")) e.setLastMaintenance(date(body, "last_maintenance"));
        if (body.containsKey("next_maintenance")) e.setNextMaintenance(date(body, "next_maintenance"));
        return equipmentRepository.save(e);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@RequestHeader("X-Org-Id") String orgId, @PathVariable String id) {
        OrganizationMembership m = orgContext.requireRole(orgId, "org_owner", "org_admin");
        Equipment e = equipmentRepository.findById(id)
                .filter(x -> x.getOrganizationId().equals(orgId))
                .filter(x -> orgContext.canSeeBranch(m, x.getBranchId()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        equipmentRepository.delete(e);
        return ResponseEntity.noContent().build();
    }

    private static String str(Map<String, Object> b, String k) {
        Object v = b.get(k);
        return v != null ? v.toString() : null;
    }

    private static String strOr(Map<String, Object> b, String k, String def) {
        String v = str(b, k);
        return v != null && !v.isBlank() ? v : def;
    }

    private static LocalDate date(Map<String, Object> b, String k) {
        String v = str(b, k);
        return v != null && !v.isBlank() ? LocalDate.parse(v) : null;
    }

    private static Integer intVal(Map<String, Object> b, String k) {
        String v = str(b, k);
        if (v == null || v.isBlank()) return null;
        try {
            return Integer.parseInt(v);
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
