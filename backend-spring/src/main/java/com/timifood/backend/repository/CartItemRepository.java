package com.timifood.backend.repository;

import com.timifood.backend.entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.Optional;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, UUID> {
    // Lấy toàn bộ giỏ hàng của 1 user
    List<CartItem> findByUserId(UUID userId);
    
    // Kiểm tra xem món ăn này đã có trong giỏ hàng của user chưa (để cộng dồn quantity thay vì tạo dòng mới)
    Optional<CartItem> findByUserIdAndProductId(UUID userId, UUID productId);
    
    // Xóa sạch giỏ hàng (Sau khi user thanh toán thành công)
    @Transactional
    void deleteByUserId(UUID userId);
}
