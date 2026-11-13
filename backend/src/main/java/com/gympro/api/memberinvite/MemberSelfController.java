package com.gympro.api.memberinvite;

import com.gympro.api.auth.OrgContextService;
import com.gympro.api.model.ClassBooking;
import com.gympro.api.model.GymClass;
import com.gympro.api.model.Member;
import com.gympro.api.repository.*;
import com.gympro.api.security.AppUserPrincipal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Member self-service endpoints — every query is scoped to the member record
 * linked to the caller's Firebase UID. No org-wide or other-member data.
 */
@RestController
@RequestMapping("/api/me")
public class MemberSelfController {

    private final MemberRepository memberRepo;
    private final AttendanceRepository attendanceRepo;
    private final PaymentRepository paymentRepo;
    private final InvoiceRepository invoiceRepo;
    private final WorkoutPlanRepository workoutRepo;
    private final DietPlanRepository dietRepo;
    private final GymClassRepository classRepo;
    private final ClassBookingRepository bookingRepo;
    private final OrgContextService orgContext;

    public MemberSelfController(MemberRepository memberRepo,
                                AttendanceRepository attendanceRepo,
                                PaymentRepository paymentRepo,
                                InvoiceRepository invoiceRepo,
                                WorkoutPlanRepository workoutRepo,
                                DietPlanRepository dietRepo,
                                GymClassRepository classRepo,
                                ClassBookingRepository bookingRepo,
                                OrgContextService orgContext) {
        this.memberRepo = memberRepo;
        this.attendanceRepo = attendanceRepo;
        this.paymentRepo = paymentRepo;
        this.invoiceRepo = invoiceRepo;
        this.workoutRepo = workoutRepo;
        this.dietRepo = dietRepo;
        this.classRepo = classRepo;
        this.bookingRepo = bookingRepo;
        this.orgContext = orgContext;
    }

