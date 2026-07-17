package com.artverse.artverse_backend.controller;

import com.artverse.artverse_backend.dto.GoogleAuthRequest;
import com.artverse.artverse_backend.dto.LoginRequest;
import com.artverse.artverse_backend.dto.RegisterRequest;
import com.artverse.artverse_backend.model.User;
import com.artverse.artverse_backend.service.UserService;
import com.artverse.artverse_backend.util.InputSanitizer;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {

    private final UserService userService;

    private final String UPLOAD_DIR = "/media/sujan/BC6C5E616C5E168C/ArtVerse/Backend/artverse-backend/uploads/";

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @ModelAttribute RegisterRequest request) {

        try {
            // idCardUrl must only ever be set by the upload logic below, from
            // a file we actually saved — never trust a client-supplied value
            // for a field that's meant to reference a server-generated URL.
            request.setIdCardUrl(null);

            MultipartFile idCard = request.getIdCard();

            // Save ID card if provided
            if (idCard != null && !idCard.isEmpty()) {
                Path uploadPath = Paths.get(UPLOAD_DIR);
                if (!Files.exists(uploadPath)) {
                    Files.createDirectories(uploadPath);
                }
                String extension = InputSanitizer.safeImageExtension(idCard.getOriginalFilename());
                String uniqueFilename = "id_" + UUID.randomUUID() + extension;
                Path filePath = uploadPath.resolve(uniqueFilename);
                Files.copy(idCard.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
                request.setIdCardUrl("http://localhost:8080/" + uniqueFilename);
            }

            User user = userService.registerUser(request);
            return ResponseEntity.ok("User registered successfully with ID: " + user.getId());
        } catch (RuntimeException | IOException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        try {
            String token = userService.loginUser(request);
            return ResponseEntity.ok(token);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // "Sign in with Google" — frontend posts the ID token it got from Google
    // Identity Services; we verify it server-side and return our own JWT,
    // in the same plain-text shape as /login, so the client handles both identically.
    @PostMapping("/google")
    public ResponseEntity<?> googleLogin(@Valid @RequestBody GoogleAuthRequest request) {
        try {
            String token = userService.loginWithGoogle(request.getIdToken());
            return ResponseEntity.ok(token);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}