package com.artverse.artverse_backend.service;

import com.artverse.artverse_backend.model.Artwork;
import com.artverse.artverse_backend.model.Order;
import com.artverse.artverse_backend.model.User;
import com.artverse.artverse_backend.repository.ArtworkRepository;
import com.artverse.artverse_backend.repository.OrderRepository;
import com.artverse.artverse_backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class OrderService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private ArtworkRepository artworkRepository;

    @Autowired
    private UserRepository userRepository;

    public Order buyNow(Long artworkId, String buyerEmail) {
        User buyer = userRepository.findByEmail(buyerEmail)
                .orElseThrow(() -> new RuntimeException("Buyer not found"));

        Artwork artwork = artworkRepository.findById(artworkId)
                .orElseThrow(() -> new RuntimeException("Artwork not found"));

        Order order = new Order();
        order.setBuyer(buyer);
        order.setArtwork(artwork);
        order.setPricePaid(artwork.getPrice());
        order.setStatus(Order.Status.PENDING);

        return orderRepository.save(order);
    }

    public List<Order> getMyOrders(String buyerEmail) {
        User buyer = userRepository.findByEmail(buyerEmail)
                .orElseThrow(() -> new RuntimeException("Buyer not found"));

        return orderRepository.findByBuyer_IdOrderByCreatedAtDesc(buyer.getId());
    }

    public long countMyOrders(String buyerEmail) {
        User buyer = userRepository.findByEmail(buyerEmail)
                .orElseThrow(() -> new RuntimeException("Buyer not found"));

        return orderRepository.countByBuyer_Id(buyer.getId());
    }
}