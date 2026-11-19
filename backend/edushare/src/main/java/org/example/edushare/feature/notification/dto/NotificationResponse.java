package org.example.edushare.feature.notification.dto;

import org.example.edushare.feature.notification.entity.Notification;
import org.example.edushare.feature.notification.entity.NotificationType;

import java.time.LocalDateTime;
import java.util.UUID;

public record NotificationResponse(
        UUID id,
        NotificationType type,
        String title,
        String message,
        UUID documentId,
        boolean read,
        LocalDateTime createdAt) {

    public static NotificationResponse from(Notification notification) {
        return new NotificationResponse(
                notification.getId(),
                notification.getType(),
                notification.getTitle(),
                notification.getMessage(),
                notification.getDocumentId(),
                notification.isRead(),
                notification.getCreatedAt());
    }
}
