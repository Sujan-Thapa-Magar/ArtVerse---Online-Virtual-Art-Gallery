package com.artverse.artverse_backend.repository;

import com.artverse.artverse_backend.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUser_IdOrderByCreatedAtDesc(Long userId);
    long countByUser_IdAndIsRead(Long userId, boolean isRead);
}