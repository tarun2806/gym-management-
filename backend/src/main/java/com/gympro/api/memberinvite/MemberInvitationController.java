package com.gympro.api.memberinvite;

import com.gympro.api.auth.OrgContextService;
import com.gympro.api.model.*;
import com.gympro.api.platform.PlatformAdminController;
import com.gympro.api.repository.*;
import com.gympro.api.security.AppUserPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

/** Owner-issued member invitations + secure member identity linking. */
@RestController
@RequestMapping("/api")
public class MemberInvitationController {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final int INVITE_TTL_DAYS = 7;

    private final MemberInvitationRepository inviteRepo;
    private final MemberRepository memberRepo;
    private final OrganizationMembershipRepository membershipRepo;
    private final SystemLogRepository logRepo;
    private final TrainerRepository trainerRepo;
    private final OrgContextService orgContext;

    public MemberInvitationController(MemberInvitationRepository inviteRepo,
                                      MemberRepository memberRepo,
                                      OrganizationMembershipRepository membershipRepo,
                                      SystemLogRepository logRepo,
                                      TrainerRepository trainerRepo,
                                      OrgContextService orgContext) {
        this.inviteRepo = inviteRepo;
        this.memberRepo = memberRepo;
        this.membershipRepo = membershipRepo;
        this.logRepo = logRepo;
        this.trainerRepo = trainerRepo;
        this.orgContext = orgContext;
    }

    private void audit(String orgId, String action, String detail) {
        SystemLog log = new SystemLog();
        log.setId(UUID.randomUUID().toString());
        log.setOrgId(orgId);
        log.setLevel("info");
        log.setAction(action);
        log.setMessage(detail);
        log.setUserId(orgContext.principal().uid());
        log.setCreatedAt(Instant.now());
        logRepo.save(log);
    }

    /** Staff-facing: list invitations for an org (metadata only). */
    @GetMapping("/member-invitations")
    public List<Map<String, Object>> list(@RequestHeader("X-Org-Id") String orgId) {
        orgContext.requireRole(orgId, "platform_admin", "org_owner", "org_admin", "branch_manager", "staff");
        return inviteRepo.findByOrganizationIdOrderByCreatedAtDesc(orgId).stream()
                .map(i -> Map.<String, Object>of(
                        "id", i.getId(), "member_id", i.getMemberId(),
                        "branch_id", i.getBranchId() != null ? i.getBranchId() : "",
                        "expires_at", i.getExpiresAt().toString(),
                        "redeemed", i.getRedeemedAt() != null,
                        "revoked", i.getRevokedAt() != null,
                        "created_at", i.getCreatedAt().toString()))
                .toList();
    }

