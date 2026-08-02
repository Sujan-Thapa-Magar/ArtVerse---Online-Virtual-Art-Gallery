package com.artverse.artverse_backend.dto;

import com.artverse.artverse_backend.model.User;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

@Data
public class RegisterRequest {

    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    @Pattern(
            regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).+$",
            message = "Password must contain at least one uppercase letter, one lowercase letter, and one special character."
    )
    private String password;

    @NotNull(message = "Role is required")
    private User.Role role = User.Role.BUYER;

    private String idCardUrl;

    // Bound directly from the multipart form — not persisted as-is,
    // used only to read the uploaded file in the controller
    private MultipartFile idCard;
}