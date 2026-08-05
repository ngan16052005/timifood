package com.timifood.backend.repository;

import com.timifood.backend.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {
    
    @Query("SELECT n FROM Notification n WHERE n.userId = 'all' OR n.userId = :userId ORDER BY n.createdAt DESC")
    List<Notification> findNotificationsForUser(@Param("userId") String userId);
}
