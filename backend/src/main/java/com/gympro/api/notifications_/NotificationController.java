package com.gympro.api.notifications_;

import com.gympro.api.auth.OrgContextService;
import com.gympro.api.model.Notification;
import com.gympro.api.repository.NotificationRepository;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationRepository notificationRepository;
    private final OrgContextService orgContext;

    public NotificationController(NotificationRepository notificationRepository,
                                  OrgContextService orgContext) {
        this.notificationRepository = notificationRepository;
        this.orgContext = orgContext;
    }

    @GetMapping
    public List<Notification> mine() {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(orgContext.principal().uid());
    }

    @PostMapping("/{id}/read")
    public Notification markRead(@PathVariable String id) {
        Notification n = notificationRepository.findById(id)
                .filter(x -> x.getUserId().equals(orgContext.principal().uid()))
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND));
        n.setReadFlag(true);
        return notificationRepository.save(n);
    }

    /** Internal use — other services create notifications for a user. */
    public Notification create(String userId, String orgId, String type, String title, String body) {
        Notification n = new Notification();
        n.setId(UUID.randomUUID().toString());
        n.setUserId(userId);
        n.setOrganizationId(orgId);
        n.setType(type);
        n.setTitle(title);
        n.setBody(body);
        n.setReadFlag(false);
        n.setCreatedAt(Instant.now());
        return notificationRepository.save(n);
    }
}
