package com.gympro.api.jobs;

import com.gympro.api.model.Member;
import com.gympro.api.repository.MemberRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * Membership lifecycle job — port of the Express node-cron tasks.
 * Daily: marks members whose expiry_date has passed as Inactive, and logs
 * members expiring tomorrow (email reminders wired when a mail service lands).
 */
@Component
public class MembershipExpiryScheduler {

    private static final Logger log = LoggerFactory.getLogger(MembershipExpiryScheduler.class);

    private final MemberRepository memberRepository;

    public MembershipExpiryScheduler(MemberRepository memberRepository) {
        this.memberRepository = memberRepository;
    }

    @Scheduled(cron = "0 0 0 * * *")
    @Transactional
    public void expireMemberships() {
        List<Member> expired = memberRepository
                .findByExpiryDateBeforeAndStatus(LocalDate.now(), "Active");
        expired.forEach(m -> m.setStatus("Inactive"));
        memberRepository.saveAll(expired);
        if (!expired.isEmpty()) {
            log.info("Expired {} memberships", expired.size());
        }

        List<Member> expiringTomorrow = memberRepository
                .findByExpiryDateAndStatus(LocalDate.now().plusDays(1), "Active");
        expiringTomorrow.forEach(m ->
                log.info("Membership expiring tomorrow: member={} org={}", m.getId(), m.getOrganizationId()));
    }
}
