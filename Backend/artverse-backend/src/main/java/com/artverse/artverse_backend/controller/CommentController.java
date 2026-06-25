package com.artverse.artverse_backend.controller;

import com.artverse.artverse_backend.model.Artwork;
import com.artverse.artverse_backend.model.Comment;
import com.artverse.artverse_backend.model.User;
import com.artverse.artverse_backend.repository.ArtworkRepository;
import com.artverse.artverse_backend.repository.CommentRepository;
import com.artverse.artverse_backend.repository.UserRepository;
import com.artverse.artverse_backend.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/comments")
public class CommentController {

    @Autowired private CommentRepository commentRepository;
    @Autowired private ArtworkRepository artworkRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private NotificationService notificationService;

    @GetMapping("/{artworkId}")
    public ResponseEntity<List<Comment>> getComments(@PathVariable Long artworkId) {
        return ResponseEntity.ok(
                commentRepository.findByArtwork_IdOrderByCreatedAtDesc(artworkId)
        );
    }

    @PostMapping("/{artworkId}")
    public ResponseEntity<?> addComment(
            @PathVariable Long artworkId,
            @RequestBody Map<String, String> body,
            Authentication auth) {

        String text = body.get("text");
        if (text == null || text.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Comment text cannot be empty.");
        }

        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Artwork artwork = artworkRepository.findById(artworkId)
                .orElseThrow(() -> new RuntimeException("Artwork not found"));

        Comment comment = new Comment();
        comment.setUser(user);
        comment.setArtwork(artwork);
        comment.setText(text.trim());

        Comment saved = commentRepository.save(comment);

        // Notify artwork owner (only if commenter is not the owner)
        User artworkOwner = artwork.getArtist();
        if (!artworkOwner.getId().equals(user.getId())) {
            notificationService.sendNotification(
                    artworkOwner,
                    "COMMENT",
                    user.getName() + " commented on your artwork \"" + artwork.getTitle() + "\": " + text.trim()
            );
        }

        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{commentId}")
    public ResponseEntity<?> deleteComment(@PathVariable Long commentId, Authentication auth) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found"));

        if (!comment.getUser().getEmail().equals(auth.getName())) {
            return ResponseEntity.status(403).body("You can only delete your own comments.");
        }

        commentRepository.deleteById(commentId);
        return ResponseEntity.ok("Comment deleted.");
    }
}