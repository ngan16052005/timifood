package com.timifood.backend.repository;

import com.timifood.backend.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, UUID> {
    // Tự động generate SQL tìm đơn hàng theo User ID
    List<Order> findByUserId(UUID userId);
    
    // Tự động generate SQL tìm theo trạng thái đơn
    List<Order> findByStatus(Integer status);
}
