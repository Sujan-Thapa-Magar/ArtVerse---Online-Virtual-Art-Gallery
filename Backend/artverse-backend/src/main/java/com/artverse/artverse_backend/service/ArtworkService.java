package com.artverse.artverse_backend.service;

import com.artverse.artverse_backend.dto.ArtworkUploadRequest;
import com.artverse.artverse_backend.model.Artwork;
import com.artverse.artverse_backend.model.User;
import com.artverse.artverse_backend.repository.ArtworkRepository;
import com.artverse.artverse_backend.repository.UserRepository;
import com.artverse.artverse_backend.util.InputSanitizer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.*;
import java.util.List;
import java.util.UUID;

@Service
public class ArtworkService {

    private final String UPLOAD_DIR = "/media/sujan/BC6C5E616C5E168C/ArtVerse/Backend/artverse-backend/uploads/";

    @Autowired
    private ArtworkRepository artworkRepository;

    @Autowired
    private UserRepository userRepository;

    public Artwork uploadArtwork(ArtworkUploadRequest request,
                                 MultipartFile imageFile,
                                 String artistEmail) throws IOException {

        User artist = userRepository.findByEmail(artistEmail)
                .orElseThrow(() -> new RuntimeException("Artist not found"));

        Path uploadPath = Paths.get(UPLOAD_DIR);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        String extension = InputSanitizer.safeImageExtension(imageFile.getOriginalFilename());
        String uniqueFilename = UUID.randomUUID().toString() + extension;

        Path filePath = uploadPath.resolve(uniqueFilename);
        Files.copy(imageFile.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        Artwork artwork = new Artwork();
        artwork.setArtist(artist);
        artwork.setTitle(request.getTitle());
        artwork.setDescription(request.getDescription());
        artwork.setMedium(request.getMedium());
        artwork.setDimensions(request.getDimensions());
        artwork.setCategory(request.getCategory());
        artwork.setForSale(request.isForSale());
        artwork.setImageUrl("http://localhost:8080/" + uniqueFilename);
        if (request.getPrice() != null) {
            artwork.setPrice(BigDecimal.valueOf(request.getPrice()));
        }

        return artworkRepository.save(artwork);
    }

    public List<Artwork> getAllArtworks() {
        return artworkRepository.findAllByOrderByCreatedAtDesc();
    }

    public Artwork getArtworkById(Long id, String viewerEmail) {
        Artwork artwork = artworkRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Artwork not found with id: " + id));

        boolean isOwner = viewerEmail != null
                && artwork.getArtist() != null
                && viewerEmail.equals(artwork.getArtist().getEmail());

        if (!isOwner) {
            artwork.setViewCount((artwork.getViewCount() == null ? 0L : artwork.getViewCount()) + 1);
            artwork = artworkRepository.save(artwork);
        }

        return artwork;
    }

    public List<Artwork> getArtworksByArtist(Long artistId) {
        return artworkRepository.findByArtistId(artistId);
    }

    public void deleteArtwork(Long id, String artistEmail) {
        Artwork artwork = artworkRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Artwork not found"));

        if (!artwork.getArtist().getEmail().equals(artistEmail)) {
            throw new RuntimeException("You are not allowed to delete this artwork");
        }

        artworkRepository.deleteById(id);
    }

    public Artwork updateArtwork(Long id, String artistEmail, ArtworkUploadRequest request) {
        Artwork artwork = artworkRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Artwork not found"));

        if (!artwork.getArtist().getEmail().equals(artistEmail)) {
            throw new RuntimeException("You are not allowed to edit this artwork");
        }

        if (request.getTitle() != null) artwork.setTitle(request.getTitle());
        if (request.getDescription() != null) artwork.setDescription(request.getDescription());
        if (request.getMedium() != null) artwork.setMedium(request.getMedium());
        if (request.getDimensions() != null) artwork.setDimensions(request.getDimensions());
        if (request.getCategory() != null) artwork.setCategory(request.getCategory());
        if (request.getPrice() != null) artwork.setPrice(BigDecimal.valueOf(request.getPrice()));
        artwork.setForSale(request.isForSale());

        return artworkRepository.save(artwork);
    }
}