package com.timifood.backend.config;

import com.timifood.backend.security.JwtAuthFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private JwtAuthFilter jwtAuthFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configure(http)) // Bật CORS
            .csrf(csrf -> csrf.disable()) // Tắt CSRF
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)) // Chỉ dùng JWT, không dùng Session
            .authorizeHttpRequests(auth -> auth
                // --- NHỮNG ĐƯỜNG DẪN KÍN (BẮT BUỘC CÓ JWT TOKEN) ---
                .requestMatchers("/api/orders/**").authenticated() // Yêu cầu đăng nhập để mua hàng
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/users").permitAll()
                .requestMatchers("/api/users/**").authenticated() // Yêu cầu đăng nhập để xem/sửa hồ sơ
                .requestMatchers("/api/**").permitAll() // Các API còn lại không cần bảo mật gắt gao thì mở public
                
                // --- MỌI THỨ KHÁC LÀ FRONTEND (HTML, CSS, JS, ASSETS) -> CHO PHÉP TẤT CẢ ---
                .anyRequest().permitAll()
            );

        // Chèn bộ lọc (Middleware) JWT của chúng ta vào để nó bắt Token trước khi vào Controller
        http.addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
