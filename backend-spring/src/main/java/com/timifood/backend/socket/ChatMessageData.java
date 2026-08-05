package com.timifood.backend.socket;

import lombok.Data;

@Data
public class ChatMessageData {
    private String sender;
    private String text;
    private String sessionId;
}
