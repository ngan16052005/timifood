package com.timifood.backend.service;

import com.timifood.backend.entity.Product;
import com.timifood.backend.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class ProductService {

    @Autowired
    private ProductRepository productRepository;

    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    public List<Product> getActiveProducts() {
        return productRepository.findByStatus(1);
    }

    public List<Product> searchProducts(String title) {
        return productRepository.findByTitleContainingIgnoreCaseAndStatus(title, 1);
    }

    public Optional<Product> getProductById(UUID id) {
        return productRepository.findById(id);
    }

    public Product saveProduct(Product product) {
        return productRepository.save(product);
    }

    public void deleteProduct(UUID id) {
        // Trong thực tế nên dùng Soft Delete (cập nhật status = 0)
        productRepository.deleteById(id);
    }
}
