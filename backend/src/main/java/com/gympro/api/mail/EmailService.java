package com.gympro.api.mail;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/** Transactional email via SMTP. Disabled gracefully when unconfigured. */
@Service
public class EmailService {
    private static final Logger log = LoggerFactory.getLogger(EmailService.class);
    private final JavaMailSender mailSender;
    private final String from;
    private final String baseUrl;
    private final boolean configured;

    public EmailService(JavaMailSender mailSender,
                        @Value("${app.mail-from:gympro@localhost}") String from,
                        @Value("${app.base-url:http://localhost:5173}") String baseUrl,
                        @Value("${MAIL_USERNAME:}") String username) {
        this.mailSender = mailSender;
        this.from = from;
        this.baseUrl = baseUrl;
        this.configured = username != null && !username.isBlank();
    }

    /** Member invitation: raw token shown once, only hash is stored. */
    public void sendMemberInvite(String toEmail, String memberName, String token) {
        if (!configured) {
            log.info("[mail:dev] invite to {} token={}", toEmail, token);
            return;
        }
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom(from);
            msg.setTo(toEmail);
            msg.setSubject("You're invited to join your gym on GymPro");
            msg.setText("Hi " + (memberName != null && !memberName.isBlank() ? memberName : "there") + ",\n\n"
                    + "You've been invited to join your gym on GymPro.\n\n"
                    + "1. Open " + baseUrl + "/#/login\n"
                    + "2. Choose \"Join a Gym\" / member sign-in and create your account\n"
                    + "3. Paste this invitation token when asked:\n\n"
                    + "   " + token + "\n\n"
                    + "The token expires in 7 days and can only be used once.\n\n"
                    + "— GymPro");
            mailSender.send(msg);
        } catch (Exception e) {
            log.warn("Failed to send invite email to {}: {}", toEmail, e.getMessage());
        }
    }
}
