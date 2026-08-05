package com.timifood.backend.controller;

import com.timifood.backend.entity.CartItem;
import com.timifood.backend.entity.Product;
import com.timifood.backend.repository.CartItemRepository;
import com.timifood.backend.repository.ProductRepository;
import com.timifood.backend.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;

import java.util.*;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {
    
    private final CartItemRepository cartItemRepository;

    private final ProductRepository productRepository;
    
    private final JwtUtil jwtUtil;

    private UUID getUserIdFromRequest(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            return UUID.fromString(jwtUtil.extractUserId(token));
        }
        return null;
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getCart(HttpServletRequest request) {
        UUID userId = getUserIdFromRequest(request);
        if (userId == null) return ResponseEntity.status(401).body(null);
        
        List<CartItem> cartItems = cartItemRepository.findByUserId(userId);
        List<Map<String, Object>> result = new ArrayList<>();
        
        for (CartItem item : cartItems) {
            Optional<Product> productOpt = productRepository.findById(item.getProductId());
            if (productOpt.isPresent()) {
                Product p = productOpt.get();
                Map<String, Object> map = new HashMap<>();
                map.put("id", p.getId());
                map.put("title", p.getTitle());
                map.put("description", p.getDescription());
                map.put("price", p.getPrice());
                map.put("category", p.getCategory());
                map.put("img", p.getImg());
                map.put("status", p.getStatus());
                map.put("soluong", item.getQuantity());
                map.put("ghichu", item.getNote() != null ? item.getNote() : "");
                result.add(map);
            }
        }
        
        return ResponseEntity.ok(result);
    }

    @PostMapping
    @Transactional
    public ResponseEntity<Map<String, String>> updateCart(@RequestBody List<Map<String, Object>> cartItems, HttpServletRequest request) {
        UUID userId = getUserIdFromRequest(request);
        if (userId == null) return ResponseEntity.status(401).body(null);
        
        cartItemRepository.deleteByUserId(userId);
        
        for (Map<String, Object> itemMap : cartItems) {
            if (itemMap.get("id") != null) {
                CartItem newItem = new CartItem();
                newItem.setUserId(userId);
                newItem.setProductId(UUID.fromString(itemMap.get("id").toString()));
                
                Object soluongObj = itemMap.get("soluong");
                int soluong = 1;
                if (soluongObj instanceof Number) {
                    soluong = ((Number) soluongObj).intValue();
                } else if (soluongObj instanceof String) {
                    soluong = Integer.parseInt((String) soluongObj);
                }
                
                newItem.setQuantity(soluong);
                
                Object ghichuObj = itemMap.get("ghichu");
                newItem.setNote(ghichuObj != null ? ghichuObj.toString() : "");
                newItem.setCreatedAt(new Date());
                
                cartItemRepository.save(newItem);
            }
        }
        
        Map<String, String> response = new HashMap<>();
        response.put("message", "Cart updated");
        return ResponseEntity.ok(response);
    }
}
