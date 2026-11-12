package com.gympro.api.attendance;

import com.gympro.api.auth.OrgContextService;
import com.gympro.api.model.Attendance;
import com.gympro.api.model.Member;
import com.gympro.api.model.OrganizationMembership;
import com.gympro.api.repository.AttendanceRepository;
import com.gympro.api.repository.MemberRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {

    private final AttendanceRepository attendanceRepository;
    private final MemberRepository memberRepository;
    private final OrgContextService orgContext;

    public AttendanceController(AttendanceRepository attendanceRepository,
                                MemberRepository memberRepository,
                                OrgContextService orgContext) {
        this.attendanceRepository = attendanceRepository;
        this.memberRepository = memberRepository;
        this.orgContext = orgContext;
    }

    @GetMapping
    public List<Attendance> list(@RequestHeader("X-Org-Id") String orgId,
                                 @RequestParam(required = false) String date) {
        orgContext.requireMembership(orgId);
        LocalDate d = date != null ? LocalDate.parse(date) : LocalDate.now();
        return attendanceRepository.findInRange(orgId,
                d.atStartOfDay(), d.plusDays(1).atStartOfDay());
    }

    @GetMapping("/history")
    public List<Attendance> history(@RequestHeader("X-Org-Id") String orgId,
                                    @RequestParam(defaultValue = "0") int page,
                                    @RequestParam(defaultValue = "20") int size) {
        orgContext.requireMembership(orgId);
        return attendanceRepository
                .findByOrganizationIdOrderByCheckInDesc(orgId,
                        PageRequest.of(page, size, Sort.by("checkIn").descending()))
                .getContent();
    }

    /** Check-in: rejects if the member already has an open session today. */
    @PostMapping("/check-in")
    @Transactional
    public Attendance checkIn(@RequestHeader("X-Org-Id") String orgId,
                              @RequestBody Map<String, Object> body) {
        OrganizationMembership m = orgContext.requireRole(orgId,
                "org_owner", "org_admin", "branch_manager", "staff", "trainer");
        String memberId = String.valueOf(body.get("member_id"));

        Member member = memberRepository.findById(memberId)
                .filter(mm -> mm.getOrganizationId().equals(orgId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Member not found"));

        boolean alreadyOpen = attendanceRepository
                .findFirstByOrganizationIdAndMemberIdAndCheckOutIsNullOrderByCheckInDesc(orgId, memberId)
                .map(a -> a.getCheckIn().toLocalDate().equals(LocalDate.now()))
                .orElse(false);
        if (alreadyOpen) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Member already checked in today");
        }

        Attendance a = new Attendance();
        a.setId(UUID.randomUUID().toString());
        a.setOrganizationId(orgId);
        a.setBranchId(body.get("branch_id") != null ? body.get("branch_id").toString() : m.getBranchId());
        a.setMemberId(memberId);
        a.setCheckIn(LocalDateTime.now());
        a.setStatus("present");
        // Denormalized display fields — avoids N+1 member lookups on read.
        a.setMemberName(member.getName());
        a.setMemberType(member.getMembershipType());
        a.setCreatedAt(Instant.now());
        return attendanceRepository.save(a);
    }

    @PostMapping("/{id}/check-out")
    @Transactional
    public Attendance checkOut(@RequestHeader("X-Org-Id") String orgId, @PathVariable String id) {
        orgContext.requireRole(orgId, "org_owner", "org_admin", "branch_manager", "staff", "trainer");
        Attendance a = attendanceRepository.findById(id)
                .filter(r -> r.getOrganizationId().equals(orgId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (a.getCheckOut() != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Already checked out");
        }
        a.setCheckOut(LocalDateTime.now());
        return attendanceRepository.save(a);
    }
}
