package com.timifood.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.UUID;

@Entity
@Table(name = "Products")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @Column(name = "title", length = 255)
    private String title;

    @Column(name = "img", columnDefinition = "NVARCHAR(MAX)")
    private String img;

    @Column(name = "category", length = 100)
    private String category;

    @Column(name = "price")
    private Double price;

    @Column(name = "description", columnDefinition = "NVARCHAR(MAX)")
    @com.fasterxml.jackson.annotation.JsonProperty("desc")
    private String description;

    @Column(name = "status")
    private Integer status;

    @Column(name = "stock")
    private Integer stock;

    @Column(name = "minStock")
    private Integer minStock;
}
