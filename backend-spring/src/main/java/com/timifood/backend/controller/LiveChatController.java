package com.timifood.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.Map;

@RestController
@RequestMapping("/api/livechats")
public class LiveChatController {

    @GetMapping
    public ResponseEntity<?> getLivechats() {
        // Return an empty list for now. Needs WebSocket/Socket.IO integration later.
        return ResponseEntity.ok(new ArrayList<>());
    }
}
