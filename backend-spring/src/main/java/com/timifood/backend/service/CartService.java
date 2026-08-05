package com.timifood.backend.service;

import com.timifood.backend.entity.CartItem;
import com.timifood.backend.repository.CartItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class CartService {
    @Autowired
    private CartItemRepository cartItemRepository;

    public List<CartItem> getCartByUserId(UUID userId) {
        return cartItemRepository.findByUserId(userId);
    }

    public CartItem addToCart(UUID userId, UUID productId, Integer quantity, String note) {
        // Kiểm tra xem món này đã có trong giỏ chưa
        Optional<CartItem> existingItem = cartItemRepository.findByUserIdAndProductId(userId, productId);
        
        if (existingItem.isPresent()) {
            // Có rồi thì cộng dồn số lượng
            CartItem item = existingItem.get();
            item.setQuantity(item.getQuantity() + quantity);
            if (note != null) item.setNote(note);
            return cartItemRepository.save(item);
        } else {
            // Chưa có thì tạo mới
            CartItem newItem = new CartItem();
            newItem.setUserId(userId);
            newItem.setProductId(productId);
            newItem.setQuantity(quantity);
            newItem.setNote(note);
            newItem.setCreatedAt(new Date());
            return cartItemRepository.save(newItem);
        }
    }

    public void removeCartItem(UUID id) {
        cartItemRepository.deleteById(id);
    }
    
    public void clearCart(UUID userId) {
        cartItemRepository.deleteByUserId(userId);
    }
}
