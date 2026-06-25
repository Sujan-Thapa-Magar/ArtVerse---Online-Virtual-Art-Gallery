package com.artverse.artverse_backend.controller;

import com.artverse.artverse_backend.model.Order;
import com.artverse.artverse_backend.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    @Autowired
    private OrderService orderService;

    // Buy Now — creates an order instantly
    @PostMapping("/{artworkId}")
    public ResponseEntity<Order> buyNow(
            @PathVariable Long artworkId,
            @AuthenticationPrincipal UserDetails userDetails) {
        Order order = orderService.buyNow(artworkId, userDetails.getUsername());
        return ResponseEntity.ok(order);
    }

    // Get logged-in buyer's orders
    @GetMapping("/my")
    public ResponseEntity<List<Order>> getMyOrders(
            @AuthenticationPrincipal UserDetails userDetails) {
        List<Order> orders = orderService.getMyOrders(userDetails.getUsername());
        return ResponseEntity.ok(orders);
    }
}