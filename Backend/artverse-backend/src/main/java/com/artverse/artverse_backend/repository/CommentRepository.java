package com.artverse.artverse_backend.repository;

import com.artverse.artverse_backend.model.Comment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {
    List<Comment> findByArtwork_IdOrderByCreatedAtDesc(Long artworkId);
}