package com.timifood.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;
import com.fasterxml.jackson.annotation.JsonProperty;

@Data
@Entity
@Table(name = "Vouchers")
public class Voucher {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String code;
    private String description;
    
    @Column(name = "discountType")
    private String discountType;
    
    @Column(name = "discountValue")
    private Integer discountValue;
    
    @Column(name = "minOrderValue")
    @JsonProperty("minOrder")
    private Integer minOrderValue;
    
    @Column(name = "maxDiscount")
    private Integer maxDiscount;
    
    @Column(name = "startDate")
    private LocalDateTime startDate;
    
    @Column(name = "endDate")
    @JsonProperty("expiryDate")
    private LocalDateTime endDate;
    
    @Column(name = "usageLimit")
    private Integer usageLimit;
    
    @Column(name = "usedCount")
    private Integer usedCount;
    
    private Integer status;
    
    @Column(name = "userId")
    private UUID userId;
}
