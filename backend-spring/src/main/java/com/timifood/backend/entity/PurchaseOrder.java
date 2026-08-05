package com.timifood.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Entity
@Table(name = "PurchaseOrders")
public class PurchaseOrder {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "orderCode")
    private String orderCode;

    @Column(name = "supplierId")
    private UUID supplierId;

    @Column(name = "staffId")
    private UUID staffId;

    @Column(name = "totalAmount")
    private Double totalAmount;

    private String note;
    private Integer status;

    @CreationTimestamp
    @Column(name = "importDate", updatable = false)
    private LocalDateTime importDate;
}
