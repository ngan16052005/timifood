package com.timifood.backend.controller;

import com.timifood.backend.dto.LoginRequest;
import com.timifood.backend.dto.RegisterRequest;
import com.timifood.backend.dto.ResponseObject;
import com.timifood.backend.entity.User;
import com.timifood.backend.security.JwtUtil;
import com.timifood.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
public class AuthController {

    
    private final UserService userService;

    
    private final PasswordEncoder passwordEncoder;

    
    private final JwtUtil jwtUtil;

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody LoginRequest request) {
        Map<String, Object> response = new HashMap<>();
        try {
            Optional<User> userOpt = userService.getUserByPhone(request.getPhone());
            
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                // Xử lý tương thích: Node.js tạo hash với $2b$, nhưng Spring Security BCrypt chỉ hỗ trợ $2a$ (chúng giống hệt nhau về toán học)
                String dbPassword = user.getPassword();
                if (dbPassword != null) {
                    dbPassword = dbPassword.trim();
                    if (dbPassword.startsWith("$2b$")) {
                        dbPassword = "$2a$" + dbPassword.substring(4);
                    }
                }
                
                boolean isMatch = false;
                try {
                    isMatch = passwordEncoder.matches(request.getPassword(), dbPassword);
                } catch (Exception e) {
                    // Ignore Invalid salt revision exceptions
                }
                
                // Hỗ trợ mật khẩu plain text cũ và tự động migrate sang BCrypt (giống hệt Node.js)
                if (!isMatch && request.getPassword() != null && request.getPassword().equals(user.getPassword())) {
                    user.setPassword(passwordEncoder.encode(request.getPassword()));
                    userService.saveUser(user);
                    isMatch = true;
                }
                
                if (isMatch) {
                    String token = jwtUtil.generateToken(user.getId(), user.getPhone(), user.getUserType());
                    
                    response.put("success", true);
                    response.put("message", "Đăng nhập thành công");
                    response.put("token", token);
                    response.put("user", user); 
                    
                    return ResponseEntity.ok(response);
                }
            }
            
            response.put("success", false);
            response.put("message", "Số điện thoại hoặc mật khẩu không chính xác");
            return ResponseEntity.status(401).body(response);
        } catch (Exception ex) {
            response.put("success", false);
            response.put("message", "Error: " + ex.getMessage() + " | Type: " + ex.getClass().getName() + " | StackTrace: " + ex.getStackTrace()[0].toString());
            return ResponseEntity.status(500).body(response);
        }
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@RequestBody RegisterRequest request) {
        Map<String, Object> response = new HashMap<>();
        
        // Bước 1: Kiểm tra xem số điện thoại đã tồn tại chưa
        if (userService.getUserByPhone(request.getPhone()).isPresent()) {
            response.put("success", false);
            response.put("message", "Số điện thoại đã được đăng ký");
            return ResponseEntity.status(400).body(response);
        }
        
        // Bước 2: Tạo đối tượng User mới
        User newUser = new User();
        newUser.setFullname(request.getFullname());
        newUser.setPhone(request.getPhone());
        newUser.setPassword(passwordEncoder.encode(request.getPassword())); 
        newUser.setEmail(request.getEmail());
        newUser.setStatus(1); // 1 = Kích hoạt
        newUser.setUserType(0); // 0 = Khách hàng thường
        newUser.setJoinDate(new java.util.Date());

        // Bước 3: Lưu vào CSDL
        User savedUser = userService.saveUser(newUser);
        
        // Bước 4: Sinh JWT Token
        String token = jwtUtil.generateToken(savedUser.getId(), savedUser.getPhone(), savedUser.getUserType());
        
        response.put("success", true);
        response.put("message", "Đăng ký thành công");
        response.put("token", token);
        response.put("user", savedUser); 
        
        return ResponseEntity.status(201).body(response);
    }
}
