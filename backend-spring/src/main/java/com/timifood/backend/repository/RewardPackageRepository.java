package com.timifood.backend.repository;

import com.timifood.backend.entity.RewardPackage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RewardPackageRepository extends JpaRepository<RewardPackage, Integer> {
    List<RewardPackage> findByIsActiveTrueOrderByCostAsc();
}
