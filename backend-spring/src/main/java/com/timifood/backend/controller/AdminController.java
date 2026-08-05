package com.timifood.backend.controller;

import com.timifood.backend.entity.PurchaseOrder;
import com.timifood.backend.entity.StockHistory;
import com.timifood.backend.entity.StockImport;
import com.timifood.backend.entity.Supplier;
import com.timifood.backend.repository.PurchaseOrderRepository;
import com.timifood.backend.repository.StockHistoryRepository;
import com.timifood.backend.repository.StockImportRepository;
import com.timifood.backend.repository.SupplierRepository;
import com.timifood.backend.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class AdminController {

    private final JdbcTemplate jdbcTemplate;
    private final SupplierRepository supplierRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final StockImportRepository stockImportRepository;
    private final StockHistoryRepository stockHistoryRepository;
    private final JwtUtil jwtUtil;

    @GetMapping("/inventory/stats")
    public ResponseEntity<?> getInventoryStats() {
        String sql = "SELECT TOP 10 p.title, p.stock, p.minStock, SUM(od.quantity) as soldQuantity " +
                "FROM OrderDetails od " +
                "JOIN Orders o ON od.orderId = o.id " +
                "JOIN Products p ON od.productId = p.id " +
                "WHERE o.orderDate >= DATEADD(day, -7, GETUTCDATE()) AND o.status != 3 " +
                "GROUP BY p.title, p.stock, p.minStock " +
                "ORDER BY soldQuantity DESC";
        List<Map<String, Object>> stats = jdbcTemplate.queryForList(sql);
        return ResponseEntity.ok(Map.of("success", true, "data", stats));
    }

    @GetMapping("/admin/stats/report")
    public ResponseEntity<?> getStatsReport(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {

        String dateFilter = "1=1";
        if (startDate != null && !startDate.isEmpty()) {
            dateFilter += " AND o.orderDate >= '" + startDate + " 00:00:00'";
        }
        if (endDate != null && !endDate.isEmpty()) {
            dateFilter += " AND o.orderDate <= '" + endDate + " 23:59:59.999'";
        }

        String sqlTopProducts = "SELECT TOP 5 p.title, SUM(od.quantity) as totalQuantity, SUM(od.quantity * od.price) as totalRevenue "
                +
                "FROM OrderDetails od JOIN Products p ON od.productId = p.id JOIN Orders o ON od.orderId = o.id " +
                "WHERE o.status = 2 AND " + dateFilter + " GROUP BY p.id, p.title ORDER BY totalQuantity DESC";
        List<Map<String, Object>> topProducts = jdbcTemplate.queryForList(sqlTopProducts);

        String sqlMonthlyRevenue = "SELECT MONTH(CAST(o.orderDate AS DATE)) as month, SUM(o.totalPrice) as revenue " +
                "FROM Orders o WHERE o.status = 2 AND YEAR(CAST(o.orderDate AS DATE)) = YEAR(GETUTCDATE()) AND "
                + dateFilter +
                " GROUP BY MONTH(CAST(o.orderDate AS DATE)) ORDER BY month ASC";
        List<Map<String, Object>> monthlyRevenue = jdbcTemplate.queryForList(sqlMonthlyRevenue);

        String sqlCategoryStats = "SELECT p.category, SUM(od.quantity * od.price) as revenue " +
                "FROM OrderDetails od JOIN Products p ON od.productId = p.id JOIN Orders o ON od.orderId = o.id " +
                "WHERE o.status = 2 AND " + dateFilter + " GROUP BY p.category";
        List<Map<String, Object>> categoryStats = jdbcTemplate.queryForList(sqlCategoryStats);

        return ResponseEntity.ok(Map.of(
                "topProducts", topProducts,
                "monthlyRevenue", monthlyRevenue,
                "categoryStats", categoryStats));
    }

    @GetMapping("/admin/reviews")
    public ResponseEntity<?> getAdminReviews() {
        String sql = "SELECT r.*, r.createdAt as reviewDate, p.title as productTitle, u.fullname as customerName " +
                "FROM Reviews r JOIN Products p ON r.productId = p.id LEFT JOIN Users u ON r.userId = u.id ORDER BY r.createdAt DESC";
        return ResponseEntity.ok(jdbcTemplate.queryForList(sql));
    }

    @DeleteMapping("/admin/reviews/{id}")
    @Transactional
    public ResponseEntity<?> deleteReview(@PathVariable UUID id) {
        jdbcTemplate.update("DELETE FROM Reviews WHERE id = ?", id);
        return ResponseEntity.ok(Map.of("success", true, "message", "Xóa đánh giá thành công"));
    }

    @GetMapping("/admin/stock-history")
    public ResponseEntity<?> getStockHistory() {
        String sql = "SELECT COALESCE(CAST(sh.id AS VARCHAR(36)), CAST(si.id AS VARCHAR(36))) as id, " +
                "COALESCE(sh.productId, si.productId) as productId, " +
                "COALESCE(sh.action, 'IMPORT_PO') as action, " +
                "COALESCE(sh.quantity, si.quantity) as quantity, " +
                "COALESCE(sh.createdAt, si.importDate) as createdAt, " +
                "p.title as productTitle, si.purchaseOrderId, si.importPrice, si.totalPrice " +
                "FROM StockHistory sh " +
                "FULL OUTER JOIN StockImports si ON sh.productId = si.productId AND sh.action = 'IMPORT_PO' AND ABS(DATEDIFF(second, sh.createdAt, si.importDate)) < 5 "
                +
                "JOIN Products p ON COALESCE(sh.productId, si.productId) = p.id ORDER BY createdAt DESC";
        return ResponseEntity.ok(jdbcTemplate.queryForList(sql));
    }

    @DeleteMapping("/admin/stock-history/{id}")
    @Transactional
    public ResponseEntity<?> deleteStockHistory(@PathVariable Integer id) {
        List<Map<String, Object>> records = jdbcTemplate.queryForList("SELECT * FROM StockHistory WHERE id = ?", id);
        if (records.isEmpty()) {
            return ResponseEntity.status(404)
                    .body(Map.of("success", false, "message", "Không tìm thấy lịch sử nhập/xuất"));
        }
        Map<String, Object> item = records.get(0);
        String action = (String) item.get("action");
        if ("IMPORT_PO".equals(action)) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message",
                    "Lịch sử từ phiếu nhập không thể xoá trực tiếp tại đây! Vui lòng xoá phiếu nhập ở tab Lịch sử Phiếu Nhập."));
        }

        UUID productId = UUID.fromString(item.get("productId").toString());
        Integer quantity = (Integer) item.get("quantity");
        if ("IMPORT".equals(action)) {
            jdbcTemplate.update("UPDATE Products SET stock = ISNULL(stock, 0) - ? WHERE id = ?", quantity, productId);
        } else if ("EXPORT".equals(action)) {
            jdbcTemplate.update("UPDATE Products SET stock = ISNULL(stock, 0) + ? WHERE id = ?", quantity, productId);
        }

        jdbcTemplate.update("DELETE FROM StockHistory WHERE id = ?", id);
        return ResponseEntity.ok(Map.of("success", true, "message", "Xoá lịch sử và hoàn tác tồn kho thành công"));
    }

    @GetMapping("/admin/logs")
    public ResponseEntity<?> getLogs(@RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "15") int limit, @RequestParam(defaultValue = "") String search) {
        int offset = (page - 1) * limit;
        String searchFilter = search.isEmpty() ? ""
                : " WHERE sl.action LIKE '%" + search + "%' OR sl.details LIKE '%" + search + "%' OR u.phone LIKE '%"
                        + search + "%'";

        Integer total = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM SystemLogs sl LEFT JOIN Users u ON sl.userId = u.id" + searchFilter,
                Integer.class);

        String sql = "SELECT sl.*, COALESCE(u.phone, N'Hệ thống') as userPhone FROM SystemLogs sl LEFT JOIN Users u ON sl.userId = u.id "
                +
                searchFilter + " ORDER BY sl.createdAt DESC OFFSET ? ROWS FETCH NEXT ? ROWS ONLY";
        List<Map<String, Object>> data = jdbcTemplate.queryForList(sql, offset, limit);

        return ResponseEntity.ok(Map.of(
                "data", data,
                "total", total,
                "page", page,
                "totalPages", Math.ceil((double) total / limit)));
    }

    @DeleteMapping("/admin/logs/{id}")
    @Transactional
    public ResponseEntity<?> deleteLog(@PathVariable UUID id) {
        jdbcTemplate.update("DELETE FROM SystemLogs WHERE id = ?", id);
        return ResponseEntity.ok(Map.of("success", true, "message", "Log deleted successfully"));
    }

    @DeleteMapping("/admin/logs")
    @Transactional
    public ResponseEntity<?> clearLogs() {
        jdbcTemplate.update("TRUNCATE TABLE SystemLogs");
        return ResponseEntity.ok(Map.of("success", true, "message", "All logs cleared successfully"));
    }

    @PostMapping("/admin/stock-in")
    @Transactional
    public ResponseEntity<?> createStockIn(@RequestBody Map<String, Object> body,
            @RequestHeader("Authorization") String token) {
        UUID userId = UUID.fromString(jwtUtil.extractUserId(token.substring(7)));
        UUID productId = UUID.fromString((String) body.get("productId"));
        Integer quantity = (Integer) body.get("quantity");
        String note = (String) body.get("note");

        jdbcTemplate.update(
                "INSERT INTO StockHistory (productId, action, quantity, note, createdBy, createdAt) VALUES (?, 'IMPORT', ?, ?, ?, GETUTCDATE())",
                productId, quantity, note, userId);
        jdbcTemplate.update("UPDATE Products SET stock = ISNULL(stock, 0) + ? WHERE id = ?", quantity, productId);

        return ResponseEntity.status(201).body(Map.of("success", true, "message", "Nhập kho thành công!"));
    }
}
