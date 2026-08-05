package com.timifood.backend.controller;

import com.timifood.backend.entity.News;
import com.timifood.backend.repository.NewsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/news")
@RequiredArgsConstructor
public class NewsController {

    private final NewsRepository newsRepository;

    @GetMapping
    public ResponseEntity<?> getPublicNews() {
        // Only return published news (status = 1)
        List<News> newsList = newsRepository.findByStatusOrderByCreatedAtDesc(1);
        return ResponseEntity.ok(Map.of("success", true, "news", newsList));
    }
}
