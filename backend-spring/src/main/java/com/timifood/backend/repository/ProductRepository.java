package com.timifood.backend.repository;

import com.timifood.backend.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProductRepository extends JpaRepository<Product, UUID> {
    // Spring Data JPA sẽ tự động generate ra câu SQL (SELECT * FROM Products WHERE status = ?)
    List<Product> findByStatus(Integer status);
    
    // Tương đương: SELECT * FROM Products WHERE category = ? AND status = ?
    List<Product> findByCategoryAndStatus(String category, Integer status);
    
    // Tìm kiếm sản phẩm theo tên
    List<Product> findByTitleContainingIgnoreCaseAndStatus(String title, Integer status);
}
