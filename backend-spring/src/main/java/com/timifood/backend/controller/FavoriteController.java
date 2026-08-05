package com.timifood.backend.controller;

import com.timifood.backend.entity.Favorite;
import com.timifood.backend.repository.FavoriteRepository;
import com.timifood.backend.security.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/favorites")
@RequiredArgsConstructor
public class FavoriteController {

    private final FavoriteRepository favoriteRepository;
    private final JwtUtil jwtUtil;

    private UUID getUserIdFromToken(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            if (jwtUtil.validateToken(token)) {
                String idStr = jwtUtil.extractUserId(token);
                if (idStr != null) {
                    return UUID.fromString(idStr);
                }
            }
        }
        return null;
    }

    @GetMapping
    public ResponseEntity<?> getFavorites(HttpServletRequest request) {
        UUID userId = getUserIdFromToken(request);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "Unauthorized"));
        }

        List<Favorite> favorites = favoriteRepository.findByUserId(userId);
        List<UUID> productIds = favorites.stream().map(Favorite::getProductId).collect(Collectors.toList());
        return ResponseEntity.ok(productIds);
    }

    @PostMapping
    public ResponseEntity<?> addFavorite(@RequestBody Map<String, String> body, HttpServletRequest request) {
        UUID userId = getUserIdFromToken(request);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "Unauthorized"));
        }

        String productIdStr = body.get("productId");
        if (productIdStr == null || productIdStr.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Thiếu productId"));
        }

        UUID productId = UUID.fromString(productIdStr);

        Optional<Favorite> existing = favoriteRepository.findByUserIdAndProductId(userId, productId);
        if (existing.isEmpty()) {
            Favorite favorite = new Favorite();
            favorite.setUserId(userId);
            favorite.setProductId(productId);
            favoriteRepository.save(favorite);
        }

        return ResponseEntity.ok(Map.of("success", true, "message", "Đã thêm vào yêu thích"));
    }

    @DeleteMapping("/{productId}")
    @Transactional
    public ResponseEntity<?> removeFavorite(@PathVariable UUID productId, HttpServletRequest request) {
        UUID userId = getUserIdFromToken(request);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "Unauthorized"));
        }

        favoriteRepository.deleteByUserIdAndProductId(userId, productId);
        return ResponseEntity.ok(Map.of("success", true, "message", "Đã xóa khỏi yêu thích"));
    }
}