    private Member myMember() {
        AppUserPrincipal p = orgContext.principal();
        return memberRepo.findByUserId(p.uid())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "no linked member record"));
    }

    @GetMapping("/attendance")
    public Map<String, Object> attendance(@RequestParam(required = false) String from,
                                          @RequestParam(required = false) String to,
                                          @RequestParam(defaultValue = "0") int page) {
        Member m = myMember();
        PageRequest pr = PageRequest.of(Math.max(page, 0), 20);
        Page<?> result;
        if (from != null && to != null) {
            result = attendanceRepo.findByMemberIdAndCheckInBetweenOrderByCheckInDesc(
                    m.getId(), LocalDateTime.parse(from), LocalDateTime.parse(to), pr);
        } else {
            result = attendanceRepo.findByMemberIdOrderByCheckInDesc(m.getId(), pr);
        }
        return Map.of("items", result.getContent().stream().map(this::attendanceView).toList(),
                "total", result.getTotalElements());
    }

    @GetMapping("/payments")
    public Map<String, Object> payments(@RequestParam(defaultValue = "0") int page) {
        Member m = myMember();
        Page<?> result = paymentRepo.findByMemberIdOrderByCreatedAtDesc(m.getId(),
                PageRequest.of(Math.max(page, 0), 20));
        return Map.of("items", result.getContent().stream().map(this::paymentView).toList(),
                "total", result.getTotalElements());
    }

    @GetMapping("/invoices")
    public List<Map<String, Object>> invoices() {
        Member m = myMember();
        return invoiceRepo.findByMemberId(m.getId()).stream().map(this::invoiceView).toList();
    }

    @GetMapping("/workout-plans")
    public List<Map<String, Object>> workoutPlans() {
        Member m = myMember();
        return workoutRepo.findByMemberId(m.getId()).stream().map(this::workoutView).toList();
    }

    @GetMapping("/diet-plans")
    public List<Map<String, Object>> dietPlans() {
        Member m = myMember();
        return dietRepo.findByMemberId(m.getId()).stream().map(this::dietView).toList();
    }

    // ── Class bookings (member self-service, own records only) ─────────────

    /** Upcoming class schedule the member can book — org-scoped, no roster data. */
    @GetMapping("/classes")
    public List<Map<String, Object>> classes() {
        Member m = myMember();
        var membership = orgContext.requireMembership(m.getOrganizationId());
        String branch = orgContext.readBranchScope(membership);
        return classRepo.findByOrganizationId(m.getOrganizationId()).stream()
                .filter(c -> branch == null || branch.equals(c.getBranchId()))
                .filter(c -> "Active".equalsIgnoreCase(c.getStatus()))
                .map(this::classView).toList();
    }

    /** The member's own bookings, enriched with class info. */
    @GetMapping("/class-bookings")
    public List<Map<String, Object>> myBookings() {
        Member m = myMember();
        return bookingRepo.findByMemberIdOrderByBookedAtDesc(m.getId()).stream()
                .map(b -> {
                    Map<String, Object> v = bookingView(b);
                    classRepo.findById(b.getClassId()).ifPresent(c -> {
                        v.put("class_name", c.getName());
                        v.put("schedule_time", c.getScheduleTime() != null ? c.getScheduleTime() : "");
                        v.put("instructor", c.getInstructor() != null ? c.getInstructor() : "");
                    });
                    return v;
                }).toList();
    }

    /** Book the caller's own member record into a class. */
    @PostMapping("/class-bookings/{classId}/book")
    @Transactional
    public Map<String, Object> book(@PathVariable String classId) {
        Member m = myMember();
        GymClass c = classRepo.findByIdForUpdate(classId)
                .filter(x -> x.getOrganizationId().equals(m.getOrganizationId()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "class not found"));
        if (m.getBranchId() != null && c.getBranchId() != null
                && !m.getBranchId().equals(c.getBranchId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "class is at a different branch");
        }
        if (!"Active".equalsIgnoreCase(c.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Class is not active");
        }
        if (bookingRepo.existsByClassIdAndMemberIdAndStatus(c.getId(), m.getId(), "booked")) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Already booked");
        }
        // Atomic seat claim — safe under concurrent bookings.
        if (classRepo.claimSeat(c.getId()) == 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Class is full");
        }
        ClassBooking b = new ClassBooking();
        b.setId(UUID.randomUUID().toString());
        b.setOrganizationId(m.getOrganizationId());
        b.setClassId(c.getId());
        b.setMemberId(m.getId());
        b.setBookedAt(Instant.now());
        b.setBookedDate(LocalDate.now());
        b.setStatus("booked");
        return bookingView(bookingRepo.save(b));
    }

    /** Cancel only the caller's own booking — ownership enforced. */
    @PostMapping("/class-bookings/{bookingId}/cancel")
    @Transactional
    public Map<String, Object> cancelBooking(@PathVariable String bookingId) {
        Member m = myMember();
        ClassBooking b = bookingRepo.findById(bookingId)
                .filter(x -> x.getOrganizationId().equals(m.getOrganizationId()))
                .filter(x -> x.getMemberId().equals(m.getId()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "booking not found"));
        if (!"booked".equals(b.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Booking already cancelled");
        }
        b.setStatus("cancelled");
        b.setCancelledAt(Instant.now());
        bookingRepo.save(b);
        classRepo.findByIdForUpdate(b.getClassId()).ifPresent(c -> {
            if (c.getEnrolled() != null && c.getEnrolled() > 0) {
                c.setEnrolled(c.getEnrolled() - 1);
                classRepo.save(c);
            }
        });
        return bookingView(b);
    }

    private Map<String, Object> classView(GymClass c) {
        Map<String, Object> v = new LinkedHashMap<>();
        v.put("id", c.getId());
        v.put("name", c.getName());
        v.put("instructor", c.getInstructor() != null ? c.getInstructor() : "");
        v.put("schedule_time", c.getScheduleTime() != null ? c.getScheduleTime() : "");
        v.put("capacity", c.getCapacity());
        v.put("enrolled", c.getEnrolled());
        v.put("room", c.getRoom() != null ? c.getRoom() : "");
        return v;
    }

    private Map<String, Object> bookingView(ClassBooking b) {
        Map<String, Object> v = new LinkedHashMap<>();
        v.put("id", b.getId());
        v.put("class_id", b.getClassId());
        v.put("status", b.getStatus());
        v.put("booked_at", b.getBookedAt() != null ? b.getBookedAt().toString() : "");
        v.put("booked_date", b.getBookedDate() != null ? b.getBookedDate().toString() : "");
        return v;
    }

    // ── safe projections (no sensitive fields) ─────────────────────────────

    private Map<String, Object> attendanceView(Object o) {
        var a = (com.gympro.api.model.Attendance) o;
        Map<String, Object> v = new LinkedHashMap<>();
        v.put("id", a.getId());
        v.put("check_in", a.getCheckIn() != null ? a.getCheckIn().toString() : "");
        v.put("check_out", a.getCheckOut() != null ? a.getCheckOut().toString() : "");
        v.put("status", a.getStatus());
        return v;
    }

    private Map<String, Object> paymentView(Object o) {
        var p = (com.gympro.api.model.Payment) o;
        Map<String, Object> v = new LinkedHashMap<>();
        v.put("id", p.getId());
        v.put("amount", p.getAmount());
        v.put("type", p.getType());
        v.put("status", p.getStatus());
        v.put("plan_name", p.getPlanName());
        v.put("period_start", p.getPeriodStart() != null ? p.getPeriodStart().toString() : "");
        v.put("period_end", p.getPeriodEnd() != null ? p.getPeriodEnd().toString() : "");
        v.put("note", p.getNote());
        v.put("created_at", p.getCreatedAt() != null ? p.getCreatedAt().toString() : "");
        return v;
    }

    private Map<String, Object> invoiceView(com.gympro.api.model.Invoice i) {
        Map<String, Object> v = new LinkedHashMap<>();
        v.put("id", i.getId());
        v.put("invoice_number", i.getInvoiceNumber());
        v.put("amount", i.getAmount());
        v.put("status", i.getStatus());
        v.put("issued_date", i.getIssuedDate() != null ? i.getIssuedDate().toString() : "");
        v.put("due_date", i.getDueDate() != null ? i.getDueDate().toString() : "");
        return v;
    }

    private Map<String, Object> workoutView(com.gympro.api.model.WorkoutPlan w) {
        Map<String, Object> v = new LinkedHashMap<>();
        v.put("id", w.getId());
        v.put("name", w.getName());
        v.put("description", w.getDescription());
        v.put("objective", w.getObjective());
        v.put("level", w.getLevel());
        v.put("weeks", w.getWeeks());
        v.put("days_per_week", w.getDaysPerWeek());
        v.put("exercises", w.getExercises());
        return v;
    }

    private Map<String, Object> dietView(com.gympro.api.model.DietPlan d) {
        Map<String, Object> v = new LinkedHashMap<>();
        v.put("id", d.getId());
        v.put("date", d.getDate() != null ? d.getDate().toString() : "");
        v.put("calories", d.getCalories());
        v.put("macros", d.getMacros());
        v.put("goals", d.getGoals());
        v.put("description", d.getDescription());
        v.put("meals", d.getMeals());
        v.put("diet_preference", d.getDietPreference());
        return v;
    }
}
