package com.artverse.artverse_backend.controller;

import com.artverse.artverse_backend.model.Follow;
import com.artverse.artverse_backend.model.User;
import com.artverse.artverse_backend.repository.FollowRepository;
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
@RequestMapping("/api/follows")
public class FollowController {

    @Autowired private FollowRepository followRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private NotificationService notificationService;

    @PostMapping("/{artistId}")
    public ResponseEntity<?> toggleFollow(@PathVariable Long artistId, Authentication auth) {
        User follower = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (follower.getId().equals(artistId)) {
            return ResponseEntity.badRequest().body("You cannot follow yourself.");
        }

        User artist = userRepository.findById(artistId)
                .orElseThrow(() -> new RuntimeException("Artist not found"));

        Optional<Follow> existing = followRepository.findByFollower_IdAndFollowing_Id(
                follower.getId(), artistId);

        if (existing.isPresent()) {
            followRepository.delete(existing.get());
            long count = followRepository.countByFollowing_Id(artistId);
            return ResponseEntity.ok(Map.of("following", false, "followerCount", count));
        } else {
            Follow follow = new Follow();
            follow.setFollower(follower);
            follow.setFollowing(artist);
            followRepository.save(follow);
            long count = followRepository.countByFollowing_Id(artistId);

            notificationService.sendNotification(
                artist,
                "FOLLOW",
                follower.getName() + " started following you"
            );

            return ResponseEntity.ok(Map.of("following", true, "followerCount", count));
        }
    }

    @GetMapping("/{artistId}")
    public ResponseEntity<?> getFollowStatus(@PathVariable Long artistId, Authentication auth) {
        long count = followRepository.countByFollowing_Id(artistId);

        // This endpoint is public so guests can see follower counts — only
        // resolve "following by me" when there's an actual logged-in user.
        boolean following = false;
        if (auth != null && auth.isAuthenticated()) {
            Optional<User> follower = userRepository.findByEmail(auth.getName());
            if (follower.isPresent()) {
                following = followRepository.existsByFollower_IdAndFollowing_Id(
                        follower.get().getId(), artistId);
            }
        }

        return ResponseEntity.ok(Map.of("following", following, "followerCount", count));
    }

    @GetMapping("/following")
    public ResponseEntity<List<User>> getFollowing(Authentication auth) {
        User follower = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<User> following = followRepository.findByFollower_Id(follower.getId())
                .stream()
                .map(Follow::getFollowing)
                .collect(Collectors.toList());

        return ResponseEntity.ok(following);
    }
}
