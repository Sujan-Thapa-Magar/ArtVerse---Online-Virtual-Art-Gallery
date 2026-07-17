package com.artverse.artverse_backend.service;

import com.artverse.artverse_backend.model.Artwork;
import com.artverse.artverse_backend.model.Exhibition;
import com.artverse.artverse_backend.model.ExhibitionArtwork;
import com.artverse.artverse_backend.model.User;
import com.artverse.artverse_backend.repository.ArtworkRepository;
import com.artverse.artverse_backend.repository.ExhibitionArtworkRepository;
import com.artverse.artverse_backend.repository.ExhibitionRepository;
import com.artverse.artverse_backend.util.InputSanitizer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class ExhibitionService {

    @Autowired
    private ExhibitionRepository exhibitionRepository;

    @Autowired
    private ExhibitionArtworkRepository exhibitionArtworkRepository;

    @Autowired
    private ArtworkRepository artworkRepository;

    public Exhibition createExhibition(User artist, String title, String description,
                                       LocalDate startDate, LocalDate endDate) {
        Exhibition exhibition = new Exhibition();
        exhibition.setArtist(artist);
        exhibition.setTitle(InputSanitizer.stripHtml(title));
        exhibition.setDescription(InputSanitizer.stripHtml(description));
        exhibition.setStartDate(startDate);
        exhibition.setEndDate(endDate);
        return exhibitionRepository.save(exhibition);
    }

    public Exhibition getById(Long id) {
        return exhibitionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Exhibition not found"));
    }

    public List<Exhibition> getAll() {
        return exhibitionRepository.findAllByOrderByIdDesc();
    }

    public List<Exhibition> getByArtist(Long artistId) {
        return exhibitionRepository.findByArtist_IdOrderByIdDesc(artistId);
    }

    public Exhibition updateExhibition(Long id, String title, String description,
                                       LocalDate startDate, LocalDate endDate) {
        Exhibition exhibition = getById(id);
        if (title != null) exhibition.setTitle(InputSanitizer.stripHtml(title));
        if (description != null) exhibition.setDescription(InputSanitizer.stripHtml(description));
        exhibition.setStartDate(startDate);
        exhibition.setEndDate(endDate);
        return exhibitionRepository.save(exhibition);
    }

    public void deleteExhibition(Long id) {
        List<ExhibitionArtwork> links = exhibitionArtworkRepository.findByExhibition_Id(id);
        exhibitionArtworkRepository.deleteAll(links);
        exhibitionRepository.deleteById(id);
    }

    public List<Artwork> getArtworksForExhibition(Long exhibitionId) {
        List<ExhibitionArtwork> links = exhibitionArtworkRepository.findByExhibition_Id(exhibitionId);
        return links.stream().map(ExhibitionArtwork::getArtwork).toList();
    }

    public ExhibitionArtwork addArtwork(Long exhibitionId, Long artworkId) {
        boolean alreadyExists = exhibitionArtworkRepository
                .findByExhibition_IdAndArtwork_Id(exhibitionId, artworkId)
                .isPresent();
        if (alreadyExists) {
            throw new RuntimeException("Artwork already in this exhibition");
        }

        Exhibition exhibition = getById(exhibitionId);
        Artwork artwork = artworkRepository.findById(artworkId)
                .orElseThrow(() -> new RuntimeException("Artwork not found"));

        ExhibitionArtwork link = new ExhibitionArtwork();
        link.setExhibition(exhibition);
        link.setArtwork(artwork);
        return exhibitionArtworkRepository.save(link);
    }

    public void removeArtwork(Long exhibitionId, Long artworkId) {
        exhibitionArtworkRepository.deleteByExhibition_IdAndArtwork_Id(exhibitionId, artworkId);
    }
}