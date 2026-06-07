package com.artverse.artverse_backend.repository;

import com.artverse.artverse_backend.model.Artwork;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ArtworkRepository extends JpaRepository<Artwork, Long> {

    // Get all artworks by a specific artist
    List<Artwork> findByArtistId(Long artistId);

    // Get all artworks sorted by newest first
    List<Artwork> findAllByOrderByCreatedAtDesc();
}