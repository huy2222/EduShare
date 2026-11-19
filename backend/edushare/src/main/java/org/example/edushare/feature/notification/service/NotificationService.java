package org.example.edushare.feature.notification.service;

import lombok.RequiredArgsConstructor;
import org.example.edushare.common.exception.AppException;
import org.example.edushare.common.exception.ErrorCode;
import org.example.edushare.feature.document.entity.Document;
import org.example.edushare.feature.notification.dto.NotificationResponse;
import org.example.edushare.feature.notification.entity.Notification;
import org.example.edushare.feature.notification.entity.NotificationType;
import org.example.edushare.feature.notification.repository.NotificationRepository;
import org.example.edushare.feature.notification.websocket.NotificationWebSocketHandler;
import org.example.edushare.feature.user.entity.User;
import org.example.edushare.feature.user.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NotificationService {
    private static final int MAX_NOTIFICATIONS = 100;

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final NotificationWebSocketHandler webSocketHandler;

    @Transactional(readOnly = true)
    public List<NotificationResponse> getMine() {
        User user = currentUser();
        return notificationRepository
                .findAllByRecipientIdOrderByCreatedAtDesc(user.getId(), PageRequest.of(0, MAX_NOTIFICATIONS))
                .stream().map(NotificationResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public long unreadCount() {
        return notificationRepository.countByRecipientIdAndReadFalse(currentUser().getId());
    }

    @Transactional
    public NotificationResponse markRead(UUID id) {
        User user = currentUser();
        Notification notification = notificationRepository.findByIdAndRecipientId(id, user.getId())
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_REQUEST));
        notification.setRead(true);
        return NotificationResponse.from(notification);
    }

    @Transactional
    public void markAllRead() {
        notificationRepository.markAllRead(currentUser().getId());
    }

    @Transactional
    public void notifyPendingReview(Document document) {
        userRepository.findDistinctByRoles_Name("ADMIN").forEach(admin -> create(
                admin,
                NotificationType.DOCUMENT_PENDING_REVIEW,
                "Có tài liệu mới cần duyệt",
                "Tài liệu \u201c" + document.getTitle() + "\u201d đã quét an toàn và đang chờ phê duyệt.",
                document.getId()));
    }

    @Transactional
    public void notifyScanCompleted(Document document) {
        create(document.getUploader(), NotificationType.DOCUMENT_SCAN_COMPLETED,
                "Tài liệu đã được quét virus",
                "Tài liệu \u201c" + document.getTitle() + "\u201d đã quét xong và đang chờ quản trị viên phê duyệt.",
                document.getId());
    }

    @Transactional
    public void notifyVirusRejected(Document document) {
        create(document.getUploader(), NotificationType.DOCUMENT_REJECTED_VIRUS,
                "Tài liệu bị từ chối do nghi vấn virus",
                "Tài liệu \u201c" + document.getTitle() + "\u201d không vượt qua bước kiểm tra an toàn và đã bị từ chối.",
                document.getId());
    }

    @Transactional
    public void notifyModerationResult(Document document, boolean approved, String reason) {
        String message = approved
                ? "Tài liệu \u201c" + document.getTitle() + "\u201d đã được phê duyệt và công khai trên hệ thống."
                : "Tài liệu \u201c" + document.getTitle() + "\u201d đã bị từ chối."
                    + (reason == null ? "" : " Lý do: " + reason);
        create(document.getUploader(),
                approved ? NotificationType.DOCUMENT_APPROVED : NotificationType.DOCUMENT_REJECTED,
                approved ? "Tài liệu đã được phê duyệt" : "Tài liệu đã bị từ chối",
                message,
                document.getId());
    }

    private void create(User recipient, NotificationType type, String title, String message, UUID documentId) {
        Notification saved = notificationRepository.save(Notification.builder()
                .recipient(recipient)
                .type(type)
                .title(title)
                .message(message)
                .documentId(documentId)
                .build());
        NotificationResponse response = NotificationResponse.from(saved);
        Runnable publish = () -> webSocketHandler.send(recipient.getEmail(), response);

        if (TransactionSynchronizationManager.isActualTransactionActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    publish.run();
                }
            });
        } else {
            publish.run();
        }
    }

    private User currentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
    }
}
