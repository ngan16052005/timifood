package com.timifood.backend.dto;

import lombok.Data;

@Data
public class RegisterRequest {
    private String fullname;
    private String phone;
    private String password;
    private String email;
}
