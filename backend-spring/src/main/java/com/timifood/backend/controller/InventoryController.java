package com.timifood.backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/inventory")
@RequiredArgsConstructor
public class InventoryController {

    private final JdbcTemplate jdbcTemplate;

    @GetMapping("/import-history")
    public ResponseEntity<?> getImportHistory() {
        String sql = "SELECT si.*, p.title as productName, u.fullname as importerName " +
                "FROM StockImports si " +
                "JOIN Products p ON si.productId = p.id " +
                "LEFT JOIN Users u ON si.importedBy = u.id " +
                "ORDER BY si.importDate DESC";
        return ResponseEntity.ok(jdbcTemplate.queryForList(sql));
    }

    @GetMapping("/profit-report")
    public ResponseEntity<?> getProfitReport() {
        String sql = "SELECT p.id as productId, p.title as productName, " +
                "SUM(od.quantity) as totalSold, SUM(od.quantity * od.price) as totalRevenue, " +
                "SUM(od.quantity * od.costPrice) as totalCOGS, " +
                "(SUM(od.quantity * od.price) - SUM(od.quantity * od.costPrice)) as profit " +
                "FROM OrderDetails od " +
                "JOIN Orders o ON od.orderId = o.id " +
                "JOIN Products p ON od.productId = p.id " +
                "WHERE o.status = 2 " +
                "GROUP BY p.id, p.title " +
                "ORDER BY profit DESC";
        return ResponseEntity.ok(jdbcTemplate.queryForList(sql));
    }
}
