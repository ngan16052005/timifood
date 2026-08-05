package com.timifood.backend.controller;

import com.timifood.backend.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/purchase-orders")
@RequiredArgsConstructor
public class PurchaseOrderController {

    private final JdbcTemplate jdbcTemplate;
    private final JwtUtil jwtUtil;

    @GetMapping
    public ResponseEntity<?> getPurchaseOrders() {
        String sql = "SELECT p.*, s.name as supplierName, u.fullName as staffName " +
                "FROM PurchaseOrders p " +
                "LEFT JOIN Suppliers s ON p.supplierId = s.id " +
                "LEFT JOIN Users u ON p.staffId = u.id " +
                "ORDER BY p.importDate DESC";
        return ResponseEntity.ok(Map.of("success", true, "data", jdbcTemplate.queryForList(sql)));
    }

    @PostMapping
    @Transactional
    public ResponseEntity<?> createPurchaseOrder(@RequestBody Map<String, Object> body, @RequestHeader("Authorization") String token) {
        UUID staffId = UUID.fromString(jwtUtil.extractUserId(token.substring(7)));
        String supplierIdStr = (String) body.get("supplierId");
        UUID supplierId = supplierIdStr != null && !supplierIdStr.isEmpty() ? UUID.fromString(supplierIdStr) : null;
        String note = (String) body.get("note");
        Double totalAmount = Double.valueOf(body.get("totalAmount").toString());
        List<Map<String, Object>> items = (List<Map<String, Object>>) body.get("items");

        if (items == null || items.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Phiếu nhập không có sản phẩm nào."));
        }

        String orderCode = "PO" + (System.currentTimeMillis() % 1000000);

        UUID poId = UUID.randomUUID();
        jdbcTemplate.update("INSERT INTO PurchaseOrders (id, orderCode, supplierId, staffId, totalAmount, note, status, importDate) VALUES (?, ?, ?, ?, ?, ?, 1, GETUTCDATE())",
                poId, orderCode, supplierId, staffId, totalAmount, note);

        for (Map<String, Object> item : items) {
            UUID productId = UUID.fromString((String) item.get("productId"));
            Integer quantity = (Integer) item.get("quantity");
            Double importPrice = Double.valueOf(item.get("importPrice").toString());
            Double itemTotalPrice = quantity * importPrice;

            jdbcTemplate.update("INSERT INTO StockImports (id, purchaseOrderId, productId, quantity, importPrice, totalPrice, note, importedBy, importDate) VALUES (NEWID(), ?, ?, ?, ?, ?, ?, ?, GETUTCDATE())",
                    poId, productId, quantity, importPrice, itemTotalPrice, note, staffId);

            jdbcTemplate.update("INSERT INTO StockHistory (productId, action, quantity, note, createdBy, createdAt) VALUES (?, 'IMPORT_PO', ?, N'Nhập từ phiếu nhập', ?, GETUTCDATE())",
                    productId, quantity, staffId);

            jdbcTemplate.update("UPDATE Products SET stock = ISNULL(stock, 0) + ? WHERE id = ?", quantity, productId);
        }

        return ResponseEntity.status(201).body(Map.of("success", true, "message", "Tạo phiếu nhập thành công", "purchaseOrderId", poId));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> deletePurchaseOrder(@PathVariable UUID id, @RequestHeader("Authorization") String token) {
        UUID staffId = UUID.fromString(jwtUtil.extractUserId(token.substring(7)));
        List<Map<String, Object>> items = jdbcTemplate.queryForList("SELECT productId, quantity FROM StockImports WHERE purchaseOrderId = ?", id);

        for (Map<String, Object> item : items) {
            UUID productId = UUID.fromString(item.get("productId").toString());
            Integer quantity = (Integer) item.get("quantity");

            jdbcTemplate.update("UPDATE Products SET stock = ISNULL(stock, 0) - ? WHERE id = ?", quantity, productId);
            jdbcTemplate.update("INSERT INTO StockHistory (productId, action, quantity, note, createdBy, createdAt) VALUES (?, 'DELETE_PO', ?, N'Xoá phiếu nhập', ?, GETUTCDATE())",
                    productId, quantity, staffId);
        }

        jdbcTemplate.update("DELETE FROM StockImports WHERE purchaseOrderId = ?", id);
        jdbcTemplate.update("DELETE FROM PurchaseOrders WHERE id = ?", id);

        return ResponseEntity.ok(Map.of("success", true, "message", "Xoá phiếu nhập và hoàn tác tồn kho thành công"));
    }
}
