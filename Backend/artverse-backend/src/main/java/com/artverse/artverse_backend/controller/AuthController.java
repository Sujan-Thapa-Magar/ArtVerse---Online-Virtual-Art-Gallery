package com.artverse.artverse_backend.controller;

import com.artverse.artverse_backend.dto.LoginRequest;
import com.artverse.artverse_backend.dto.RegisterRequest;
import com.artverse.artverse_backend.model.User;
import com.artverse.artverse_backend.service.UserService;
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
    public ResponseEntity<?> register(
            @RequestParam("name") String name,
            @RequestParam("email") String email,
            @RequestParam("password") String password,
            @RequestParam("role") String role,
            @RequestParam(value = "idCard", required = false) MultipartFile idCard) {

        try {
            RegisterRequest request = new RegisterRequest();
            request.setName(name);
            request.setEmail(email);
            request.setPassword(password);
            request.setRole(User.Role.valueOf(role.toUpperCase()));

            // Save ID card if provided
            if (idCard != null && !idCard.isEmpty()) {
                Path uploadPath = Paths.get(UPLOAD_DIR);
                if (!Files.exists(uploadPath)) {
                    Files.createDirectories(uploadPath);
                }
                String originalFilename = idCard.getOriginalFilename();
                String extension = originalFilename.substring(originalFilename.lastIndexOf("."));
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
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            String token = userService.loginUser(request);
            return ResponseEntity.ok(token);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}