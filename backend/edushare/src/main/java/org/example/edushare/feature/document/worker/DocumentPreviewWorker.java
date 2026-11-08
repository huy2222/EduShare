package org.example.edushare.feature.document.worker;

import lombok.RequiredArgsConstructor;
import org.example.edushare.feature.document.entity.PreviewStatus;
import org.example.edushare.feature.document.entity.ScanStatus;
import org.example.edushare.feature.document.repository.DocumentRepository;
import org.example.edushare.feature.document.service.DocumentPreviewService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/** Keeps web requests fast by converting clean Word files in the background. */
@Component
@RequiredArgsConstructor
public class DocumentPreviewWorker {

    private final DocumentRepository documentRepository;
    private final DocumentPreviewService previewService;

    @Scheduled(fixedDelayString = "${document.preview.poll-delay-milliseconds:5000}")
    public void createPendingPreviews() {
        documentRepository.findTop10ByPreviewStatusAndScanStatusOrderByCreatedAtAsc(
                        PreviewStatus.PENDING, ScanStatus.CLEAN)
                .forEach(document -> previewService.generatePreview(document.getId()));
    }
}
