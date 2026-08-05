package com.timifood.backend.config;

import com.corundumstudio.socketio.SocketIOServer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SocketIOConfig {

    // Spring Boot chạy ở 8080, nên máy chủ Chat sẽ chạy độc lập ở 9092
    private String host = "0.0.0.0";
    private Integer port = 9092;

    @Bean
    public SocketIOServer socketIOServer() {
        com.corundumstudio.socketio.Configuration config = new com.corundumstudio.socketio.Configuration();
        config.setHostname(host);
        config.setPort(port);
        config.setOrigin("*"); // Cho phép mọi nguồn kết nối (CORS)
        
        return new SocketIOServer(config);
    }
}
