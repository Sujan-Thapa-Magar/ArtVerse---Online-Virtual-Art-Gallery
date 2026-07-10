package com.artverse.artverse_backend.repository;

import com.artverse.artverse_backend.model.Exhibition;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ExhibitionRepository extends JpaRepository<Exhibition, Long> {
    List<Exhibition> findByArtist_IdOrderByIdDesc(Long artistId);
    List<Exhibition> findAllByOrderByIdDesc();
}