package com.artverse.artverse_backend.repository;

import com.artverse.artverse_backend.model.Follow;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface FollowRepository extends JpaRepository<Follow, Long> {
    Optional<Follow> findByFollower_IdAndFollowing_Id(Long followerId, Long followingId);
    boolean existsByFollower_IdAndFollowing_Id(Long followerId, Long followingId);
    long countByFollowing_Id(Long followingId);
    long countByFollower_Id(Long followerId);
    List<Follow> findByFollower_Id(Long followerId);
}