package com.artverse.artverse_backend.repository;

import com.artverse.artverse_backend.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByBuyer_IdOrderByCreatedAtDesc(Long buyerId);
    long countByBuyer_Id(Long buyerId);
}