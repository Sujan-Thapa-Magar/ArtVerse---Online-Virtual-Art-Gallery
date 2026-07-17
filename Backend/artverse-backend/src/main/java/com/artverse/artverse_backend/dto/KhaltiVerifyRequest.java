package com.artverse.artverse_backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class KhaltiVerifyRequest {

    @NotBlank(message = "Missing payment reference.")
    private String pidx;

    @NotBlank(message = "Missing purchase order reference.")
    private String purchaseOrderId;
}
