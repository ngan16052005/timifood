package com.timifood.backend.controller;

import com.timifood.backend.entity.Notification;
import com.timifood.backend.repository.NotificationRepository;
import com.timifood.backend.security.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationRepository notificationRepository;
    private final JwtUtil jwtUtil;

    private String getUserIdFromToken(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            if (jwtUtil.validateToken(token)) {
                return jwtUtil.extractUserId(token);
            }
        }
        return null;
    }

    private Integer getUserTypeFromToken(HttpServletRequest request) {
        // Simple implementation, assumes JwtUtil has a way to get userType or we just fetch from DB.
        // For now, returning 3 (normal user) as default. 
        // Admin notifications logic can be enhanced later if needed.
        return 3;
    }

    @GetMapping
    public ResponseEntity<?> getNotifications(HttpServletRequest request) {
        String userIdStr = getUserIdFromToken(request);
        if (userIdStr == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "Unauthorized"));
        }

        List<Notification> notifications = notificationRepository.findNotificationsForUser(userIdStr);
        return ResponseEntity.ok(notifications);
    }

    @PutMapping("/{id}/read")
    @Transactional
    public ResponseEntity<?> markAsRead(@PathVariable UUID id, HttpServletRequest request) {
        String userIdStr = getUserIdFromToken(request);
        if (userIdStr == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "Unauthorized"));
        }

        notificationRepository.findById(id).ifPresent(n -> {
            if (n.getUserId().equals(userIdStr) || n.getUserId().equals("all")) {
                n.setReadStatus(true);
                notificationRepository.save(n);
            }
        });
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PutMapping("/read-all")
    @Transactional
    public ResponseEntity<?> markAllAsRead(HttpServletRequest request) {
        String userIdStr = getUserIdFromToken(request);
        if (userIdStr == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "Unauthorized"));
        }

        List<Notification> notifications = notificationRepository.findNotificationsForUser(userIdStr);
        for (Notification n : notifications) {
            if (n.getUserId().equals(userIdStr)) {
                n.setReadStatus(true);
                notificationRepository.save(n);
            }
        }
        return ResponseEntity.ok(Map.of("success", true));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> deleteNotification(@PathVariable UUID id, HttpServletRequest request) {
        String userIdStr = getUserIdFromToken(request);
        if (userIdStr == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "Unauthorized"));
        }

        notificationRepository.findById(id).ifPresent(n -> {
            if (n.getUserId().equals(userIdStr)) {
                notificationRepository.delete(n);
            }
        });
        return ResponseEntity.ok(Map.of("success", true));
    }

    @DeleteMapping
    @Transactional
    public ResponseEntity<?> deleteAllNotifications(HttpServletRequest request) {
        String userIdStr = getUserIdFromToken(request);
        if (userIdStr == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "Unauthorized"));
        }

        List<Notification> notifications = notificationRepository.findNotificationsForUser(userIdStr);
        for (Notification n : notifications) {
            if (n.getUserId().equals(userIdStr)) {
                notificationRepository.delete(n);
            }
        }
        return ResponseEntity.ok(Map.of("success", true));
    }
}
