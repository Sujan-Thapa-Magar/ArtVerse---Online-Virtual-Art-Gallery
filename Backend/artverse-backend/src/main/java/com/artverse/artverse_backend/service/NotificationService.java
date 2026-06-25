package com.artverse.artverse_backend.service;

import com.artverse.artverse_backend.model.Notification;
import com.artverse.artverse_backend.model.User;
import com.artverse.artverse_backend.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private JavaMailSender mailSender;

    // Create and save a notification + send email
    public void sendNotification(User recipient, String type, String message) {
        // 1. Save to DB
        Notification notification = new Notification();
        notification.setUser(recipient);
        notification.setType(type);
        notification.setMessage(message);
        notificationRepository.save(notification);

        // 2. Send email (in background, don't crash if it fails)
        try {
            SimpleMailMessage email = new SimpleMailMessage();
            email.setTo(recipient.getEmail());
            email.setSubject("ArtVerse — " + formatType(type));
            email.setText(message + "\n\nVisit ArtVerse to see more.\n\nThe ArtVerse Team");
            email.setFrom("itsmesujan2003@gmail.com");
            mailSender.send(email);
        } catch (Exception e) {
            System.out.println("Email sending failed: " + e.getMessage());
        }
    }

    // Get all notifications for a user
    public List<Notification> getMyNotifications(Long userId) {
        return notificationRepository.findByUser_IdOrderByCreatedAtDesc(userId);
    }

    // Count unread notifications
    public long countUnread(Long userId) {
        return notificationRepository.countByUser_IdAndIsRead(userId, false);
    }

    // Mark all as read
    public void markAllRead(Long userId) {
        List<Notification> notifications = notificationRepository.findByUser_IdOrderByCreatedAtDesc(userId);
        notifications.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(notifications);
    }

    private String formatType(String type) {
        return switch (type) {
            case "LIKE" -> "Someone liked your artwork";
            case "COMMENT" -> "Someone commented on your artwork";
            case "FOLLOW" -> "Someone followed you";
            default -> "New notification";
        };
    }
}