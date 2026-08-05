package com.timifood.backend.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.util.UUID;

@Data
@Entity
@Table(name = "PushSubscriptions")
public class PushSubscription {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "userId")
    private UUID userId;

    private String endpoint;
    private String p256dh;
    private String auth;
}
