package org.example.edushare.feature.document.worker;

import lombok.RequiredArgsConstructor;
import org.example.edushare.feature.document.entity.FileType;
import org.example.edushare.feature.document.entity.PreviewStatus;
import org.example.edushare.feature.document.entity.ScanStatus;
import org.example.edushare.feature.document.repository.DocumentRepository;
import org.example.edushare.feature.document.service.DocumentPreviewService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.EnumSet;
import java.util.Set;

/** Keeps web requests fast by converting clean Office files in the background. */
@Component
@RequiredArgsConstructor
public class DocumentPreviewWorker {

    private static final Set<FileType> OFFICE_FILE_TYPES = EnumSet.of(
            FileType.DOC, FileType.DOCX, FileType.PPT, FileType.PPTX, FileType.XLS, FileType.XLSX);

    private final DocumentRepository documentRepository;
    private final DocumentPreviewService previewService;

    @Scheduled(fixedDelayString = "${document.preview.poll-delay-milliseconds:5000}")
    public void createPendingPreviews() {
        var legacyDocuments = documentRepository
                .findTop10ByPreviewStatusAndScanStatusAndFileTypeInOrderByCreatedAtAsc(
                        PreviewStatus.NOT_REQUIRED, ScanStatus.CLEAN, OFFICE_FILE_TYPES);
        if (!legacyDocuments.isEmpty()) {
            legacyDocuments.forEach(document -> document.setPreviewStatus(PreviewStatus.PENDING));
            documentRepository.saveAll(legacyDocuments);
        }

        documentRepository.findTop10ByPreviewStatusAndScanStatusOrderByCreatedAtAsc(
                        PreviewStatus.PENDING, ScanStatus.CLEAN)
                .forEach(document -> previewService.generatePreview(document.getId()));
    }
}
