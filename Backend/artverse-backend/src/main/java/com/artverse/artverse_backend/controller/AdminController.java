package com.artverse.artverse_backend.controller;

import com.artverse.artverse_backend.model.Order;
import com.artverse.artverse_backend.model.User;
import com.artverse.artverse_backend.repository.OrderRepository;
import com.artverse.artverse_backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
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
            @RequestBody Map<String, String> body) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (body.containsKey("name") && !body.get("name").isBlank()) {
            user.setName(body.get("name"));
        }
        if (body.containsKey("email") && !body.get("email").isBlank()) {
            user.setEmail(body.get("email"));
        }
        if (body.containsKey("bio")) {
            user.setBio(body.get("bio"));
        }
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "User updated successfully"));
    }

    @PutMapping("/users/{id}/role")
    public ResponseEntity<?> changeRole(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        try {
            User.Role newRole = User.Role.valueOf(body.get("role").toUpperCase());
            user.setRole(newRole);
            userRepository.save(user);
            return ResponseEntity.ok(Map.of("message", "Role updated to " + newRole));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Invalid role. Use ARTIST, BUYER, or ADMIN");
        }
    }

    @PutMapping("/users/{id}/verify")
    public ResponseEntity<?> verifyArtist(
            @PathVariable Long id,
            @RequestBody Map<String, Boolean> body) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setIsVerified(body.get("verified"));
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
            @RequestBody Map<String, String> body) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        try {
            Order.Status newStatus = Order.Status.valueOf(body.get("status").toUpperCase());
            order.setStatus(newStatus);
            orderRepository.save(order);
            return ResponseEntity.ok(Map.of("message", "Order status updated to " + newStatus));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Invalid status.");
        }
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