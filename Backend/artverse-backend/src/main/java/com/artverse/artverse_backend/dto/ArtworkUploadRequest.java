package com.artverse.artverse_backend.dto;

public class ArtworkUploadRequest {

    private String title;
    private String description;
    private String medium;
    private String dimensions;
    private String category;
    private Double price;
    private boolean isForSale;

    // --- Getters and Setters ---

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getMedium() { return medium; }
    public void setMedium(String medium) { this.medium = medium; }

    public String getDimensions() { return dimensions; }
    public void setDimensions(String dimensions) { this.dimensions = dimensions; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public Double getPrice() { return price; }
    public void setPrice(Double price) { this.price = price; }

    public boolean isForSale() { return isForSale; }
    public void setForSale(boolean forSale) { isForSale = forSale; }
}