package com.gympro.api.members;

import com.gympro.api.auth.OrgContextService;
import com.gympro.api.model.Member;
import com.gympro.api.model.OrganizationMembership;
import com.gympro.api.repository.MemberRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
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
@RequestMapping("/api/members")
public class MemberController {

    private final MemberRepository memberRepository;
    private final OrgContextService orgContext;

    public MemberController(MemberRepository memberRepository, OrgContextService orgContext) {
        this.memberRepository = memberRepository;
        this.orgContext = orgContext;
    }

    @GetMapping
    public List<Member> list(@RequestHeader("X-Org-Id") String orgId,
                             @RequestParam(required = false) Integer page,
                             @RequestParam(required = false) Integer size) {
        orgContext.requireMembership(orgId);
        if (page != null) {
            Page<Member> p = memberRepository.findByOrganizationId(orgId,
                    PageRequest.of(page, size != null ? size : 20, Sort.by("createdAt").descending()));
            return p.getContent();
        }
        return memberRepository.findByOrganizationIdOrderByCreatedAtDesc(orgId);
    }

    @GetMapping("/active")
    public List<Member> active(@RequestHeader("X-Org-Id") String orgId) {
        orgContext.requireMembership(orgId);
        return memberRepository.findByOrganizationIdAndStatus(orgId, "Active");
    }

    @GetMapping("/expiring")
    public List<Member> expiring(@RequestHeader("X-Org-Id") String orgId) {
        orgContext.requireMembership(orgId);
        return memberRepository.findByOrganizationIdAndExpiryDateBefore(orgId, LocalDate.now());
    }

    @GetMapping("/{id}")
    public Member get(@RequestHeader("X-Org-Id") String orgId, @PathVariable String id) {
        orgContext.requireMembership(orgId);
        return memberRepository.findById(id)
                .filter(m -> m.getOrganizationId().equals(orgId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    @PostMapping
    public Member create(@RequestHeader("X-Org-Id") String orgId,
                         @RequestBody Map<String, Object> body) {
        OrganizationMembership m = orgContext.requireRole(orgId,
                "org_owner", "org_admin", "branch_manager", "staff");
        Member member = new Member();
        member.setId(UUID.randomUUID().toString());
        member.setOrganizationId(orgId);
        member.setBranchId(body.get("branch_id") != null ? body.get("branch_id").toString()
                : m.getBranchId());
        member.setName(str(body, "name"));
        member.setEmail(str(body, "email"));
        member.setPhone(str(body, "phone"));
        member.setMembershipType(str(body, "membership_type"));
        member.setStatus(strOr(body, "status", "Active"));
        member.setTrainerId(str(body, "trainer_id"));
        member.setPlanId(str(body, "plan_id"));
        member.setPlanName(str(body, "plan_name"));
        member.setJoinDate(date(body, "join_date"));
        member.setStartDate(date(body, "start_date"));
        member.setExpiryDate(date(body, "expiry_date"));
        member.setCreatedAt(Instant.now());
        if (member.getName() == null || member.getName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "name is required");
        }
        return memberRepository.save(member);
    }

    @PutMapping("/{id}")
    public Member update(@RequestHeader("X-Org-Id") String orgId,
                         @PathVariable String id,
                         @RequestBody Map<String, Object> body) {
        orgContext.requireRole(orgId, "org_owner", "org_admin", "branch_manager", "staff");
        Member member = memberRepository.findById(id)
                .filter(m -> m.getOrganizationId().equals(orgId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (body.containsKey("name")) member.setName(str(body, "name"));
        if (body.containsKey("email")) member.setEmail(str(body, "email"));
        if (body.containsKey("phone")) member.setPhone(str(body, "phone"));
        if (body.containsKey("status")) member.setStatus(str(body, "status"));
        if (body.containsKey("membership_type")) member.setMembershipType(str(body, "membership_type"));
        if (body.containsKey("trainer_id")) member.setTrainerId(str(body, "trainer_id"));
        if (body.containsKey("plan_id")) member.setPlanId(str(body, "plan_id"));
        if (body.containsKey("plan_name")) member.setPlanName(str(body, "plan_name"));
        if (body.containsKey("expiry_date")) member.setExpiryDate(date(body, "expiry_date"));
        return memberRepository.save(member);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@RequestHeader("X-Org-Id") String orgId,
                                       @PathVariable String id) {
        orgContext.requireRole(orgId, "org_owner", "org_admin");
        Member member = memberRepository.findById(id)
                .filter(m -> m.getOrganizationId().equals(orgId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        memberRepository.delete(member);
        return ResponseEntity.noContent().build();
    }

    private static String str(Map<String, Object> b, String k) {
        Object v = b.get(k);
        return v != null ? v.toString() : null;
    }

    private static String strOr(Map<String, Object> b, String k, String def) {
        String v = str(b, k);
        return v != null ? v : def;
    }

    private static LocalDate date(Map<String, Object> b, String k) {
        String v = str(b, k);
        return v != null && !v.isBlank() ? LocalDate.parse(v) : null;
    }
}
