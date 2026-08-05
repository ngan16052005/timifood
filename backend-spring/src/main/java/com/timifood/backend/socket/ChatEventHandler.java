package com.timifood.backend.socket;

import com.corundumstudio.socketio.AckRequest;
import com.corundumstudio.socketio.SocketIOClient;
import com.corundumstudio.socketio.SocketIOServer;
import com.corundumstudio.socketio.annotation.OnConnect;
import com.corundumstudio.socketio.annotation.OnDisconnect;
import com.corundumstudio.socketio.annotation.OnEvent;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class ChatEventHandler {

    private final SocketIOServer server;
    // Danh sách các user đang kết nối
    private final Map<String, SocketIOClient> clients = new ConcurrentHashMap<>();

    @Autowired
    public ChatEventHandler(SocketIOServer server) {
        this.server = server;
        this.server.addListeners(this); // Đăng ký bộ lắng nghe sự kiện
    }

    // Giống io.on('connection', ...) của Node.js
    @OnConnect
    public void onConnect(SocketIOClient client) {
        clients.put(client.getSessionId().toString(), client);
        System.out.println("🟢 Client kết nối Chat: " + client.getSessionId());
    }

    // Giống socket.on('disconnect', ...)
    @OnDisconnect
    public void onDisconnect(SocketIOClient client) {
        clients.remove(client.getSessionId().toString());
        System.out.println("🔴 Client rời Chat: " + client.getSessionId());
    }

    // Lắng nghe sự kiện nhắn tin từ Frontend
    // Giống socket.on('send_message', ...)
    @OnEvent("send_message")
    public void onSendMessage(SocketIOClient client, ChatMessageData data, AckRequest ackSender) {
        System.out.println("Tin nhắn từ " + data.getSender() + ": " + data.getText());
        
        // Phát sự kiện 'receive_message' lại cho TẤT CẢ mọi người (giống io.emit)
        server.getBroadcastOperations().sendEvent("receive_message", data);
        
        // Trong thực tế sẽ code thêm lưu tin nhắn vào CSDL SQL Server ở đây.
    }
}
