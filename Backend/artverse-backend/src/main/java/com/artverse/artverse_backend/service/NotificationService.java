package com.artverse.artverse_backend.service;

import com.artverse.artverse_backend.model.Notification;
import com.artverse.artverse_backend.model.User;
import com.artverse.artverse_backend.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private EmailService emailService;

    // Create and save a notification, then send email in the background —
    // the caller (like/follow/comment/order) returns its HTTP response as
    // soon as the DB save completes, without waiting on the SMTP round trip.
    public void sendNotification(User recipient, String type, String message) {
        Notification notification = new Notification();
        notification.setUser(recipient);
        notification.setType(type);
        notification.setMessage(message);
        notificationRepository.save(notification);

        emailService.send(
                recipient.getEmail(),
                "ArtVerse — " + formatType(type),
                message + "\n\nVisit ArtVerse to see more.\n\nThe ArtVerse Team"
        );
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