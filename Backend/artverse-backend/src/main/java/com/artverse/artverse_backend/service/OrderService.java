package com.artverse.artverse_backend.service;

import com.artverse.artverse_backend.model.Artwork;
import com.artverse.artverse_backend.model.Order;
import com.artverse.artverse_backend.model.User;
import com.artverse.artverse_backend.repository.ArtworkRepository;
import com.artverse.artverse_backend.repository.OrderRepository;
import com.artverse.artverse_backend.repository.UserRepository;
import com.artverse.artverse_backend.service.NotificationService;
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

    @Autowired
    private NotificationService notificationService;

    public Order buyNow(Long artworkId, String buyerEmail) {
        User buyer = userRepository.findByEmail(buyerEmail)
                .orElseThrow(() -> new RuntimeException("Buyer not found"));

        Artwork artwork = artworkRepository.findById(artworkId)
                .orElseThrow(() -> new RuntimeException("Artwork not found"));

        if (!artwork.isForSale()) {
            throw new RuntimeException("This artwork is no longer available for sale.");
        }

        Order order = new Order();
        order.setBuyer(buyer);
        order.setArtwork(artwork);
        order.setPricePaid(artwork.getPrice());
        order.setStatus(Order.Status.PENDING);

        Order saved = orderRepository.save(order);

        // Mark artwork as sold so it can't be bought again
        artwork.setForSale(false);
        artworkRepository.save(artwork);

        // Notify the artist that their artwork was purchased
        User artist = artwork.getArtist();
        notificationService.sendNotification(
                artist,
                "ORDER",
                buyer.getName() + " purchased your artwork \"" + artwork.getTitle() + "\" for NPR " + artwork.getPrice()
        );

        // Notify the buyer confirming their order
        notificationService.sendNotification(
                buyer,
                "ORDER",
                "Your order for \"" + artwork.getTitle() + "\" has been placed successfully. NPR " + artwork.getPrice()
        );

        return saved;
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

    // Get all orders for artworks belonging to this artist
    public List<Order> getOrdersForArtist(String artistEmail) {
        User artist = userRepository.findByEmail(artistEmail)
                .orElseThrow(() -> new RuntimeException("Artist not found"));

        return orderRepository.findByArtwork_Artist_IdOrderByCreatedAtDesc(artist.getId());
    }

    // Artist updates order status (PENDING -> IN_TRANSIT -> DELIVERED)
    public Order updateOrderStatus(Long orderId, String artistEmail, Order.Status newStatus) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        if (!order.getArtwork().getArtist().getEmail().equals(artistEmail)) {
            throw new RuntimeException("You are not allowed to update this order");
        }

        order.setStatus(newStatus);
        Order saved = orderRepository.save(order);

        // Notify the buyer of the status change
        notificationService.sendNotification(
                order.getBuyer(),
                "ORDER",
                "Your order for \"" + order.getArtwork().getTitle() + "\" is now " + newStatus + "."
        );

        return saved;
    }
}