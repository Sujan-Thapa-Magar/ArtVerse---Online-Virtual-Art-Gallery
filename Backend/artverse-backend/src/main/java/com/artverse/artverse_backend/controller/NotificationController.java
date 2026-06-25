package com.artverse.artverse_backend.controller;

import com.artverse.artverse_backend.model.Notification;
import com.artverse.artverse_backend.model.User;
import com.artverse.artverse_backend.repository.UserRepository;
import com.artverse.artverse_backend.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private UserRepository userRepository;

    // Get all my notifications
    @GetMapping
    public ResponseEntity<List<Notification>> getMyNotifications(Authentication auth) {
        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(notificationService.getMyNotifications(user.getId()));
    }

    // Count unread notifications
    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(Authentication auth) {
        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        long count = notificationService.countUnread(user.getId());
        return ResponseEntity.ok(Map.of("unreadCount", count));
    }

    // Mark all notifications as read
    @PutMapping("/mark-read")
    public ResponseEntity<?> markAllRead(Authentication auth) {
        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        notificationService.markAllRead(user.getId());
        return ResponseEntity.ok(Map.of("message", "All notifications marked as read"));
    }
}