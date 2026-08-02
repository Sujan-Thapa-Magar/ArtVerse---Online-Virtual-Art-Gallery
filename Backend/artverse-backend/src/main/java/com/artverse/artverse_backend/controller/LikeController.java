package com.artverse.artverse_backend.controller;

import com.artverse.artverse_backend.model.Artwork;
import com.artverse.artverse_backend.model.Like;
import com.artverse.artverse_backend.model.User;
import com.artverse.artverse_backend.repository.ArtworkRepository;
import com.artverse.artverse_backend.repository.LikeRepository;
import com.artverse.artverse_backend.repository.UserRepository;
import com.artverse.artverse_backend.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/likes")
public class LikeController {

    @Autowired private LikeRepository likeRepository;
    @Autowired private ArtworkRepository artworkRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private NotificationService notificationService;

    @PostMapping("/{artworkId}")
    public ResponseEntity<?> toggleLike(@PathVariable Long artworkId, Authentication auth) {
        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Artwork artwork = artworkRepository.findById(artworkId)
                .orElseThrow(() -> new RuntimeException("Artwork not found"));

        Optional<Like> existing = likeRepository.findByUser_IdAndArtwork_Id(user.getId(), artworkId);

        if (existing.isPresent()) {
            likeRepository.delete(existing.get());
            long count = likeRepository.countByArtwork_Id(artworkId);
            return ResponseEntity.ok(Map.of("liked", false, "likeCount", count));
        } else {
            Like like = new Like();
            like.setUser(user);
            like.setArtwork(artwork);
            likeRepository.save(like);
            long count = likeRepository.countByArtwork_Id(artworkId);

            // Notify artwork owner (only if liker is not the owner)
            User artworkOwner = artwork.getArtist();
            if (!artworkOwner.getId().equals(user.getId())) {
                notificationService.sendNotification(
                        artworkOwner,
                        "LIKE",
                        user.getName() + " liked your artwork \"" + artwork.getTitle() + "\""
                );
            }

            return ResponseEntity.ok(Map.of("liked", true, "likeCount", count));
        }
    }

    @GetMapping("/{artworkId}")
    public ResponseEntity<?> getLikeStatus(@PathVariable Long artworkId, Authentication auth) {
        long count = likeRepository.countByArtwork_Id(artworkId);

        // This endpoint is public so guests can see like counts — only
        // resolve "liked by me" when there's an actual logged-in user.
        boolean liked = false;
        if (auth != null && auth.isAuthenticated()) {
            Optional<User> user = userRepository.findByEmail(auth.getName());
            if (user.isPresent()) {
                liked = likeRepository.existsByUser_IdAndArtwork_Id(user.get().getId(), artworkId);
            }
        }

        return ResponseEntity.ok(Map.of("liked", liked, "likeCount", count));
    }

    @GetMapping("/my")
    public ResponseEntity<List<Artwork>> getMyLikedArtworks(Authentication auth) {
        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Artwork> likedArtworks = likeRepository.findByUser_Id(user.getId())
                .stream()
                .map(Like::getArtwork)
                .collect(Collectors.toList());

        return ResponseEntity.ok(likedArtworks);
    }
}