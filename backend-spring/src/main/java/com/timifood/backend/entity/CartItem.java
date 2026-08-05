package com.timifood.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.UUID;
import java.util.Date;

@Entity
@Table(name = "CartItems")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CartItem {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @Column(name = "userId")
    private UUID userId;

    @Column(name = "productId")
    private UUID productId;

    @Column(name = "quantity")
    private Integer quantity;

    @Column(name = "note", columnDefinition = "NVARCHAR(MAX)")
    private String note;

    @Column(name = "createdAt")

    private Date createdAt;
    
    // Móc nối với bảng Product để khi lấy dữ liệu Giỏ hàng, sẽ lấy được tên món, ảnh và giá mà không cần code truy vấn phụ
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "productId", insertable = false, updatable = false)
    private Product product;
}
