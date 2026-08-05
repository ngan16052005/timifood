package com.timifood.backend.controller;

import com.timifood.backend.dto.ResponseObject;
import com.timifood.backend.entity.Review;
import com.timifood.backend.entity.User;
import com.timifood.backend.repository.ReviewRepository;
import com.timifood.backend.repository.UserRepository;
import com.timifood.backend.repository.OrderRepository;
import com.timifood.backend.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;

import java.util.*;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
public class ReviewController {

    
    private final ReviewRepository reviewRepository;

    
    private final UserRepository userRepository;

    
    private final OrderRepository orderRepository;
    
    
    private final JwtUtil jwtUtil;

    private UUID getUserIdFromRequest(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            return UUID.fromString(jwtUtil.extractUserId(token));
        }
        return null;
    }

    // Lấy đánh giá của một sản phẩm
    @GetMapping("/products/{id}/reviews")
    public ResponseEntity<List<Map<String, Object>>> getProductReviews(@PathVariable UUID id) {
        List<Review> reviews = reviewRepository.findByProductIdOrderByCreatedAtDesc(id);
        List<Map<String, Object>> result = new ArrayList<>();
        
        for (Review r : reviews) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", r.getId());
            map.put("userId", r.getUserId());
            map.put("productId", r.getProductId());
            map.put("rating", r.getRating());
            map.put("comment", r.getComment());
            map.put("reviewDate", r.getCreatedAt());
            map.put("createdAt", r.getCreatedAt());
            
            // Lấy tên người dùng
            Optional<User> userOpt = userRepository.findById(r.getUserId());
            if (userOpt.isPresent()) {
                map.put("customerName", userOpt.get().getFullname());
            } else {
                map.put("customerName", "Khách hàng");
            }
            
            result.add(map);
        }
        
        return ResponseEntity.ok(result);
    }

    // Đăng đánh giá
    @PostMapping("/reviews")
    public ResponseEntity<?> postReview(@RequestBody Review requestData, HttpServletRequest request) {
        UUID userId = getUserIdFromRequest(request);
        if (userId == null) {
            Map<String, String> err = new HashMap<>();
            err.put("message", "Vui lòng đăng nhập để đánh giá");
            return ResponseEntity.status(401).body(err);
        }
        
        // Bỏ qua check đơn hàng đã mua để demo dễ hơn, nhưng trong thực tế:
        // Cần JOIN Order & OrderDetail xem người dùng đã mua sản phẩm này chưa.
        
        requestData.setUserId(userId);
        requestData.setCreatedAt(new Date());
        reviewRepository.save(requestData);
        
        Map<String, String> res = new HashMap<>();
        res.put("message", "Cảm ơn bạn đã đánh giá sản phẩm!");
        return ResponseEntity.ok(res);
    }
}
