package com.timifood.backend.controller;

import com.timifood.backend.dto.ResponseObject;
import com.timifood.backend.entity.Product;
import com.timifood.backend.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;
    private final JdbcTemplate jdbcTemplate;

    // API: GET /api/products
    @GetMapping
    public ResponseEntity<List<Product>> getAllProducts(@RequestParam(required = false, defaultValue = "") String search) {
        if (!search.isEmpty()) {
            return ResponseEntity.ok(productService.searchProducts(search));
        }
        List<Product> products = productService.getActiveProducts();
        return ResponseEntity.ok(products);
    }

    // API: GET /api/products/admin/paginated
    @GetMapping("/admin/paginated")
    public ResponseEntity<?> getPaginatedProducts(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(defaultValue = "Tất cả") String category,
            @RequestParam(defaultValue = "") String search) {

        int offset = (page - 1) * limit;
        String whereClause = "1=1";
        
        if (!search.isEmpty()) {
            whereClause += " AND (title LIKE '%" + search + "%' OR description LIKE '%" + search + "%')";
        }

        if ("Đã ẩn".equals(category)) {
            whereClause += " AND status = 0";
        } else if (!"Tất cả".equals(category)) {
            whereClause += " AND category = '" + category + "' AND status = 1";
        } else {
            whereClause += " AND status = 1";
        }

        String countQuery = "SELECT COUNT(*) FROM Products WHERE " + whereClause;
        Integer totalCount = jdbcTemplate.queryForObject(countQuery, Integer.class);

        String dataQuery = "SELECT * FROM Products WHERE " + whereClause + " ORDER BY title ASC OFFSET ? ROWS FETCH NEXT ? ROWS ONLY";
        List<Map<String, Object>> products = jdbcTemplate.queryForList(dataQuery, offset, limit);

        return ResponseEntity.ok(Map.of(
                "data", products,
                "totalCount", totalCount,
                "page", page,
                "limit", limit,
                "totalPages", Math.ceil((double) totalCount / limit)
        ));
    }

    // API: GET /api/products/{id}
    @GetMapping("/{id}")
    public ResponseEntity<Product> getProductById(@PathVariable UUID id) {
        Optional<Product> product = productService.getProductById(id);
        if (product.isPresent()) {
            return ResponseEntity.ok(product.get());
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    // API: POST /api/products
    @PostMapping
    @Transactional
    public ResponseEntity<ResponseObject> createProduct(@RequestBody Product product) {
        product.setStatus(1); // Mặc định kích hoạt
        if (product.getStock() == null) product.setStock(0);
        if (product.getMinStock() == null) product.setMinStock(5);
        Product savedProduct = productService.saveProduct(product);
        return ResponseEntity.status(HttpStatus.CREATED).body(
            new ResponseObject("success", "Thêm sản phẩm thành công", savedProduct)
        );
    }

    // API: PUT /api/products/{id}
    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<?> updateProduct(@PathVariable UUID id, @RequestBody Product productDetails) {
        return productService.getProductById(id).map(product -> {
            product.setTitle(productDetails.getTitle());
            product.setImg(productDetails.getImg());
            product.setCategory(productDetails.getCategory());
            product.setPrice(productDetails.getPrice());
            product.setDescription(productDetails.getDescription());
            product.setStock(productDetails.getStock());
            product.setMinStock(productDetails.getMinStock());
            product.setStatus(productDetails.getStatus());
            productService.saveProduct(product);
            return ResponseEntity.ok(Map.of("success", true, "message", "Cập nhật sản phẩm thành công"));
        }).orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Không tìm thấy sản phẩm")));
    }

    // API: DELETE /api/products/{id}
    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> deleteProduct(@PathVariable UUID id) {
        Integer orderCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM OrderDetails WHERE productId = ?", Integer.class, id);
        if (orderCount != null && orderCount > 0) {
            return ResponseEntity.badRequest().body(Map.of("message", "Không thể xóa vĩnh viễn sản phẩm này vì đã có trong lịch sử đơn hàng. Vui lòng sử dụng chức năng ẩn."));
        }
        
        Optional<Product> product = productService.getProductById(id);
        if (product.isPresent()) {
            jdbcTemplate.update("DELETE FROM Products WHERE id = ?", id);
            return ResponseEntity.ok(Map.of("success", true, "message", "Xóa sản phẩm thành công"));
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Không tìm thấy sản phẩm"));
    }
}
