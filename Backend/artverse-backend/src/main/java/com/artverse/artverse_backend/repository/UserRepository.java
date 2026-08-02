package com.artverse.artverse_backend.repository;

import com.artverse.artverse_backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Boolean existsByEmail(String email);
    List<User> findTop20ByNameContainingIgnoreCaseAndEmailNot(String name, String email);
}