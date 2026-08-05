package com.timifood.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.util.Date;
import java.util.UUID;

@Entity
@Table(name = "Reviews")
@Data
public class Review {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private UUID userId;
    private UUID productId;
    
    private Integer rating;
    
    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String comment;
    
    private Date createdAt;
}
