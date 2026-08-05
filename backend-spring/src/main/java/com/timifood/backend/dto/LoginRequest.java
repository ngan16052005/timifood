package com.timifood.backend.dto;

import lombok.Data;

@Data
public class LoginRequest {
    private String username;
    private String password;
    
    // Cung cấp thêm getter getPhone để tương thích với AuthController
    public String getPhone() {
        return this.username;
    }
}
