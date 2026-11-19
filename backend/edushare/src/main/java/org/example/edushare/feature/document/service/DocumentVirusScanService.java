package org.example.edushare.feature.document.service;

import lombok.RequiredArgsConstructor;
import org.example.edushare.feature.document.entity.Document;
import org.example.edushare.feature.document.entity.DocumentStatus;
import org.example.edushare.feature.document.entity.ScanStatus;
import org.example.edushare.feature.document.repository.DocumentRepository;
import org.example.edushare.feature.notification.service.NotificationService;
import org.example.edushare.infrastructure.storage.R2StorageService;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.util.UUID;

/** Scans quarantined uploads before they can enter the document store or moderation queue. */
@Service
@RequiredArgsConstructor
public class DocumentVirusScanService {

    private final DocumentRepository documentRepository;
    private final R2StorageService storageService;
    private final VirusScanService virusScanService;
    private final NotificationService notificationService;

    public void scanDocument(UUID documentId) {
        Document document = documentRepository.findDetailedById(documentId).orElse(null);
        if (document == null || document.getScanStatus() != ScanStatus.PENDING) {
            return;
        }

        document.setScanStatus(ScanStatus.SCANNING);
        documentRepository.saveAndFlush(document);

        try (InputStream input = new ByteArrayInputStream(
                storageService.getQuarantineObjectBytes(document.getFileUrl()).asByteArray())) {
            if (virusScanService.scan(input) == VirusScanService.ScanResult.INFECTED) {
                storageService.delete(document.getFileUrl());
                document.setScanStatus(ScanStatus.INFECTED);
                document.setStatus(DocumentStatus.REJECTED);
                documentRepository.save(document);
            } else {
                document.setFileUrl(storageService.promoteFromQuarantine(document.getFileUrl()));
                document.setScanStatus(ScanStatus.CLEAN);
                documentRepository.save(document);
            }
        } catch (IOException | RuntimeException exception) {
            document.setScanStatus(ScanStatus.FAILED);
            documentRepository.save(document);
            return;
        }

        if (document.getScanStatus() == ScanStatus.INFECTED) {
            notificationService.notifyVirusRejected(document);
        } else {
            notificationService.notifyScanCompleted(document);
            notificationService.notifyPendingReview(document);
        }
    }
}
