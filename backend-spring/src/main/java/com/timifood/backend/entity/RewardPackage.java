package com.timifood.backend.entity;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "RewardPackages")
public class RewardPackage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String name;
    private String description;
    private Integer cost;
    
    @Column(name = "codePrefix")
    private String codePrefix;
    
    @Column(name = "discountType")
    private String discountType;
    
    @Column(name = "discountValue")
    private Integer discountValue;
    
    @Column(name = "minOrder")
    private Integer minOrder;
    
    private String color;
    
    @Column(name = "isActive")
    private Boolean isActive;
}
