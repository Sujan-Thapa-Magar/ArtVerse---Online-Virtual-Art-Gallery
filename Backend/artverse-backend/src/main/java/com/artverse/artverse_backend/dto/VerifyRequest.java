package com.artverse.artverse_backend.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class VerifyRequest {

    @NotNull(message = "verified is required.")
    private Boolean verified;
}
