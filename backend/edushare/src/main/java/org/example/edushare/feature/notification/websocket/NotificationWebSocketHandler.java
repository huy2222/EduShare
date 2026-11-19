package org.example.edushare.feature.notification.websocket;

import tools.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.example.edushare.feature.notification.dto.NotificationResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component
@RequiredArgsConstructor
public class NotificationWebSocketHandler extends TextWebSocketHandler {
    private final ObjectMapper objectMapper;
    private final ConcurrentHashMap<String, Set<WebSocketSession>> sessions = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        if (session.getPrincipal() == null) {
            session.close(CloseStatus.NOT_ACCEPTABLE.withReason("Authentication required"));
            return;
        }
        sessions.computeIfAbsent(session.getPrincipal().getName(), ignored -> ConcurrentHashMap.newKeySet())
                .add(session);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        remove(session);
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) {
        remove(session);
    }

    public void send(String recipientEmail, NotificationResponse notification) {
        Set<WebSocketSession> recipientSessions = sessions.get(recipientEmail);
        if (recipientSessions == null || recipientSessions.isEmpty()) {
            return;
        }

        try {
            TextMessage message = new TextMessage(objectMapper.writeValueAsString(notification));
            recipientSessions.forEach(session -> send(session, message));
        } catch (RuntimeException ignored) {
            // The notification remains stored and will be loaded through the REST API.
        }
    }

    private void send(WebSocketSession session, TextMessage message) {
        if (!session.isOpen()) {
            remove(session);
            return;
        }
        try {
            synchronized (session) {
                session.sendMessage(message);
            }
        } catch (IOException exception) {
            remove(session);
        }
    }

    private void remove(WebSocketSession session) {
        if (session.getPrincipal() == null) return;
        Set<WebSocketSession> recipientSessions = sessions.get(session.getPrincipal().getName());
        if (recipientSessions == null) return;
        recipientSessions.remove(session);
        if (recipientSessions.isEmpty()) {
            sessions.remove(session.getPrincipal().getName(), recipientSessions);
        }
    }
}
