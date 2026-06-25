package com.artverse.artverse_backend.repository;

import com.artverse.artverse_backend.model.Like;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface LikeRepository extends JpaRepository<Like, Long> {
    Optional<Like> findByUser_IdAndArtwork_Id(Long userId, Long artworkId);
    long countByArtwork_Id(Long artworkId);
    boolean existsByUser_IdAndArtwork_Id(Long userId, Long artworkId);
    List<Like> findByUser_Id(Long userId);
}