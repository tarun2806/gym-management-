package com.gympro.api.training;

import com.gympro.api.auth.OrgContextService;
import com.gympro.api.model.DietPlan;
import com.gympro.api.model.WorkoutPlan;
import com.gympro.api.repository.DietPlanRepository;
import com.gympro.api.repository.WorkoutPlanRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/** Workout and diet plans — member-assigned training/nutrition plans. */
@RestController
@RequestMapping("/api")
public class PlanController {

    private final WorkoutPlanRepository workoutRepository;
    private final DietPlanRepository dietRepository;
    private final OrgContextService orgContext;

    public PlanController(WorkoutPlanRepository workoutRepository,
                          DietPlanRepository dietRepository,
                          OrgContextService orgContext) {
        this.workoutRepository = workoutRepository;
        this.dietRepository = dietRepository;
        this.orgContext = orgContext;
    }

    // ─── Workout plans ───────────────────────────────────────────────────────

    @GetMapping("/workout-plans")
    public List<WorkoutPlan> listWorkouts(@RequestHeader("X-Org-Id") String orgId) {
        orgContext.requirePlanRoles(orgId);
        return workoutRepository.findByOrganizationId(orgId);
    }

    @PostMapping("/workout-plans")
    public WorkoutPlan createWorkout(@RequestHeader("X-Org-Id") String orgId,
                                     @RequestBody Map<String, Object> body) {
        orgContext.requireRole(orgId, "org_owner", "org_admin", "branch_manager", "staff", "trainer");
        WorkoutPlan p = new WorkoutPlan();
        p.setId(UUID.randomUUID().toString());
        p.setOrganizationId(orgId);
        p.setMemberId(str(body, "member_id"));
        p.setTrainerId(str(body, "trainer_id"));
        p.setName(str(body, "name"));
        p.setDescription(str(body, "description"));
        p.setObjective(str(body, "objective"));
        p.setLevel(str(body, "level"));
        p.setWeeks(intVal(body, "weeks"));
        p.setDaysPerWeek(intVal(body, "days_per_week"));
        p.setExercises(str(body, "exercises"));
        p.setCompletions("[]");
        p.setCreatedAt(Instant.now());
        if (p.getName() == null || p.getName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "name is required");
        }
        return workoutRepository.save(p);
    }

    @PutMapping("/workout-plans/{id}")
    public WorkoutPlan updateWorkout(@RequestHeader("X-Org-Id") String orgId,
                                     @PathVariable String id,
                                     @RequestBody Map<String, Object> body) {
        orgContext.requireRole(orgId, "org_owner", "org_admin", "branch_manager", "staff", "trainer");
        WorkoutPlan p = workoutRepository.findById(id)
                .filter(x -> x.getOrganizationId().equals(orgId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (body.containsKey("member_id")) p.setMemberId(str(body, "member_id"));
        if (body.containsKey("trainer_id")) p.setTrainerId(str(body, "trainer_id"));
        if (body.containsKey("name")) p.setName(str(body, "name"));
        if (body.containsKey("description")) p.setDescription(str(body, "description"));
        if (body.containsKey("objective")) p.setObjective(str(body, "objective"));
        if (body.containsKey("level")) p.setLevel(str(body, "level"));
        if (body.containsKey("weeks")) p.setWeeks(intVal(body, "weeks"));
        if (body.containsKey("days_per_week")) p.setDaysPerWeek(intVal(body, "days_per_week"));
        if (body.containsKey("exercises")) p.setExercises(str(body, "exercises"));
        if (body.containsKey("completions")) p.setCompletions(str(body, "completions"));
        return workoutRepository.save(p);
    }

    @DeleteMapping("/workout-plans/{id}")
    public org.springframework.http.ResponseEntity<Void> deleteWorkout(@RequestHeader("X-Org-Id") String orgId,
                                                                      @PathVariable String id) {
        orgContext.requireRole(orgId, "org_owner", "org_admin", "branch_manager", "staff", "trainer");
        WorkoutPlan p = workoutRepository.findById(id)
                .filter(x -> x.getOrganizationId().equals(orgId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        workoutRepository.delete(p);
        return org.springframework.http.ResponseEntity.noContent().build();
    }

    // ─── Diet plans ──────────────────────────────────────────────────────────

    @GetMapping("/diet-plans")
    public List<DietPlan> listDiet(@RequestHeader("X-Org-Id") String orgId) {
        orgContext.requirePlanRoles(orgId);
        return dietRepository.findByOrganizationId(orgId);
    }

    @PostMapping("/diet-plans")
    public DietPlan createDiet(@RequestHeader("X-Org-Id") String orgId,
                               @RequestBody Map<String, Object> body) {
        orgContext.requireRole(orgId, "org_owner", "org_admin", "branch_manager", "staff", "trainer");
        DietPlan p = new DietPlan();
        p.setId(UUID.randomUUID().toString());
        p.setOrganizationId(orgId);
        p.setMemberId(str(body, "member_id"));
        p.setDate(date(body, "date"));
        p.setCalories(intVal(body, "calories"));
        p.setMacros(str(body, "macros"));
        p.setGoals(str(body, "goals"));
        p.setDescription(str(body, "description"));
        p.setMeals(str(body, "meals"));
        String pref = str(body, "diet_preference");
        if (pref == null) pref = str(body, "dietPreference");
        p.setDietPreference(pref);
        p.setCreatedAt(Instant.now());
        return dietRepository.save(p);
    }

    @PutMapping("/diet-plans/{id}")
    public DietPlan updateDiet(@RequestHeader("X-Org-Id") String orgId,
                               @PathVariable String id,
                               @RequestBody Map<String, Object> body) {
        orgContext.requireRole(orgId, "org_owner", "org_admin", "branch_manager", "staff", "trainer");
        DietPlan p = dietRepository.findById(id)
                .filter(x -> x.getOrganizationId().equals(orgId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (body.containsKey("member_id")) p.setMemberId(str(body, "member_id"));
        if (body.containsKey("date")) p.setDate(date(body, "date"));
        if (body.containsKey("calories")) p.setCalories(intVal(body, "calories"));
        if (body.containsKey("macros")) p.setMacros(str(body, "macros"));
        if (body.containsKey("goals")) p.setGoals(str(body, "goals"));
        if (body.containsKey("description")) p.setDescription(str(body, "description"));
        if (body.containsKey("meals")) p.setMeals(str(body, "meals"));
        if (body.containsKey("diet_preference") || body.containsKey("dietPreference")) {
            String pref = str(body, "diet_preference");
            if (pref == null) pref = str(body, "dietPreference");
            p.setDietPreference(pref);
        }
        return dietRepository.save(p);
    }

    @DeleteMapping("/diet-plans/{id}")
    public org.springframework.http.ResponseEntity<Void> deleteDiet(@RequestHeader("X-Org-Id") String orgId,
                                                                    @PathVariable String id) {
        orgContext.requireRole(orgId, "org_owner", "org_admin", "branch_manager", "staff", "trainer");
        DietPlan p = dietRepository.findById(id)
                .filter(x -> x.getOrganizationId().equals(orgId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        dietRepository.delete(p);
        return org.springframework.http.ResponseEntity.noContent().build();
    }

    private static String str(Map<String, Object> b, String k) {
        Object v = b.get(k);
        return v != null ? v.toString() : null;
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

    private static LocalDate date(Map<String, Object> b, String k) {
        String v = str(b, k);
        return v != null && !v.isBlank() ? LocalDate.parse(v) : null;
    }
}
