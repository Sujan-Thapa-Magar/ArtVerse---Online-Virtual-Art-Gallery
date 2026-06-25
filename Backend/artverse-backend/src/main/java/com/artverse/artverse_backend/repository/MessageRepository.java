package com.artverse.artverse_backend.repository;

import com.artverse.artverse_backend.model.Message;
import com.artverse.artverse_backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {

    @Query("SELECT m FROM Message m WHERE " +
           "(m.sender.id = :userId1 AND m.receiver.id = :userId2) OR " +
           "(m.sender.id = :userId2 AND m.receiver.id = :userId1) " +
           "ORDER BY m.createdAt ASC")
    List<Message> findConversation(@Param("userId1") Long userId1,
                                   @Param("userId2") Long userId2);

    List<Message> findBySender_IdOrReceiver_IdOrderByCreatedAtDesc(Long senderId, Long receiverId);

    long countByReceiver_IdAndIsRead(Long receiverId, boolean isRead);
}
