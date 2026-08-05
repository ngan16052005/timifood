package com.timifood.backend.controller;

import com.timifood.backend.dto.ResponseObject;
import com.timifood.backend.entity.Category;
import com.timifood.backend.service.CategoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {
    
    private final CategoryService categoryService;
    private final JdbcTemplate jdbcTemplate;

    @GetMapping
    public ResponseEntity<List<Category>> getAllCategories() {
        return ResponseEntity.ok(categoryService.getAllCategories());
    }
    
    @PostMapping
    @Transactional
    public ResponseEntity<?> createCategory(@RequestBody Map<String, String> body) {
        String name = body.get("name");
        if (name == null || name.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Tên danh mục không được để trống"));
        }
        
        Integer count = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM Categories WHERE LOWER(TRIM(name)) = LOWER(?)", 
            Integer.class, name.trim()
        );
        if (count != null && count > 0) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Tên danh mục đã tồn tại!"));
        }

        jdbcTemplate.update("INSERT INTO Categories (name) VALUES (?)", name);
        return ResponseEntity.ok(Map.of("success", true, "message", "Thêm danh mục thành công"));
    }

    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<?> updateCategory(@PathVariable int id, @RequestBody Map<String, String> body) {
        String name = body.get("name");
        if (name == null || name.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Tên danh mục không được để trống"));
        }

        Integer count = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM Categories WHERE LOWER(TRIM(name)) = LOWER(?) AND id != ?", 
            Integer.class, name.trim(), id
        );
        if (count != null && count > 0) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Tên danh mục đã tồn tại cho một danh mục khác!"));
        }

        jdbcTemplate.update("UPDATE Categories SET name = ? WHERE id = ?", name, id);
        return ResponseEntity.ok(Map.of("success", true, "message", "Cập nhật danh mục thành công"));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> deleteCategory(@PathVariable int id) {
        List<String> names = jdbcTemplate.queryForList("SELECT name FROM Categories WHERE id = ?", String.class, id);
        if (names.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("success", false, "message", "Không tìm thấy danh mục"));
        }

        String catName = names.get(0);
        Integer productCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM Products WHERE category = ?", Integer.class, catName);
        if (productCount != null && productCount > 0) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Không thể xóa danh mục đang có sản phẩm"));
        }

        jdbcTemplate.update("DELETE FROM Categories WHERE id = ?", id);
        return ResponseEntity.ok(Map.of("success", true, "message", "Xóa danh mục thành công"));
    }
}
