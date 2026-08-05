package com.timifood.backend.controller;

import com.timifood.backend.dto.ResponseObject;
import com.timifood.backend.entity.User;
import com.timifood.backend.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
    
    private final UserService userService;
    private final JdbcTemplate jdbcTemplate;
    private final PasswordEncoder passwordEncoder;

    @GetMapping
    public ResponseEntity<?> getAllUsers() {
        // Trả về JSON array như Node.js (không bọc trong ResponseObject.data)
        return ResponseEntity.ok(userService.getAllUsers());
    }
    
    @GetMapping("/phone/{phone}")
    public ResponseEntity<ResponseObject> getUserByPhone(@PathVariable String phone) {
        Optional<User> user = userService.getUserByPhone(phone);
        if (user.isPresent()) {
             return ResponseEntity.ok(new ResponseObject("success", "Tìm thấy người dùng", user.get()));
        }
        return ResponseEntity.status(404).body(new ResponseObject("error", "Không tìm thấy người dùng với số điện thoại này", null));
    }

    @PutMapping("/{phone}")
    @Transactional
    public ResponseEntity<?> updateUser(@PathVariable String phone, @RequestBody Map<String, Object> body) {
        String fullname = (String) body.get("fullname");
        String email = (String) body.get("email");
        String address = (String) body.get("address");
        String password = (String) body.get("password");
        Integer status = (Integer) body.get("status");
        Integer userType = (Integer) body.get("userType");

        String currentPassword = jdbcTemplate.queryForObject("SELECT password FROM Users WHERE phone = ?", String.class, phone);

        String finalPassword = currentPassword;
        if (password != null && !password.isEmpty() && !password.startsWith("$2")) {
            finalPassword = passwordEncoder.encode(password);
        }

        jdbcTemplate.update(
            "UPDATE Users SET fullname = ?, email = ?, address = ?, password = ?, status = ?, userType = ? WHERE phone = ?",
            fullname, email, address, finalPassword, status, userType, phone
        );

        return ResponseEntity.ok(Map.of("success", true, "message", "Cập nhật tài khoản thành công"));
    }

    @DeleteMapping("/{phone}")
    @Transactional
    public ResponseEntity<?> deleteUser(@PathVariable String phone) {
        jdbcTemplate.update("DELETE FROM Users WHERE phone = ?", phone);
        return ResponseEntity.ok(Map.of("message", "User deleted", "success", true));
    }
}
