package com.artverse.artverse_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.List;

public class ExhibitionRequest {
    @NotBlank(message = "Title is required.")
    @Size(max = 200, message = "Title must be at most 200 characters.")
    private String title;

    @Size(max = 2000, message = "Description must be at most 2000 characters.")
    private String description;

    private LocalDate startDate;
    private LocalDate endDate;
    private List<Long> artworkIds;

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
    public List<Long> getArtworkIds() { return artworkIds; }
    public void setArtworkIds(List<Long> artworkIds) { this.artworkIds = artworkIds; }
}