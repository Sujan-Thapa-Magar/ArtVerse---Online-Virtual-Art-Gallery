package com.artverse.artverse_backend.controller;

import com.artverse.artverse_backend.model.User;
import com.artverse.artverse_backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

/**
 * Self-service profile management — every logged-in user (buyer, artist,
 * admin) can view and edit their OWN account here. Email and role are
 * intentionally not editable through this endpoint: email is the JWT
 * subject, and role changes are an admin-only action (see AdminController).
 */
@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:5173")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    private final String UPLOAD_DIR = "/media/sujan/BC6C5E616C5E168C/ArtVerse/Backend/artverse-backend/uploads/";

    @GetMapping("/me")
    public ResponseEntity<?> getMe(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(user);
    }

    @PutMapping("/me")
    public ResponseEntity<?> updateMe(
            @RequestParam(value = "name", required = false) String name,
            @RequestParam(value = "bio", required = false) String bio,
            @RequestParam(value = "currentPassword", required = false) String currentPassword,
            @RequestParam(value = "newPassword", required = false) String newPassword,
            @RequestParam(value = "photo", required = false) MultipartFile photo,
            Authentication authentication) {
        try {
            User user = userRepository.findByEmail(authentication.getName())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            if (name != null && !name.isBlank()) {
                user.setName(name);
            }
            if (bio != null) {
                user.setBio(bio);
            }

            if (newPassword != null && !newPassword.isBlank()) {
                if (currentPassword == null || currentPassword.isBlank()) {
                    throw new RuntimeException("Enter your current password to set a new one.");
                }
                if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
                    throw new RuntimeException("Current password is incorrect.");
                }
                if (newPassword.length() < 6) {
                    throw new RuntimeException("New password must be at least 6 characters.");
                }
                user.setPassword(passwordEncoder.encode(newPassword));
            }

            if (photo != null && !photo.isEmpty()) {
                if (photo.getContentType() == null || !photo.getContentType().startsWith("image/")) {
                    throw new RuntimeException("Profile photo must be an image file.");
                }
                Path uploadPath = Paths.get(UPLOAD_DIR);
                if (!Files.exists(uploadPath)) {
                    Files.createDirectories(uploadPath);
                }
                String originalFilename = photo.getOriginalFilename();
                String extension = (originalFilename != null && originalFilename.contains("."))
                        ? originalFilename.substring(originalFilename.lastIndexOf("."))
                        : "";
                String uniqueFilename = "avatar_" + UUID.randomUUID() + extension;
                Path filePath = uploadPath.resolve(uniqueFilename);
                Files.copy(photo.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
                // Stored as a bare filename — frontend builds the URL as `${API}/${profilePhoto}`,
                // matching how static-locations serves the uploads directory at the root.
                user.setProfilePhoto(uniqueFilename);
            }

            User saved = userRepository.save(user);
            return ResponseEntity.ok(saved);
        } catch (IOException e) {
            return ResponseEntity.badRequest().body("Failed to save profile photo.");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
