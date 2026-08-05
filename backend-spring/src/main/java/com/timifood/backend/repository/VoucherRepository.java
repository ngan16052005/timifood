package com.timifood.backend.repository;

import com.timifood.backend.entity.Voucher;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface VoucherRepository extends JpaRepository<Voucher, Integer> {
    
    @Query("SELECT v FROM Voucher v WHERE v.status = 1 AND CAST(v.endDate AS DATE) >= CURRENT_DATE AND (v.userId IS NULL OR v.userId = :userId) ORDER BY v.endDate DESC")
    List<Voucher> findActiveVouchersForUser(@Param("userId") UUID userId);

    @Query("SELECT v FROM Voucher v WHERE v.status = 1 AND CAST(v.endDate AS DATE) >= CURRENT_DATE AND v.userId IS NULL ORDER BY v.endDate DESC")
    List<Voucher> findActivePublicVouchers();

    @Query("SELECT v FROM Voucher v WHERE v.code = :code AND v.status = 1 AND CAST(v.endDate AS DATE) >= CURRENT_DATE AND (v.userId IS NULL OR v.userId = :userId)")
    java.util.Optional<Voucher> findActiveVoucherByCode(@Param("code") String code, @Param("userId") UUID userId);
}
