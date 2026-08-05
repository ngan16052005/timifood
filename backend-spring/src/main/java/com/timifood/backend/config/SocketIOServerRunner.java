package com.timifood.backend.config;

import com.corundumstudio.socketio.SocketIOServer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import jakarta.annotation.PreDestroy;

@Component
public class SocketIOServerRunner implements CommandLineRunner {

    @Autowired
    private SocketIOServer server;

    // Hàm này sẽ tự động được gọi khi Spring Boot khởi động xong
    @Override
    public void run(String... args) throws Exception {
        server.start();
        System.out.println("🚀 Socket.IO Server đang lắng nghe trên cổng " + server.getConfiguration().getPort());
    }

    // Tắt server chat gọn gàng khi bạn stop ứng dụng Spring Boot
    @PreDestroy
    public void stop() {
        if (server != null) {
            server.stop();
            System.out.println("🛑 Socket.IO Server đã tắt.");
        }
    }
}
