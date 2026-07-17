package com.artverse.artverse_backend.dto;

import com.artverse.artverse_backend.model.Order;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class OrderStatusRequest {

    // Enum-typed rather than String — Jackson rejects anything that isn't a
    // real Order.Status value before this even reaches the controller.
    @NotNull(message = "Status is required.")
    private Order.Status status;
}
