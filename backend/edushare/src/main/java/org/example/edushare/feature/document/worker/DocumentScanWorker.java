package org.example.edushare.feature.document.worker;

import lombok.RequiredArgsConstructor;
import org.example.edushare.feature.document.entity.ScanStatus;
import org.example.edushare.feature.document.repository.DocumentRepository;
import org.example.edushare.feature.document.service.DocumentVirusScanService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/** Scans uploads outside the HTTP request so users are not kept waiting. */
@Component
@RequiredArgsConstructor
public class DocumentScanWorker {

    private final DocumentRepository documentRepository;
    private final DocumentVirusScanService virusScanService;

    @Scheduled(fixedDelayString = "${document.scan.poll-delay-milliseconds:1000}")
    public void scanPendingDocuments() {
        documentRepository.findTop10ByScanStatusOrderByCreatedAtAsc(ScanStatus.PENDING)
                .forEach(document -> virusScanService.scanDocument(document.getId()));
    }
}
