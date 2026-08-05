package com.timifood.backend.controller;

import com.timifood.backend.entity.Supplier;
import com.timifood.backend.repository.SupplierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/suppliers")
@RequiredArgsConstructor
public class SupplierController {

    private final SupplierRepository supplierRepository;

    @GetMapping
    public ResponseEntity<?> getSuppliers() {
        // Find all suppliers with status = 1 (active)
        List<Supplier> suppliers = supplierRepository.findAll().stream()
                .filter(s -> s.getStatus() != null && s.getStatus() == 1)
                .collect(Collectors.toList());
        return ResponseEntity.ok(suppliers);
    }

    @PostMapping
    @Transactional
    public ResponseEntity<?> createSupplier(@RequestBody Supplier supplier) {
        if (supplier.getName() == null || supplier.getName().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Tên nhà cung cấp là bắt buộc"));
        }
        supplier.setStatus(1);
        Supplier saved = supplierRepository.save(supplier);
        return ResponseEntity.status(201).body(Map.of("success", true, "supplier", saved));
    }

    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<?> updateSupplier(@PathVariable UUID id, @RequestBody Supplier supplier) {
        return supplierRepository.findById(id).map(existing -> {
            existing.setName(supplier.getName());
            existing.setPhone(supplier.getPhone());
            existing.setEmail(supplier.getEmail());
            existing.setAddress(supplier.getAddress());
            supplierRepository.save(existing);
            return ResponseEntity.ok(Map.of("success", true, "message", "Cập nhật thành công"));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> deleteSupplier(@PathVariable UUID id) {
        return supplierRepository.findById(id).map(existing -> {
            existing.setStatus(0);
            supplierRepository.save(existing);
            return ResponseEntity.ok(Map.of("success", true, "message", "Xóa thành công"));
        }).orElse(ResponseEntity.notFound().build());
    }
}
