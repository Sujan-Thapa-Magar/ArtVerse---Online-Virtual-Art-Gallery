    package com.artverse.artverse_backend.model;
    
    import jakarta.persistence.*;
    import lombok.Data;
    import java.time.LocalDateTime;
    
    @Data
    @Entity
    @Table(name = "users")
    public class User {
    
        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private Long id;
    
        @Column(nullable = false)
        private String name;
    
        @Column(nullable = false, unique = true)
        private String email;
    
        @Column(nullable = false)
        private String password;
    
        @Enumerated(EnumType.STRING)
        @Column(nullable = false)
        private Role role = Role.BUYER;
    
        private String profilePhoto;
    
        private String bio;
    
        private String idCardUrl;
    
        private Boolean isVerified = false;
    
        @Column(updatable = false)
        private LocalDateTime createdAt;
    
        @PrePersist
        protected void onCreate() {
            createdAt = LocalDateTime.now();
        }
    
        public enum Role {
            ARTIST, BUYER, ADMIN
        }
    }