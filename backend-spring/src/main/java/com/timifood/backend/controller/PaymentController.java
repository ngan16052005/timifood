package com.timifood.backend.controller;

import com.timifood.backend.dto.ResponseObject;
import com.timifood.backend.entity.Order;
import com.timifood.backend.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.payos.PayOS;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkRequest;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkResponse;
import vn.payos.model.v2.paymentRequests.PaymentLinkItem;
import java.util.List;

import java.util.UUID;
import java.util.Optional;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/payment")
public class PaymentController {

    
    private final PayOS payOS;
    
    
    private OrderRepository orderRepository;

    @PostMapping("/create/{orderId}")
    public ResponseEntity<ResponseObject> createPaymentLink(@PathVariable UUID orderId) {
        try {
            Optional<Order> orderOpt = orderRepository.findById(orderId);
            if (!orderOpt.isPresent()) {
                return ResponseEntity.status(404).body(new ResponseObject("error", "Không tìm thấy đơn hàng", null));
            }
            
            Order order = orderOpt.get();
            
            // PayOS bắt buộc orderCode phải là số nguyên (long). Ta dùng System.currentTimeMillis để sinh số ngẫu nhiên.
            // Trong thực tế, bạn có thể lưu số này vào một cột 'payosOrderCode' trong bảng Order.
            long payosOrderCode = System.currentTimeMillis() / 1000; 
            
            PaymentLinkItem item = PaymentLinkItem.builder()
                .name("Đơn hàng " + order.getOrderCode())
                .quantity(1)
                .price(order.getTotalPrice().longValue())
                .build();
                
            CreatePaymentLinkRequest paymentRequest = CreatePaymentLinkRequest.builder()
                .orderCode(payosOrderCode)
                .amount(order.getTotalPrice().longValue())
                .description("Thanh toan TiMiFood")
                .returnUrl("http://localhost:5500/payment-success.html") // Đổi port 5500 thành port Frontend của bạn
                .cancelUrl("http://localhost:5500/payment-failed.html")
                .items(List.of(item))
                .build();
                
            CreatePaymentLinkResponse data = payOS.paymentRequests().create(paymentRequest);
            
            // Trả về Link thanh toán để Frontend mở trang QR Code của PayOS
            return ResponseEntity.ok(new ResponseObject("success", "Tạo link thanh toán thành công", data.getCheckoutUrl()));
            
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ResponseObject("error", e.getMessage(), null));
        }
    }
}
