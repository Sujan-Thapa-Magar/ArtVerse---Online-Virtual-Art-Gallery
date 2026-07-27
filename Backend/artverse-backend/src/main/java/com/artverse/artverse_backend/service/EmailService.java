package com.artverse.artverse_backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * Sends email in a background thread. Split into its own bean because
 * Spring's @Async proxy only intercepts calls made from a different bean —
 * a self-invoked call (e.g. NotificationService calling its own method)
 * would silently run synchronously and block the request thread on the
 * SMTP round trip.
 */
@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Async
    public void send(String to, String subject, String body) {
        try {
            SimpleMailMessage email = new SimpleMailMessage();
            email.setTo(to);
            email.setSubject(subject);
            email.setText(body);
            email.setFrom("itsmesujan2003@gmail.com");
            mailSender.send(email);
        } catch (Exception e) {
            System.out.println("Email sending failed: " + e.getMessage());
        }
    }
}
