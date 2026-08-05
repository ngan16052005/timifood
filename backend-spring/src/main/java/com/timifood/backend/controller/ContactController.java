package com.timifood.backend.controller;

import com.timifood.backend.entity.Contact;
import com.timifood.backend.repository.ContactRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/contacts")
@RequiredArgsConstructor
public class ContactController {

    private final ContactRepository contactRepository;

    @PostMapping
    @Transactional
    public ResponseEntity<?> submitContactForm(@RequestBody Contact contact) {
        contact.setStatus(0); // 0 = unread
        contactRepository.save(contact);
        return ResponseEntity.ok(Map.of("success", true, "message", "Cảm ơn bạn đã liên hệ. Chúng tôi sẽ phản hồi sớm nhất."));
    }

    // Admin endpoints
    @GetMapping
    public ResponseEntity<?> getAllContacts() {
        return ResponseEntity.ok(Map.of("success", true, "contacts", contactRepository.findAll()));
    }

    @PutMapping("/{id}/status")
    @Transactional
    public ResponseEntity<?> updateContactStatus(@PathVariable UUID id, @RequestBody Map<String, Integer> body) {
        contactRepository.findById(id).ifPresent(c -> {
            c.setStatus(body.get("status"));
            contactRepository.save(c);
        });
        return ResponseEntity.ok(Map.of("success", true));
    }
}
