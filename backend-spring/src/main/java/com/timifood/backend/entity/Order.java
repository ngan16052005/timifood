package com.timifood.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.UUID;
import java.util.Date;

@Entity
@Table(name = "Orders")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @Column(name = "orderCode", length = 50, unique = true)
    private String orderCode;

    @Column(name = "userId")
    private UUID userId;

    @Column(name = "orderDate")

    private Date orderDate;

    @Column(name = "totalPrice")
    private Double totalPrice;

    @Column(name = "deliveryType", length = 100)
    private String deliveryType;

    @Column(name = "deliveryTime", length = 100)
    private String deliveryTime;

    @Column(name = "deliveryDate")

    private Date deliveryDate;

    @Column(name = "receiverName", length = 255)
    private String receiverName;

    @Column(name = "receiverPhone", length = 20)
    private String receiverPhone;

    @Column(name = "receiverAddress", columnDefinition = "NVARCHAR(MAX)")
    private String receiverAddress;

    @Column(name = "note", columnDefinition = "NVARCHAR(MAX)")
    private String note;

    @Column(name = "status")
    private Integer status;
}
