package com.gympro.api.inventory;

import com.gympro.api.auth.OrgContextService;
import com.gympro.api.model.OrganizationMembership;
import com.gympro.api.model.Product;
import com.gympro.api.model.StockMovement;
import com.gympro.api.repository.ProductRepository;
import com.gympro.api.repository.StockMovementRepository;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class InventoryController {

    private final ProductRepository productRepository;
    private final StockMovementRepository movementRepository;
    private final OrgContextService orgContext;

    public InventoryController(ProductRepository productRepository,
                               StockMovementRepository movementRepository,
                               OrgContextService orgContext) {
        this.productRepository = productRepository;
        this.movementRepository = movementRepository;
        this.orgContext = orgContext;
    }

    @GetMapping("/products")
    public List<Product> list(@RequestHeader("X-Org-Id") String orgId) {
        orgContext.requireMembership(orgId);
        return productRepository.findByOrganizationId(orgId);
    }

    @PostMapping("/products")
    public Product create(@RequestHeader("X-Org-Id") String orgId, @RequestBody Map<String, Object> body) {
        OrganizationMembership m = orgContext.requireRole(orgId, "org_owner", "org_admin", "branch_manager", "staff");
        Product p = new Product();
        p.setId(UUID.randomUUID().toString());
        p.setOrganizationId(orgId);
        p.setBranchId(body.get("branch_id") != null ? body.get("branch_id").toString() : m.getBranchId());
        p.setName(str(body, "name"));
        p.setCategory(str(body, "category"));
        p.setSku(str(body, "sku"));
        p.setDescription(str(body, "description"));
        p.setStockQuantity(intVal(body, "stock_quantity", 0));
        p.setUnitPrice(dec(body, "unit_price"));
        p.setSupplier(str(body, "supplier"));
        p.setMinStock(intVal(body, "min_stock", 0));
        p.setStatus(strOr(body, "status", "active"));
        p.setCreatedAt(Instant.now());
        if (p.getName() == null || p.getName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "name is required");
        }
        return productRepository.save(p);
    }

    /**
     * Stock movement — transactional: adjusts quantity and records the
     * movement atomically so stock stays traceable.
     */
    @PostMapping("/products/{id}/stock")
    @Transactional
    public StockMovement adjustStock(@RequestHeader("X-Org-Id") String orgId,
                                     @PathVariable String id,
                                     @RequestBody Map<String, Object> body) {
        orgContext.requireRole(orgId, "org_owner", "org_admin", "branch_manager", "staff");
        Product p = productRepository.findById(id)
                .filter(x -> x.getOrganizationId().equals(orgId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        String type = strOr(body, "type", "in");
        int qty = intVal(body, "quantity", 0);
        if (qty <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "quantity must be positive");
        }
        int delta = "out".equalsIgnoreCase(type) ? -qty : qty;
        int newQty = p.getStockQuantity() + delta;
        if (newQty < 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Insufficient stock");
        }
        p.setStockQuantity(newQty);
        productRepository.save(p);

        StockMovement mv = new StockMovement();
        mv.setId(UUID.randomUUID().toString());
        mv.setOrganizationId(orgId);
        mv.setBranchId(body.get("branch_id") != null ? body.get("branch_id").toString() : p.getBranchId());
        mv.setProductId(p.getId());
        mv.setType(type);
        mv.setQuantity(qty);
        mv.setUnitCost(dec(body, "unit_cost"));
        mv.setReason(str(body, "reason"));
        mv.setPerformedBy(orgContext.principal().uid());
        mv.setDate(Instant.now());
        mv.setCreatedAt(Instant.now());
        return movementRepository.save(mv);
    }

    @GetMapping("/stock-movements")
    public List<StockMovement> allMovements(@RequestHeader("X-Org-Id") String orgId) {
        orgContext.requireMembership(orgId);
        return movementRepository.findByOrganizationIdOrderByDateDesc(orgId);
    }

    @GetMapping("/products/{id}/movements")
    public List<StockMovement> movements(@RequestHeader("X-Org-Id") String orgId, @PathVariable String id) {
        orgContext.requireMembership(orgId);
        return movementRepository.findByProductIdOrderByDateDesc(id);
    }

    private static String str(Map<String, Object> b, String k) {
        Object v = b.get(k);
        return v != null ? v.toString() : null;
    }

    private static String strOr(Map<String, Object> b, String k, String def) {
        String v = str(b, k);
        return v != null && !v.isBlank() ? v : def;
    }

    private static Integer intVal(Map<String, Object> b, String k, int def) {
        String v = str(b, k);
        if (v == null || v.isBlank()) return def;
        try {
            return Integer.parseInt(v);
        } catch (NumberFormatException e) {
            return def;
        }
    }

    private static BigDecimal dec(Map<String, Object> b, String k) {
        String v = str(b, k);
        if (v == null || v.isBlank()) return null;
        try {
            return new BigDecimal(v);
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
