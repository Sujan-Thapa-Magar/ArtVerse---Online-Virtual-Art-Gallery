package com.artverse.artverse_backend.repository;

import com.artverse.artverse_backend.model.ExhibitionArtwork;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ExhibitionArtworkRepository extends JpaRepository<ExhibitionArtwork, Long> {
    List<ExhibitionArtwork> findByExhibition_Id(Long exhibitionId);
    Optional<ExhibitionArtwork> findByExhibition_IdAndArtwork_Id(Long exhibitionId, Long artworkId);
    void deleteByExhibition_IdAndArtwork_Id(Long exhibitionId, Long artworkId);
    void deleteByArtwork_Id(Long artworkId);
}