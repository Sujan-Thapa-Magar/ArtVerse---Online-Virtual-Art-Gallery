package com.artverse.artverse_backend.controller;

import com.artverse.artverse_backend.dto.AdminUpdateUserRequest;
import com.artverse.artverse_backend.dto.OrderStatusRequest;
import com.artverse.artverse_backend.dto.RoleChangeRequest;
import com.artverse.artverse_backend.dto.VerifyRequest;
import com.artverse.artverse_backend.model.Order;
import com.artverse.artverse_backend.model.User;
import com.artverse.artverse_backend.repository.OrderRepository;
import com.artverse.artverse_backend.repository.UserRepository;
import com.artverse.artverse_backend.util.InputSanitizer;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        if (!userRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        userRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "User deleted successfully"));
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<?> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody AdminUpdateUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (request.getName() != null && !request.getName().isBlank()) {
            user.setName(InputSanitizer.stripHtml(request.getName()));
        }
        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            user.setEmail(request.getEmail());
        }
        if (request.getBio() != null) {
            user.setBio(InputSanitizer.stripHtml(request.getBio()));
        }
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "User updated successfully"));
    }

    @PutMapping("/users/{id}/role")
    public ResponseEntity<?> changeRole(
            @PathVariable Long id,
            @Valid @RequestBody RoleChangeRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setRole(request.getRole());
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "Role updated to " + request.getRole()));
    }

    @PutMapping("/users/{id}/verify")
    public ResponseEntity<?> verifyArtist(
            @PathVariable Long id,
            @Valid @RequestBody VerifyRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setIsVerified(request.getVerified());
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "User verification updated"));
    }

    @GetMapping("/orders")
    public ResponseEntity<List<Order>> getAllOrders() {
        return ResponseEntity.ok(orderRepository.findAll());
    }

    @PutMapping("/orders/{id}/status")
    public ResponseEntity<?> updateOrderStatus(
            @PathVariable Long id,
            @Valid @RequestBody OrderStatusRequest request) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        order.setStatus(request.getStatus());
        orderRepository.save(order);
        return ResponseEntity.ok(Map.of("message", "Order status updated to " + request.getStatus()));
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Long>> getStats() {
        long totalUsers = userRepository.count();
        long totalOrders = orderRepository.count();
        long totalArtists = userRepository.findAll().stream()
                .filter(u -> u.getRole() == User.Role.ARTIST).count();
        long totalBuyers = userRepository.findAll().stream()
                .filter(u -> u.getRole() == User.Role.BUYER).count();
        return ResponseEntity.ok(Map.of(
                "totalUsers", totalUsers,
                "totalOrders", totalOrders,
                "totalArtists", totalArtists,
                "totalBuyers", totalBuyers
        ));
    }
}