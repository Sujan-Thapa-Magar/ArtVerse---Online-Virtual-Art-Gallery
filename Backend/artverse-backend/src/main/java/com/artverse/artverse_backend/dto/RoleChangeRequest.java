package com.artverse.artverse_backend.dto;

import com.artverse.artverse_backend.model.User;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class RoleChangeRequest {

    @NotNull(message = "Role is required.")
    private User.Role role;
}
