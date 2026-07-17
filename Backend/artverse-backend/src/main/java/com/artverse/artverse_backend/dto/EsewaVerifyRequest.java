package com.artverse.artverse_backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class EsewaVerifyRequest {

    @NotBlank(message = "Missing transaction reference.")
    private String transactionUuid;
}
