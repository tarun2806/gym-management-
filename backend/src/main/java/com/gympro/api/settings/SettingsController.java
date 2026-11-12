package com.gympro.api.settings;

import com.gympro.api.auth.OrgContextService;
import com.gympro.api.model.Setting;
import com.gympro.api.repository.SettingRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.Map;

/** Org-scoped key/value settings (gym_info, app_preferences). */
@RestController
@RequestMapping("/api/settings")
public class SettingsController {

    private final SettingRepository settingRepository;
    private final OrgContextService orgContext;

    public SettingsController(SettingRepository settingRepository, OrgContextService orgContext) {
        this.settingRepository = settingRepository;
        this.orgContext = orgContext;
    }

    @GetMapping("/{key}")
    public Map<String, Object> get(@RequestHeader("X-Org-Id") String orgId, @PathVariable String key) {
        orgContext.requireMembership(orgId);
        return settingRepository.findById(scopedKey(orgId, key))
                .map(s -> {
                    try {
                        return new com.fasterxml.jackson.databind.ObjectMapper()
                                .readValue(s.getValue(), Map.class);
                    } catch (Exception e) {
                        return Map.<String, Object>of("value", s.getValue());
                    }
                })
                .orElse(Map.of());
    }

    @PutMapping("/{key}")
    public Setting put(@RequestHeader("X-Org-Id") String orgId,
                       @PathVariable String key,
                       @RequestBody Map<String, Object> body) {
        orgContext.requireRole(orgId, "org_owner", "org_admin");
        Setting s = settingRepository.findById(scopedKey(orgId, key)).orElseGet(() -> {
            Setting n = new Setting();
            n.setKey(scopedKey(orgId, key));
            return n;
        });
        try {
            s.setValue(new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(body));
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "invalid value");
        }
        return settingRepository.save(s);
    }

    private static String scopedKey(String orgId, String key) {
        return orgId + ":" + key;
    }
}
