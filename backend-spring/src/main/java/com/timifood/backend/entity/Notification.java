package com.timifood.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Entity
@Table(name = "Notifications")
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "userId")
    private String userId; // varchar in DB

    private String title;
    
    @com.fasterxml.jackson.annotation.JsonProperty("message")
    private String body;
    
    private String type;
    
    @com.fasterxml.jackson.annotation.JsonProperty("isRead")
    @Column(name = "readStatus")
    private Boolean readStatus;

    @CreationTimestamp
    @Column(name = "createdAt", updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "actionUrl")
    private String actionUrl;
}
