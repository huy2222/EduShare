package org.example.edushare.feature.document.service;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.edushare.common.exception.AppException;
import org.example.edushare.common.exception.ErrorCode;
import org.example.edushare.feature.document.dto.request.DocumentModerationRequest;
import org.example.edushare.feature.document.entity.Document;
import org.example.edushare.feature.document.entity.DocumentModeration;
import org.example.edushare.feature.document.entity.DocumentStatus;
import org.example.edushare.feature.document.entity.ModerationAction;
import org.example.edushare.feature.document.entity.ScanStatus;
import org.example.edushare.feature.document.dto.response.DocumentModerationPageResponse;
import org.example.edushare.feature.document.dto.response.DocumentModerationResponse;
import org.example.edushare.feature.document.repository.DocumentModerationRepository;
import org.example.edushare.feature.document.repository.DocumentRepository;
import org.example.edushare.feature.user.entity.User;
import org.example.edushare.feature.user.repository.UserRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.validation.annotation.Validated;

import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Service
@Validated
@RequiredArgsConstructor
public class DocumentModerationService {

    private final DocumentRepository documentRepository;
    private final DocumentModerationRepository moderationRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    @PreAuthorize("@adminAuthorization.has('DOCUMENT_APPROVE', 'DOCUMENT_REJECT', 'APPROVE_DOCUMENT', 'DOCUMENT_HIDE')")
    public DocumentModerationPageResponse listPending(Pageable pageable) {
        return DocumentModerationPageResponse.from(
                documentRepository.findAllByStatusAndScanStatus(DocumentStatus.PENDING, ScanStatus.CLEAN, pageable));
    }

    @Transactional(readOnly = true)
    @PreAuthorize("@adminAuthorization.has('DOCUMENT_APPROVE', 'DOCUMENT_REJECT', 'APPROVE_DOCUMENT', 'DOCUMENT_HIDE')")
    public DocumentModerationResponse detail(UUID documentId) {
        return DocumentModerationResponse.from(documentRepository.findDetailedById(documentId)
                .orElseThrow(() -> new AppException(ErrorCode.DOCUMENT_NOT_FOUND)));
    }

    @Transactional(readOnly = true)
    @PreAuthorize("@adminAuthorization.has('DOCUMENT_APPROVE', 'DOCUMENT_REJECT', 'APPROVE_DOCUMENT', 'DOCUMENT_HIDE')")
    public Document document(UUID documentId) {
        return documentRepository.findById(documentId)
                .orElseThrow(() -> new AppException(ErrorCode.DOCUMENT_NOT_FOUND));
    }

    @Transactional
    @PreAuthorize("@adminAuthorization.documentAction(#request.action)")
    public DocumentModeration moderate(UUID documentId, @Valid DocumentModerationRequest request) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new AppException(ErrorCode.DOCUMENT_NOT_FOUND));

        String reason = trimToNull(request.getReason());
        if (request.getAction() == ModerationAction.APPROVED
                && document.getScanStatus() != ScanStatus.CLEAN) {
            throw new AppException(ErrorCode.DOCUMENT_NOT_CLEAN);
        }
        if (request.getAction() != ModerationAction.APPROVED && reason == null) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        document.setStatus(toDocumentStatus(request.getAction()));

        DocumentModeration moderation = DocumentModeration.builder()
                .document(document)
                .moderator(getCurrentUser())
                .action(request.getAction())
                .reason(reason)
                .build();

        return moderationRepository.save(moderation);
    }

    @Transactional(readOnly = true)
    @PreAuthorize("@adminAuthorization.has('DOCUMENT_APPROVE', 'DOCUMENT_REJECT', 'APPROVE_DOCUMENT', 'DOCUMENT_HIDE')")
    public List<DocumentModeration> getHistory(UUID documentId) {
        if (!documentRepository.existsById(documentId)) {
            throw new AppException(ErrorCode.DOCUMENT_NOT_FOUND);
        }
        return moderationRepository.findAllByDocumentIdOrderByCreatedAtDesc(documentId);
    }

    private DocumentStatus toDocumentStatus(ModerationAction action) {
        return switch (action) {
            case APPROVED -> DocumentStatus.APPROVED;
            case REJECTED -> DocumentStatus.REJECTED;
            case HIDDEN -> DocumentStatus.DELETED;
        };
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
    }

    private String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}
