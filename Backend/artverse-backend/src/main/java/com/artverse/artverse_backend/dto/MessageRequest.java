package com.artverse.artverse_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class MessageRequest {

    @NotBlank(message = "Message cannot be empty.")
    @Size(max = 2000, message = "Message must be at most 2000 characters.")
    private String content;
}
