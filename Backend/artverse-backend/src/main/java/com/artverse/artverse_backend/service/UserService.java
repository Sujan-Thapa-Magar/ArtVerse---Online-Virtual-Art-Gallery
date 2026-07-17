package com.artverse.artverse_backend.service;

import com.artverse.artverse_backend.config.JwtUtil;
import com.artverse.artverse_backend.dto.LoginRequest;
import com.artverse.artverse_backend.dto.RegisterRequest;
import com.artverse.artverse_backend.model.User;
import com.artverse.artverse_backend.repository.UserRepository;
import com.artverse.artverse_backend.util.InputSanitizer;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService implements UserDetailsService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final GoogleAuthService googleAuthService;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
    }

    public User registerUser(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }
        User user = new User();
        user.setName(InputSanitizer.stripHtml(request.getName()));
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(request.getRole());
        user.setIsVerified(false);
        if (request.getIdCardUrl() != null) {
            user.setIdCardUrl(request.getIdCardUrl());
        }
        return userRepository.save(user);
    }

    public String loginUser(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid password");
        }
        return jwtUtil.generateToken(user.getEmail(), user.getRole().name());
    }

    /**
     * Verifies the Google ID token, then logs the matching user in (creating
     * a new BUYER account on first sign-in), and returns our own JWT — same
     * shape as loginUser — so the frontend's login flow doesn't need to branch.
     */
    public String loginWithGoogle(String idToken) {
        GoogleAuthService.GoogleUser googleUser = googleAuthService.verify(idToken);

        User user = userRepository.findByEmail(googleUser.email()).orElseGet(() -> {
            User u = new User();
            u.setName(InputSanitizer.stripHtml(googleUser.name()));
            u.setEmail(googleUser.email());
            // Google-authenticated accounts never use a password, but the
            // column is NOT NULL — store a random hash nobody can ever enter.
            u.setPassword(passwordEncoder.encode(java.util.UUID.randomUUID().toString()));
            u.setRole(User.Role.BUYER);
            u.setIsVerified(false);
            return userRepository.save(u);
        });

        return jwtUtil.generateToken(user.getEmail(), user.getRole().name());
    }
}