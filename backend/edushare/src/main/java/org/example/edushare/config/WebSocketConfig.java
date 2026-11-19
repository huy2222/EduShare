package org.example.edushare.config;

import lombok.RequiredArgsConstructor;
import org.example.edushare.feature.auth.config.CorsProperties;
import org.example.edushare.feature.notification.websocket.NotificationWebSocketHandler;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketConfigurer {
    private final NotificationWebSocketHandler notificationHandler;
    private final CorsProperties corsProperties;

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(notificationHandler, "/api/v1/ws/notifications")
                .setAllowedOrigins(corsProperties.getAllowedOrigins().toArray(String[]::new));
    }
}
