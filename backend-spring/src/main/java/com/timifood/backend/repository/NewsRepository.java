package com.timifood.backend.repository;

import com.timifood.backend.entity.News;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface NewsRepository extends JpaRepository<News, UUID> {
    List<News> findByStatusOrderByCreatedAtDesc(Integer status);
}
