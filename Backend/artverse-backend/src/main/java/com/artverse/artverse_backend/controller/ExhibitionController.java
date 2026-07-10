package com.artverse.artverse_backend.controller;

import com.artverse.artverse_backend.dto.ExhibitionRequest;
import com.artverse.artverse_backend.model.Artwork;
import com.artverse.artverse_backend.model.Exhibition;
import com.artverse.artverse_backend.model.User;
import com.artverse.artverse_backend.repository.UserRepository;
import com.artverse.artverse_backend.service.ExhibitionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/exhibitions")
public class ExhibitionController {

    @Autowired private ExhibitionService exhibitionService;
    @Autowired private UserRepository userRepository;

    private User currentUser(Authentication auth) {
        return userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private void assertOwner(Exhibition exhibition, User user) {
        if (!exhibition.getArtist().getId().equals(user.getId())) {
            throw new RuntimeException("You do not have permission to modify this exhibition");
        }
    }

    @PostMapping
    public ResponseEntity<?> createExhibition(@RequestBody ExhibitionRequest req, Authentication auth) {
        User artist = currentUser(auth);

        Exhibition exhibition = exhibitionService.createExhibition(
                artist, req.getTitle(), req.getDescription(), req.getStartDate(), req.getEndDate());

        if (req.getArtworkIds() != null) {
            for (Long artworkId : req.getArtworkIds()) {
                exhibitionService.addArtwork(exhibition.getId(), artworkId);
            }
        }

        return ResponseEntity.ok(exhibition);
    }

    @GetMapping
    public ResponseEntity<List<Exhibition>> getAllExhibitions() {
        return ResponseEntity.ok(exhibitionService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getExhibitionDetail(@PathVariable Long id) {
        Exhibition exhibition = exhibitionService.getById(id);
        List<Artwork> artworks = exhibitionService.getArtworksForExhibition(id);
        return ResponseEntity.ok(Map.of("exhibition", exhibition, "artworks", artworks));
    }

    @GetMapping("/my")
    public ResponseEntity<List<Exhibition>> getMyExhibitions(Authentication auth) {
        User artist = currentUser(auth);
        return ResponseEntity.ok(exhibitionService.getByArtist(artist.getId()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateExhibition(@PathVariable Long id, @RequestBody ExhibitionRequest req, Authentication auth) {
        User user = currentUser(auth);
        Exhibition exhibition = exhibitionService.getById(id);
        assertOwner(exhibition, user);

        Exhibition updated = exhibitionService.updateExhibition(
                id, req.getTitle(), req.getDescription(), req.getStartDate(), req.getEndDate());
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteExhibition(@PathVariable Long id, Authentication auth) {
        User user = currentUser(auth);
        Exhibition exhibition = exhibitionService.getById(id);
        assertOwner(exhibition, user);

        exhibitionService.deleteExhibition(id);
        return ResponseEntity.ok(Map.of("deleted", true));
    }

    @PostMapping("/{id}/artworks/{artworkId}")
    public ResponseEntity<?> addArtwork(@PathVariable Long id, @PathVariable Long artworkId, Authentication auth) {
        User user = currentUser(auth);
        Exhibition exhibition = exhibitionService.getById(id);
        assertOwner(exhibition, user);

        exhibitionService.addArtwork(id, artworkId);
        return ResponseEntity.ok(exhibitionService.getArtworksForExhibition(id));
    }

    @DeleteMapping("/{id}/artworks/{artworkId}")
    public ResponseEntity<?> removeArtwork(@PathVariable Long id, @PathVariable Long artworkId, Authentication auth) {
        User user = currentUser(auth);
        Exhibition exhibition = exhibitionService.getById(id);
        assertOwner(exhibition, user);

        exhibitionService.removeArtwork(id, artworkId);
        return ResponseEntity.ok(exhibitionService.getArtworksForExhibition(id));
    }
}