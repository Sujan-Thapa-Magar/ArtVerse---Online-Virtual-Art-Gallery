package com.artverse.artverse_backend.controller;

import com.artverse.artverse_backend.model.Order;
import com.artverse.artverse_backend.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    @Autowired
    private OrderService orderService;

    // Buy Now — creates an order instantly
    @PostMapping("/{artworkId}")
    public ResponseEntity<?> buyNow(
            @PathVariable Long artworkId,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            Order order = orderService.buyNow(artworkId, userDetails.getUsername());
            return ResponseEntity.ok(order);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Get logged-in buyer's orders
    @GetMapping("/my")
    public ResponseEntity<List<Order>> getMyOrders(
            @AuthenticationPrincipal UserDetails userDetails) {
        List<Order> orders = orderService.getMyOrders(userDetails.getUsername());
        return ResponseEntity.ok(orders);
    }

    // Get orders for the logged-in artist's artworks
    @GetMapping("/artist")
    public ResponseEntity<List<Order>> getOrdersForArtist(
            @AuthenticationPrincipal UserDetails userDetails) {
        List<Order> orders = orderService.getOrdersForArtist(userDetails.getUsername());
        return ResponseEntity.ok(orders);
    }

    // Artist updates order status
    @PutMapping("/{orderId}/status")
    public ResponseEntity<?> updateOrderStatus(
            @PathVariable Long orderId,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            Order.Status newStatus = Order.Status.valueOf(body.get("status"));
            Order updated = orderService.updateOrderStatus(orderId, userDetails.getUsername(), newStatus);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}