package com.timifood.backend.controller;

import com.timifood.backend.dto.CheckoutRequest;
import com.timifood.backend.dto.ResponseObject;
import com.timifood.backend.entity.Order;
import com.timifood.backend.service.OrderService;
import com.timifood.backend.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/orders")
public class OrderController {
    
    private final OrderService orderService;
    private final JwtUtil jwtUtil;
    private final JdbcTemplate jdbcTemplate;

    // Trích xuất ID từ chuỗi Token an toàn
    private UUID getUserIdFromRequest(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            return UUID.fromString(jwtUtil.extractUserId(token));
        }
        return null;
    }

    // API lấy lịch sử mua hàng cho người dùng hiện tại & admin (Frontend tự filter)
    @GetMapping
    public ResponseEntity<?> getAllOrders(HttpServletRequest request) {
        String sql = "SELECT CAST(o.id AS VARCHAR(36)) as uuid, CAST(o.userId AS VARCHAR(36)) as userId, " +
                "COALESCE(u.fullname, o.receiverName, CAST(o.userId AS VARCHAR(36))) as khachhang, " +
                "o.orderCode as id, o.orderDate as thoigiandat, o.totalPrice as tongtien, o.status as trangthai, " +
                "o.deliveryType as hinhthucgiao, o.deliveryTime as thoigiangiao, o.deliveryDate as ngaygiaohang, " +
                "o.receiverName as tenguoinhan, o.receiverPhone as sdtnhan, o.receiverAddress as diachinhan, o.note as ghichu " +
                "FROM Orders o LEFT JOIN Users u ON o.userId = u.id ORDER BY o.orderDate DESC";
        
        List<Map<String, Object>> orders = jdbcTemplate.queryForList(sql);
        return ResponseEntity.ok(orders);
    }
    
    // API Thanh toán / Chốt đơn (Rất quan trọng)
    @PostMapping
    public ResponseEntity<ResponseObject> checkout(@RequestBody CheckoutRequest checkoutRequest, HttpServletRequest request) {
        UUID userId = getUserIdFromRequest(request);
        if (userId == null) return ResponseEntity.status(401).body(new ResponseObject("error", "Chưa đăng nhập", null));
        
        try {
            Order order = orderService.processCheckout(userId, checkoutRequest);
            return ResponseEntity.ok(new ResponseObject("success", "Đặt hàng thành công", order));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(new ResponseObject("error", e.getMessage(), null));
        }
    }

    @GetMapping("/paginated")
    public ResponseEntity<?> getOrdersPaginated(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(required = false) Integer status,
            @RequestParam(defaultValue = "") String search,
            @RequestParam(defaultValue = "") String startDate,
            @RequestParam(defaultValue = "") String endDate) {
        
        int offset = (page - 1) * limit;
        String baseQuery = "FROM Orders o LEFT JOIN Users u ON o.userId = u.id WHERE 1=1";
        
        if (status != null && status != 3) {
            baseQuery += " AND o.status = " + status;
        }
        if (!search.isEmpty()) {
            baseQuery += " AND (u.fullname LIKE '%" + search + "%' OR o.orderCode LIKE '%" + search + "%' OR o.receiverPhone LIKE '%" + search + "%')";
        }
        if (!startDate.isEmpty()) {
            baseQuery += " AND o.orderDate >= '" + startDate + " 00:00:00'";
        }
        if (!endDate.isEmpty()) {
            baseQuery += " AND o.orderDate <= '" + endDate + " 23:59:59.999'";
        }

        Integer total = jdbcTemplate.queryForObject("SELECT COUNT(*) " + baseQuery, Integer.class);
        String sql = "SELECT CAST(o.id AS VARCHAR(36)) as uuid, CAST(o.userId AS VARCHAR(36)) as userId, " +
                "COALESCE(u.fullname, o.receiverName, CAST(o.userId AS VARCHAR(36))) as khachhang, " +
                "o.orderCode as id, o.orderDate as thoigiandat, o.totalPrice as tongtien, o.status as trangthai, " +
                "o.deliveryType as hinhthucgiao, o.deliveryTime as thoigiangiao, o.deliveryDate as ngaygiaohang, " +
                "o.receiverName as tenguoinhan, o.receiverPhone as sdtnhan, o.receiverAddress as diachinhan, o.note as ghichu " +
                baseQuery + " ORDER BY o.orderDate DESC OFFSET ? ROWS FETCH NEXT ? ROWS ONLY";
        
        List<Map<String, Object>> orders = jdbcTemplate.queryForList(sql, offset, limit);
        
        for (Map<String, Object> order : orders) {
            String orderId = order.get("uuid").toString();
            List<Map<String, Object>> details = jdbcTemplate.queryForList(
                "SELECT CAST(p.id AS VARCHAR(36)) as id, p.title, p.img, od.quantity as soluong, od.price " +
                "FROM OrderDetails od JOIN Products p ON od.productId = p.id WHERE od.orderId = ?", orderId);
            order.put("chitiet", details);
        }

        return ResponseEntity.ok(Map.of(
                "data", orders,
                "total", total,
                "page", page,
                "limit", limit,
                "totalPages", Math.ceil((double) total / limit)
        ));
    }

    @GetMapping("/{id}/details")
    public ResponseEntity<?> getOrderDetails(@PathVariable String id) {
        String query = "SELECT CAST(p.id AS VARCHAR(36)) as id, p.title, p.img, od.quantity as soluong, od.price, od.note " +
                "FROM OrderDetails od JOIN Products p ON od.productId = p.id " +
                "JOIN Orders o ON od.orderId = o.id " +
                "WHERE o.orderCode = ? OR CAST(o.id AS VARCHAR(36)) = ?";
        List<Map<String, Object>> details = jdbcTemplate.queryForList(query, id, id);
        return ResponseEntity.ok(details);
    }

    @PutMapping("/{id}/status")
    @Transactional
    public ResponseEntity<?> updateOrderStatus(@PathVariable String id, @RequestBody Map<String, Integer> body) {
        Integer status = body.get("status");
        jdbcTemplate.update("UPDATE Orders SET status = ? WHERE orderCode = ? OR CAST(id AS VARCHAR(36)) = ?", status, id, id);
        return ResponseEntity.ok(Map.of("success", true, "message", "Order status updated"));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> deleteOrder(@PathVariable String id) {
        jdbcTemplate.update("DELETE FROM OrderDetails WHERE orderId IN (SELECT id FROM Orders WHERE orderCode = ? OR CAST(id AS VARCHAR(36)) = ?)", id, id);
        jdbcTemplate.update("DELETE FROM Orders WHERE orderCode = ? OR CAST(id AS VARCHAR(36)) = ?", id, id);
        return ResponseEntity.ok(Map.of("success", true, "message", "Order deleted"));
    }
}
