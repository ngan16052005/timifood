package com.timifood.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.UUID;
import java.util.Date;
import com.fasterxml.jackson.annotation.JsonProperty;

@Entity
@Table(name = "Users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @Column(name = "fullname", length = 255)
    private String fullname;

    @Column(name = "phone", length = 20, unique = true)
    private String phone;

    @Column(name = "password", length = 255)
    private String password;

    @Column(name = "address", columnDefinition = "NVARCHAR(MAX)")
    private String address;

    @Column(name = "email", length = 255)
    private String email;

    @Column(name = "status")
    private Integer status;

    @Column(name = "joinDate")
    @JsonProperty("join")
    private Date joinDate;

    @Column(name = "userType")
    private Integer userType;
}
