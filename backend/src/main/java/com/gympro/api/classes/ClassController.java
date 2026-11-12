package com.gympro.api.classes;

import com.gympro.api.auth.OrgContextService;
import com.gympro.api.model.ClassBooking;
import com.gympro.api.model.GymClass;
import com.gympro.api.model.OrganizationMembership;
import com.gympro.api.repository.ClassBookingRepository;
import com.gympro.api.repository.GymClassRepository;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/classes")
public class ClassController {

    private final GymClassRepository classRepository;
    private final ClassBookingRepository bookingRepository;
    private final OrgContextService orgContext;

    public ClassController(GymClassRepository classRepository,
                           ClassBookingRepository bookingRepository,
                           OrgContextService orgContext) {
        this.classRepository = classRepository;
        this.bookingRepository = bookingRepository;
        this.orgContext = orgContext;
    }

    @GetMapping
    public List<GymClass> list(@RequestHeader("X-Org-Id") String orgId) {
        OrganizationMembership m = orgContext.requireMembership(orgId);
        String branch = orgContext.readBranchScope(m);
        return branch != null
                ? classRepository.findByOrganizationIdAndBranchId(orgId, branch)
                : classRepository.findByOrganizationId(orgId);
    }

    @PostMapping
    public GymClass create(@RequestHeader("X-Org-Id") String orgId, @RequestBody Map<String, Object> body) {
        OrganizationMembership m = orgContext.requireRole(orgId, "org_owner", "org_admin", "branch_manager");
        GymClass c = new GymClass();
        c.setId(UUID.randomUUID().toString());
        c.setOrganizationId(orgId);
        c.setBranchId(orgContext.resolveBranchId(orgId, m, body.get("branch_id")));
        c.setName(String.valueOf(body.getOrDefault("name", "")));
        c.setInstructor(str(body, "instructor"));
        c.setScheduleTime(str(body, "schedule_time"));
        c.setCapacity(intVal(body, "capacity", 0));
        c.setEnrolled(0);
        c.setStatus(strOr(body, "status", "Active"));
        c.setRoom(str(body, "room"));
        c.setType(str(body, "type"));
        c.setDescription(str(body, "description"));
        c.setCreatedAt(Instant.now());
        if (c.getName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "name is required");
        }
        return classRepository.save(c);
    }

    @PutMapping("/{id}")
    public GymClass update(@RequestHeader("X-Org-Id") String orgId,
                           @PathVariable String id,
                           @RequestBody Map<String, Object> body) {
        OrganizationMembership m = orgContext.requireRole(orgId, "org_owner", "org_admin", "branch_manager");
        GymClass c = classRepository.findById(id)
                .filter(x -> x.getOrganizationId().equals(orgId))
                .filter(x -> orgContext.canSeeBranch(m, x.getBranchId()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (body.containsKey("name")) c.setName(String.valueOf(body.get("name")));
        if (body.containsKey("instructor")) c.setInstructor(str(body, "instructor"));
        if (body.containsKey("schedule_time")) c.setScheduleTime(str(body, "schedule_time"));
        if (body.containsKey("capacity")) c.setCapacity(intVal(body, "capacity", c.getCapacity()));
        if (body.containsKey("status")) c.setStatus(str(body, "status"));
        if (body.containsKey("room")) c.setRoom(str(body, "room"));
        if (body.containsKey("type")) c.setType(str(body, "type"));
        if (body.containsKey("description")) c.setDescription(str(body, "description"));
        return classRepository.save(c);
    }

    @DeleteMapping("/{id}")
    public org.springframework.http.ResponseEntity<Void> delete(@RequestHeader("X-Org-Id") String orgId,
                                                              @PathVariable String id) {
        OrganizationMembership m = orgContext.requireRole(orgId, "org_owner", "org_admin");
        GymClass c = classRepository.findById(id)
                .filter(x -> x.getOrganizationId().equals(orgId))
                .filter(x -> orgContext.canSeeBranch(m, x.getBranchId()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        classRepository.delete(c);
        return org.springframework.http.ResponseEntity.noContent().build();
    }

    // ─── Bookings ────────────────────────────────────────────────────────────

    @GetMapping("/{classId}/bookings")
    public List<ClassBooking> bookings(@RequestHeader("X-Org-Id") String orgId,
                                       @PathVariable String classId) {
        OrganizationMembership m = orgContext.requireMembership(orgId);
        GymClass c = classRepository.findById(classId)
                .filter(x -> x.getOrganizationId().equals(orgId))
                .filter(x -> orgContext.canSeeBranch(m, x.getBranchId()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        return bookingRepository.findByClassId(c.getId());
    }

    /**
     * Book a member into a class. Transactional: capacity is checked and the
     * enrolled counter updated atomically — prevents overselling under
     * concurrent bookings.
     */
    @PostMapping("/{classId}/book")
    @Transactional
    public ClassBooking book(@RequestHeader("X-Org-Id") String orgId,
                             @PathVariable String classId,
                             @RequestBody Map<String, Object> body) {
        OrganizationMembership m = orgContext.requireMembership(orgId);
        GymClass c = classRepository.findById(classId)
                .filter(x -> x.getOrganizationId().equals(orgId))
                .filter(x -> orgContext.canSeeBranch(m, x.getBranchId()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (!"Active".equalsIgnoreCase(c.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Class is not active");
        }
        String memberId = String.valueOf(body.get("member_id"));
        if (memberId == null || memberId.equals("null")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "member_id required");
        }
        if (bookingRepository.existsByClassIdAndMemberIdAndStatus(c.getId(), memberId, "booked")) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Member already booked");
        }
        if (c.getEnrolled() >= c.getCapacity()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Class is full");
        }

        ClassBooking b = new ClassBooking();
        b.setId(UUID.randomUUID().toString());
        b.setOrganizationId(orgId);
        b.setClassId(c.getId());
        b.setMemberId(memberId);
        b.setBookedAt(Instant.now());
        b.setBookedDate(LocalDate.now());
        b.setStatus("booked");

        c.setEnrolled(c.getEnrolled() + 1);
        classRepository.save(c);
        return bookingRepository.save(b);
    }

    @PostMapping("/bookings/{bookingId}/cancel")
    @Transactional
    public ClassBooking cancel(@RequestHeader("X-Org-Id") String orgId,
                               @PathVariable String bookingId) {
        orgContext.requireMembership(orgId);
        ClassBooking b = bookingRepository.findById(bookingId)
                .filter(x -> x.getOrganizationId().equals(orgId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (!"booked".equals(b.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Booking already cancelled");
        }
        b.setStatus("cancelled");
        b.setCancelledAt(Instant.now());
        bookingRepository.save(b);

        classRepository.findById(b.getClassId()).ifPresent(c -> {
            if (c.getEnrolled() > 0) {
                c.setEnrolled(c.getEnrolled() - 1);
                classRepository.save(c);
            }
        });
        return b;
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
        try {
            return Integer.parseInt(v.toString());
        } catch (NumberFormatException e) {
            return def;
        }
    }
}
