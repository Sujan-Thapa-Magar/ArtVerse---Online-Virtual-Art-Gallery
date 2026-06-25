package com.artverse.artverse_backend.controller;

import com.artverse.artverse_backend.model.Message;
import com.artverse.artverse_backend.model.User;
import com.artverse.artverse_backend.service.MessageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/messages")
public class MessageController {

    @Autowired
    private MessageService messageService;

    @PostMapping("/{receiverId}")
    public ResponseEntity<Message> sendMessage(
            @PathVariable Long receiverId,
            @RequestBody Map<String, String> body,
            Authentication auth) {

        String content = body.get("content");
        if (content == null || content.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        Message message = messageService.sendMessage(
                receiverId, content.trim(), auth.getName());
        return ResponseEntity.ok(message);
    }

    @GetMapping("/{userId}")
    public ResponseEntity<List<Message>> getConversation(
            @PathVariable Long userId,
            Authentication auth) {
        List<Message> messages = messageService.getConversation(
                userId, auth.getName());
        return ResponseEntity.ok(messages);
    }

    @GetMapping("/conversations")
    public ResponseEntity<List<User>> getChatPartners(Authentication auth) {
        List<User> partners = messageService.getChatPartners(auth.getName());
        return ResponseEntity.ok(partners);
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(Authentication auth) {
        long count = messageService.countUnread(auth.getName());
        return ResponseEntity.ok(Map.of("unreadCount", count));
    }
}
