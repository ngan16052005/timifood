package com.timifood.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.UUID;

@Entity
@Table(name = "OrderDetails")
@Data
@NoArgsConstructor
@AllArgsConstructor
@IdClass(OrderDetailId.class) // Báo cho Spring biết bảng này dùng khóa chính ghép
public class OrderDetail {
    @Id
    @Column(name = "orderId")
    private UUID orderId;

    @Id
    @Column(name = "productId")
    private UUID productId;

    @Column(name = "price")
    private Double price;

    @Column(name = "quantity")
    private Integer quantity;

    @Column(name = "note", columnDefinition = "NVARCHAR(MAX)")
    private String note;
}
