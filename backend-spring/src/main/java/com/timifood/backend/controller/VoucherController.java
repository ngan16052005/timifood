package com.timifood.backend.controller;

import com.timifood.backend.entity.Voucher;
import com.timifood.backend.repository.VoucherRepository;
import com.timifood.backend.repository.RewardPackageRepository;
import com.timifood.backend.security.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/vouchers")
@RequiredArgsConstructor
public class VoucherController {

    private final VoucherRepository voucherRepository;
    private final RewardPackageRepository rewardPackageRepository;
    private final JwtUtil jwtUtil;
    private final JdbcTemplate jdbcTemplate;

    @GetMapping("/active")
    public ResponseEntity<List<Voucher>> getActiveVouchers(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        UUID userId = null;

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            if (jwtUtil.validateToken(token)) {
                String idStr = jwtUtil.extractUserId(token);
                if (idStr != null) {
                    userId = UUID.fromString(idStr);
                }
            }
        }

        List<Voucher> activeVouchers;
        if (userId != null) {
            activeVouchers = voucherRepository.findActiveVouchersForUser(userId);
        } else {
            activeVouchers = voucherRepository.findActivePublicVouchers();
        }

        return ResponseEntity.ok(activeVouchers);
    }

    // --- Admin Voucher Management ---
    @GetMapping
    public ResponseEntity<?> getAllVouchers() {
        return ResponseEntity.ok(jdbcTemplate.queryForList("SELECT * FROM Vouchers ORDER BY id DESC"));
    }

    @PostMapping
    @Transactional
    public ResponseEntity<?> createVoucher(@RequestBody Map<String, Object> body) {
        String code = (String) body.get("code");
        Integer discountValue = (Integer) body.get("discountValue");
        String discountType = (String) body.get("discountType");
        Integer minOrder = (Integer) body.get("minOrder");
        Integer maxDiscount = (Integer) body.get("maxDiscount");
        String expiryDate = (String) body.get("expiryDate");
        
        try {
            jdbcTemplate.update(
                "INSERT INTO Vouchers (code, description, discountType, discountValue, minOrderValue, maxDiscount, startDate, endDate, usageLimit, usedCount, status) " +
                "VALUES (?, '', ?, ?, ?, ?, GETUTCDATE(), ?, 1000, 0, 1)",
                code, discountType, discountValue, minOrder, maxDiscount, expiryDate
            );
            return ResponseEntity.ok(Map.of("success", true, "message", "Tạo mã giảm giá thành công"));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("message", "Lỗi tạo voucher: " + e.getMessage()));
        }
    }

    @PutMapping("/{code}")
    @Transactional
    public ResponseEntity<?> updateVoucher(@PathVariable String code, @RequestBody Map<String, Object> body) {
        if (body.containsKey("discountValue")) {
            jdbcTemplate.update(
                "UPDATE Vouchers SET discountType=?, discountValue=?, minOrderValue=?, maxDiscount=?, endDate=? WHERE code=?",
                body.get("discountType"), body.get("discountValue"), body.get("minOrderValue"), body.get("maxDiscount"), body.get("expiryDate"), code
            );
        } else if (body.containsKey("status")) {
            jdbcTemplate.update("UPDATE Vouchers SET status = ? WHERE code = ?", body.get("status"), code);
        }
        return ResponseEntity.ok(Map.of("success", true, "message", "Cập nhật voucher thành công"));
    }

    @DeleteMapping("/{code}")
    @Transactional
    public ResponseEntity<?> deleteVoucher(@PathVariable String code) {
        jdbcTemplate.update("DELETE FROM Vouchers WHERE code = ?", code);
        return ResponseEntity.ok(Map.of("success", true, "message", "Xóa voucher thành công"));
    }

    // --- Reward Packages Management ---
    @GetMapping("/rewards")
    public ResponseEntity<?> getActiveRewardPackages() {
        List<com.timifood.backend.entity.RewardPackage> rewards = rewardPackageRepository.findByIsActiveTrueOrderByCostAsc();
        return ResponseEntity.ok(Map.of("success", true, "rewards", rewards));
    }

    @GetMapping("/rewards/all")
    public ResponseEntity<?> getAllRewardPackages() {
        return ResponseEntity.ok(Map.of("success", true, "rewards", jdbcTemplate.queryForList("SELECT * FROM RewardPackages ORDER BY cost ASC")));
    }

    @PostMapping("/rewards")
    @Transactional
    public ResponseEntity<?> createRewardPackage(@RequestBody Map<String, Object> body) {
        jdbcTemplate.update(
            "INSERT INTO RewardPackages (name, description, cost, codePrefix, discountType, discountValue, minOrder, color, isActive) " +
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)",
            body.get("name"), body.get("description"), body.get("cost"), body.get("codePrefix"), 
            body.get("discountType").toString(), body.get("discountValue"), body.get("minOrder"), body.getOrDefault("color", "#ef4444")
        );
        return ResponseEntity.ok(Map.of("success", true, "message", "Thêm gói ưu đãi thành công"));
    }

    @PutMapping("/rewards/{id}")
    @Transactional
    public ResponseEntity<?> updateRewardPackage(@PathVariable int id, @RequestBody Map<String, Object> body) {
        jdbcTemplate.update(
            "UPDATE RewardPackages SET name=?, description=?, cost=?, codePrefix=?, discountType=?, discountValue=?, minOrder=?, color=?, isActive=? WHERE id=?",
            body.get("name"), body.get("description"), body.get("cost"), body.get("codePrefix"), 
            body.get("discountType").toString(), body.get("discountValue"), body.get("minOrder"), body.getOrDefault("color", "#ef4444"), 
            body.getOrDefault("isActive", 1), id
        );
        return ResponseEntity.ok(Map.of("success", true, "message", "Cập nhật gói ưu đãi thành công"));
    }

    @DeleteMapping("/rewards/{id}")
    @Transactional
    public ResponseEntity<?> deleteRewardPackage(@PathVariable int id) {
        jdbcTemplate.update("DELETE FROM RewardPackages WHERE id=?", id);
        return ResponseEntity.ok(Map.of("success", true, "message", "Xóa gói ưu đãi thành công"));
    }

    @GetMapping("/{code}")
    public ResponseEntity<Map<String, Object>> getVoucherByCode(@PathVariable String code, HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        UUID userId = null;

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            if (jwtUtil.validateToken(token)) {
                String idStr = jwtUtil.extractUserId(token);
                if (idStr != null) {
                    userId = UUID.fromString(idStr);
                }
            }
        }

        java.util.Optional<Voucher> voucherOpt = voucherRepository.findActiveVoucherByCode(code, userId);
        if (voucherOpt.isPresent()) {
            return ResponseEntity.ok(Map.of("success", true, "voucher", voucherOpt.get()));
        } else {
            return ResponseEntity.status(404).body(Map.of("success", false, "message", "Mã không hợp lệ hoặc đã hết hạn"));
        }
    }
}
