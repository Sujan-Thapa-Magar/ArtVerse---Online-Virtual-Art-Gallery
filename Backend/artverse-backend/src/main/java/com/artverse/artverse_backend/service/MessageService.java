package com.artverse.artverse_backend.service;

import com.artverse.artverse_backend.model.Message;
import com.artverse.artverse_backend.model.User;
import com.artverse.artverse_backend.repository.MessageRepository;
import com.artverse.artverse_backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class MessageService {

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private UserRepository userRepository;

    public Message sendMessage(Long receiverId, String content, String senderEmail) {
        User sender = userRepository.findByEmail(senderEmail)
                .orElseThrow(() -> new RuntimeException("Sender not found"));

        User receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new RuntimeException("Receiver not found"));

        Message message = new Message();
        message.setSender(sender);
        message.setReceiver(receiver);
        message.setContent(content);

        return messageRepository.save(message);
    }

    public List<Message> getConversation(Long otherUserId, String currentUserEmail) {
        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Message> messages = messageRepository.findConversation(
                currentUser.getId(), otherUserId);

        messages.stream()
                .filter(m -> m.getReceiver().getId().equals(currentUser.getId()) && !m.isRead())
                .forEach(m -> {
                    m.setRead(true);
                    messageRepository.save(m);
                });

        return messages;
    }

    public List<User> getChatPartners(String currentUserEmail) {
        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Message> allMessages = messageRepository
                .findBySender_IdOrReceiver_IdOrderByCreatedAtDesc(
                        currentUser.getId(), currentUser.getId());

        // Extract unique partners
        List<User> partners = new ArrayList<>();
        List<Long> seenIds = new ArrayList<>();

        for (Message m : allMessages) {
            User other = m.getSender().getId().equals(currentUser.getId())
                    ? m.getReceiver()
                    : m.getSender();
            if (!seenIds.contains(other.getId())) {
                seenIds.add(other.getId());
                partners.add(other);
            }
        }

        return partners;
    }

    public long countUnread(String currentUserEmail) {
        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return messageRepository.countByReceiver_IdAndIsRead(currentUser.getId(), false);
    }
}
