package com.artverse.artverse_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CommentRequest {

    @NotBlank(message = "Comment text cannot be empty.")
    @Size(max = 1000, message = "Comment must be at most 1000 characters.")
    private String text;
}
