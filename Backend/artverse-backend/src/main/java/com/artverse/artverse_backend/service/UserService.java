package com.artverse.artverse_backend.service;

import com.artverse.artverse_backend.config.JwtUtil;
import com.artverse.artverse_backend.dto.LoginRequest;
import com.artverse.artverse_backend.dto.RegisterRequest;
import com.artverse.artverse_backend.model.User;
import com.artverse.artverse_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.ArrayList;

@Service
@RequiredArgsConstructor
public class UserService implements UserDetailsService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    // -----------------------------------------------
    // Required by Spring Security — loads user by email
    // -----------------------------------------------
    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));

        return new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                user.getPassword(),
                new ArrayList<>()
        );
    }

    // -----------------------------------------------
    // Register a new user
    // -----------------------------------------------
    public User registerUser(RegisterRequest request) {

        // Check if email already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }

        // Create new user
        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(request.getRole());
        user.setIsVerified(false);

        return userRepository.save(user);
    }

    // -----------------------------------------------
    // Login — returns JWT token if credentials are valid
    // -----------------------------------------------
    public String loginUser(LoginRequest request) {

        // Find user by email
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Check password
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid password");
        }

        // Generate and return JWT token
        return jwtUtil.generateToken(user.getEmail());
    }
}