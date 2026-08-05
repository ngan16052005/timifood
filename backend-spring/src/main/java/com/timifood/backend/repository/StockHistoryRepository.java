package com.timifood.backend.repository;

import com.timifood.backend.entity.StockHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface StockHistoryRepository extends JpaRepository<StockHistory, Integer> {
}
