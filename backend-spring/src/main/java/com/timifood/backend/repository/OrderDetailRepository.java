package com.timifood.backend.repository;

import com.timifood.backend.entity.OrderDetail;
import com.timifood.backend.entity.OrderDetailId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface OrderDetailRepository extends JpaRepository<OrderDetail, OrderDetailId> {
    // Tìm các món ăn nằm trong 1 đơn hàng cụ thể
    List<OrderDetail> findByOrderId(UUID orderId);
}
