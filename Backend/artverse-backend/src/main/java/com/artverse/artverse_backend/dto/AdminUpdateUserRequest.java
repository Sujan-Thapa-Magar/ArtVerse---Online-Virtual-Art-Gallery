package com.artverse.artverse_backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Partial update — every field is optional (null = leave unchanged), but
 * anything present is validated. Used by admins to edit any user's account.
 */
@Data
public class AdminUpdateUserRequest {

    @Size(max = 100, message = "Name must be at most 100 characters.")
    private String name;

    @Email(message = "Invalid email format")
    @Size(max = 150, message = "Email must be at most 150 characters.")
    private String email;

    @Size(max = 1000, message = "Bio must be at most 1000 characters.")
    private String bio;

    @Size(min = 6, max = 100, message = "Password must be at least 6 characters.")
    private String password;
}