    /** Staff-facing: issue an invitation for an existing member record. */
    @PostMapping("/member-invitations")
    public Map<String, Object> invite(@RequestHeader("X-Org-Id") String orgId,
                                      @RequestBody Map<String, Object> body) {
        orgContext.requireRole(orgId, "platform_admin", "org_owner", "org_admin", "branch_manager", "staff");
        String memberId = String.valueOf(body.getOrDefault("member_id", ""));
        Member m = memberRepo.findById(memberId)
                .filter(x -> x.getOrganizationId().equals(orgId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "member not found"));
        if (m.getUserId() != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "member already linked to a user");
        }

        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        String raw = "gympro_mem_" + Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);

        MemberInvitation inv = new MemberInvitation();
        inv.setId(UUID.randomUUID().toString());
        inv.setTokenHash(PlatformAdminController.sha256(raw));
        inv.setOrganizationId(orgId);
        inv.setBranchId(m.getBranchId());
        inv.setMemberId(m.getId());
        inv.setInvitedBy(orgContext.principal().uid());
        inv.setExpiresAt(Instant.now().plus(INVITE_TTL_DAYS, ChronoUnit.DAYS));
        inviteRepo.save(inv);
        audit(orgId, "member.invite_created", "member=" + m.getId() + " invite=" + inv.getId());
        // Raw token returned once — only hash stored.
        return Map.of("id", inv.getId(), "token", raw, "expires_at", inv.getExpiresAt().toString());
    }

    @PostMapping("/member-invitations/{id}/revoke")
    public Map<String, Object> revoke(@RequestHeader("X-Org-Id") String orgId,
                                      @PathVariable String id) {
        orgContext.requireRole(orgId, "platform_admin", "org_owner", "org_admin", "branch_manager");
        MemberInvitation inv = inviteRepo.findById(id)
                .filter(i -> i.getOrganizationId().equals(orgId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (inv.getRedeemedAt() != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "invitation already redeemed");
        }
        inv.setRevokedAt(Instant.now());
        inviteRepo.save(inv);
        audit(orgId, "member.invite_revoked", "invite=" + id);
        return Map.of("id", id, "revoked", true);
    }

    /**
     * Public-ish redeem: any authenticated user holding a valid token links
     * their Firebase UID to the member record and gets a `member` membership.
     * Role is hardcoded — users can never self-assign staff/owner roles.
     */
    @PostMapping("/member-invitations/redeem")
    @Transactional
    public Map<String, Object> redeem(@RequestBody Map<String, Object> body) {
        AppUserPrincipal p = orgContext.principal();
        String raw = String.valueOf(body.getOrDefault("token", ""));
        if (raw.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "token required");
        }
        MemberInvitation inv = inviteRepo.findByTokenHash(PlatformAdminController.sha256(raw.trim()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "invalid invitation"));
        Instant now = Instant.now();
        if (inv.getRevokedAt() != null) throw new ResponseStatusException(HttpStatus.GONE, "invitation revoked");
        if (inv.getRedeemedAt() != null) throw new ResponseStatusException(HttpStatus.CONFLICT, "invitation already redeemed");
        if (!inv.getExpiresAt().isAfter(now)) throw new ResponseStatusException(HttpStatus.GONE, "invitation expired");

        int n = inviteRepo.redeem(inv.getId(), p.uid(), now);
        if (n == 0) throw new ResponseStatusException(HttpStatus.CONFLICT, "invitation already redeemed");

        Member m = memberRepo.findById(inv.getMemberId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "member record missing"));
        if (m.getUserId() != null && !m.getUserId().equals(p.uid())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "member already linked to another user");
        }
        m.setUserId(p.uid());
        memberRepo.save(m);

        // Ensure an org membership exists with the member role — never elevated.
        String mid = p.uid() + ":" + inv.getOrganizationId();
        OrganizationMembership om = membershipRepo.findById(mid).orElseGet(() -> {
            OrganizationMembership x = new OrganizationMembership();
            x.setId(mid);
            x.setOrganizationId(inv.getOrganizationId());
            x.setUserId(p.uid());
            x.setJoinedAt(now);
            return x;
        });
        om.setRole("member");
        om.setStatus("active");
        om.setBranchId(inv.getBranchId());
        membershipRepo.save(om);

        audit(inv.getOrganizationId(), "member.invite_redeemed",
                "member=" + m.getId() + " uid=" + p.uid());
        return Map.of("member_id", m.getId(), "organization_id", inv.getOrganizationId(),
                "branch_id", inv.getBranchId() != null ? inv.getBranchId() : "", "role", "member");
    }

    /** Member self-service: the caller's own linked member record (any org). */
    @GetMapping("/me/member")
    public Map<String, Object> myMember() {
        AppUserPrincipal p = orgContext.principal();
        Member m = memberRepo.findByUserId(p.uid())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "no linked member record"));
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("id", m.getId());
        out.put("organization_id", m.getOrganizationId());
        out.put("branch_id", m.getBranchId() != null ? m.getBranchId() : "");
        out.put("name", m.getName() != null ? m.getName() : "");
        out.put("email", m.getEmail() != null ? m.getEmail() : "");
        out.put("phone", m.getPhone() != null ? m.getPhone() : "");
        out.put("membership_type", m.getMembershipType() != null ? m.getMembershipType() : "");
        out.put("status", m.getStatus() != null ? m.getStatus() : "");
        out.put("plan_name", m.getPlanName() != null ? m.getPlanName() : "");
        out.put("start_date", m.getStartDate() != null ? m.getStartDate().toString() : "");
        out.put("expiry_date", m.getExpiryDate() != null ? m.getExpiryDate().toString() : "");
        out.put("trainer_id", m.getTrainerId() != null ? m.getTrainerId() : "");
        if (m.getTrainerId() != null) {
            trainerRepo.findById(m.getTrainerId())
                    .filter(t -> t.getOrganizationId().equals(m.getOrganizationId()))
                    .ifPresent(t -> {
                        out.put("trainer_name", t.getName() != null ? t.getName() : "");
                        out.put("trainer_specialization", t.getSpecialization() != null ? t.getSpecialization() : "");
                    });
        }
        return out;
    }
}
