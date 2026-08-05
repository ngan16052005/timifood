package com.timifood.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Entity
@Table(name = "ChatSessions")
public class ChatSession {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "customerId")
    private UUID customerId;
    
    @Column(name = "customerPhone")
    private String customerPhone;
    
    @Column(name = "customerName")
    private String customerName;

    @Column(name = "staffId")
    private UUID staffId;
    
    @Column(name = "staffPhone")
    private String staffPhone;
    
    @Column(name = "staffName")
    private String staffName;

    private String status;

    @CreationTimestamp
    @Column(name = "createdAt", updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "endedAt")
    private LocalDateTime endedAt;
}
