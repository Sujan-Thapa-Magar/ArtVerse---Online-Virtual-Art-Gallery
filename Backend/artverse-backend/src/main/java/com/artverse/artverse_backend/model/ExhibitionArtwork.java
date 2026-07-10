package com.artverse.artverse_backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "exhibition_artworks", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"exhibition_id", "artwork_id"})
})
public class ExhibitionArtwork {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "exhibition_id", nullable = false)
    private Exhibition exhibition;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "artwork_id", nullable = false)
    private Artwork artwork;

    public Long getId() { return id; }
    public Exhibition getExhibition() { return exhibition; }
    public void setExhibition(Exhibition exhibition) { this.exhibition = exhibition; }
    public Artwork getArtwork() { return artwork; }
    public void setArtwork(Artwork artwork) { this.artwork = artwork; }
}