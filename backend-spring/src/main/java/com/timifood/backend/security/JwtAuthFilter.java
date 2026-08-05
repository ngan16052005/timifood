package com.timifood.backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.List;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtil jwtUtil;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        final String authorizationHeader = request.getHeader("Authorization");

        String phone = null;
        String jwt = null;

        // Tương đương middleware authenticateToken trong Node.js
        // Trích xuất Token từ Header: "Bearer eyJhbGci..."
        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            jwt = authorizationHeader.substring(7);
            try {
                phone = jwtUtil.extractPhone(jwt);
            } catch (Exception e) {
                // Bỏ qua nếu Token sai định dạng hoặc hết hạn (Sẽ bị Spring Security chặn ở bước sau)
            }
        }

        // Nếu có Token và người dùng chưa được cấp quyền trong Request hiện tại
        if (phone != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            
            // Xác thực xem Token còn hạn không
            if (jwtUtil.validateToken(jwt)) {
                
                // Đọc phân quyền từ Token: userType = 1 là Admin, còn lại là User
                Integer userType = jwtUtil.extractUserType(jwt);
                String role = (userType != null && userType == 1) ? "ROLE_ADMIN" : "ROLE_USER";
                List<SimpleGrantedAuthority> authorities = Collections.singletonList(new SimpleGrantedAuthority(role));

                // Báo cho Spring Security biết request này là hợp lệ, kèm theo danh sách quyền
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        phone, null, authorities);
                
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                
                // Cài đặt User vào Context (Giống req.user = user trong Node.js)
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }
        
        // Tiếp tục đi tới Controller
        filterChain.doFilter(request, response);
    }
}
