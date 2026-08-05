package com.timifood.backend.repository;

import com.timifood.backend.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Integer> {
    List<Review> findByProductIdOrderByCreatedAtDesc(UUID productId);
    List<Review> findByUserIdAndProductId(UUID userId, UUID productId);
}
