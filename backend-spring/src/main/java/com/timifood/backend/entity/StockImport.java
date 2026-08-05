package com.timifood.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Entity
@Table(name = "StockImports")
public class StockImport {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "productId")
    private UUID productId;

    private Integer quantity;
    
    @Column(name = "importPrice")
    private Double importPrice;
    
    @Column(name = "totalPrice")
    private Double totalPrice;

    @CreationTimestamp
    @Column(name = "importDate", updatable = false)
    private LocalDateTime importDate;

    private String note;

    @Column(name = "importedBy")
    private UUID importedBy;

    @Column(name = "purchaseOrderId")
    private UUID purchaseOrderId;
}
