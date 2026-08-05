package com.timifood.backend.controller;

import com.timifood.backend.entity.News;
import com.timifood.backend.repository.NewsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/news")
@RequiredArgsConstructor
public class AdminNewsController {

    private final NewsRepository newsRepository;

    @GetMapping
    public ResponseEntity<?> getAllNews() {
        return ResponseEntity.ok(Map.of("success", true, "data", newsRepository.findAll()));
    }

    @PostMapping
    @Transactional
    public ResponseEntity<?> createNews(@RequestBody News news) {
        if (news.getStatus() == null) {
            news.setStatus(1); // Default to public
        }
        News saved = newsRepository.save(news);
        return ResponseEntity.status(201).body(Map.of("success", true, "message", "Tạo tin tức thành công", "news", saved));
    }

    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<?> updateNews(@PathVariable UUID id, @RequestBody News newsDetails) {
        return newsRepository.findById(id).map(news -> {
            news.setTitle(newsDetails.getTitle());
            news.setContent(newsDetails.getContent());
            news.setThumbnail(newsDetails.getThumbnail());
            news.setAuthor(newsDetails.getAuthor());
            news.setStatus(newsDetails.getStatus());
            newsRepository.save(news);
            return ResponseEntity.ok(Map.of("success", true, "message", "Cập nhật thành công"));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> deleteNews(@PathVariable UUID id) {
        if (newsRepository.existsById(id)) {
            newsRepository.deleteById(id);
            return ResponseEntity.ok(Map.of("success", true, "message", "Xóa thành công"));
        }
        return ResponseEntity.notFound().build();
    }
}
