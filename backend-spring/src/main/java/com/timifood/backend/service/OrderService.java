package com.timifood.backend.service;

import com.timifood.backend.entity.CartItem;
import com.timifood.backend.entity.Order;
import com.timifood.backend.entity.OrderDetail;
import com.timifood.backend.repository.CartItemRepository;
import com.timifood.backend.repository.OrderDetailRepository;
import com.timifood.backend.repository.OrderRepository;
import com.timifood.backend.dto.CheckoutRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class OrderService {
    @Autowired
    private OrderRepository orderRepository;
    
    @Autowired
    private CartItemRepository cartItemRepository;
    
    @Autowired
    private OrderDetailRepository orderDetailRepository;

    public List<Order> getAllOrders() { 
        return orderRepository.findAll(); 
    }
    
    public List<Order> getOrdersByUser(UUID userId) { 
        return orderRepository.findByUserId(userId); 
    }
    
    // CỰC KỲ QUAN TRỌNG: @Transactional đảm bảo nếu có lỗi xảy ra ở giữa chừng (ví dụ lưu Order thành công nhưng lỗi lúc lưu OrderDetails), toàn bộ DB sẽ tự Rollback lại như cũ, chống mất dữ liệu!
    @Transactional
    public Order processCheckout(UUID userId, CheckoutRequest request) throws Exception {
        // 1. Lấy giỏ hàng của user
        List<CartItem> cartItems = cartItemRepository.findByUserId(userId);
        if (cartItems.isEmpty()) {
            throw new Exception("Giỏ hàng trống! Không thể đặt hàng.");
        }

        // 2. Tính tổng tiền tự động (chống việc user gian lận sửa giá trên Frontend gửi xuống)
        double totalPrice = 0;
        for (CartItem item : cartItems) {
            if (item.getProduct() != null && item.getProduct().getPrice() != null) {
                totalPrice += item.getProduct().getPrice() * item.getQuantity();
            }
        }

        // 3. Tạo Đơn hàng mới (Order)
        Order order = new Order();
        order.setUserId(userId);
        order.setOrderCode("ORD" + System.currentTimeMillis()); // Mã đơn sinh tự động ORD123456...
        order.setOrderDate(new Date());
        order.setTotalPrice(totalPrice);
        order.setReceiverName(request.getReceiverName());
        order.setReceiverPhone(request.getReceiverPhone());
        order.setReceiverAddress(request.getReceiverAddress());
        order.setNote(request.getNote());
        order.setDeliveryType(request.getDeliveryType());
        order.setDeliveryTime(request.getDeliveryTime());
        order.setStatus(0); // 0 = Chờ xử lý

        Order savedOrder = orderRepository.save(order);

        // 4. Chuyển toàn bộ các món từ Giỏ hàng sang Chi tiết đơn (OrderDetails)
        List<OrderDetail> orderDetails = cartItems.stream().map(cartItem -> {
            OrderDetail detail = new OrderDetail();
            detail.setOrderId(savedOrder.getId());
            detail.setProductId(cartItem.getProductId());
            detail.setPrice(cartItem.getProduct().getPrice()); // Chốt giá tại thời điểm đặt hàng
            detail.setQuantity(cartItem.getQuantity());
            detail.setNote(cartItem.getNote());
            return detail;
        }).collect(Collectors.toList());

        orderDetailRepository.saveAll(orderDetails);

        // 5. Xóa sạch giỏ hàng của người dùng đó
        cartItemRepository.deleteByUserId(userId);

        return savedOrder;
    }
}
