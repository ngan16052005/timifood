package com.timifood.backend.repository;

import com.timifood.backend.entity.StockImport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface StockImportRepository extends JpaRepository<StockImport, UUID> {
}
