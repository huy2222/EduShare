package org.example.edushare.feature.document.worker;

import org.example.edushare.feature.document.entity.Document;
import org.example.edushare.feature.document.entity.FileType;
import org.example.edushare.feature.document.entity.PreviewStatus;
import org.example.edushare.feature.document.entity.ScanStatus;
import org.example.edushare.feature.document.repository.DocumentRepository;
import org.example.edushare.feature.document.service.DocumentPreviewService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DocumentPreviewWorkerTest {

    @Mock
    private DocumentRepository documentRepository;
    @Mock
    private DocumentPreviewService previewService;

    @Test
    void queuesCleanLegacyOfficeDocumentsBeforeGeneratingPreviews() {
        UUID documentId = UUID.randomUUID();
        Document document = Document.builder()
                .id(documentId)
                .fileType(FileType.PPTX)
                .scanStatus(ScanStatus.CLEAN)
                .previewStatus(PreviewStatus.NOT_REQUIRED)
                .build();
        when(documentRepository.findTop10ByPreviewStatusAndScanStatusAndFileTypeInOrderByCreatedAtAsc(
                eq(PreviewStatus.NOT_REQUIRED), eq(ScanStatus.CLEAN), any()))
                .thenReturn(List.of(document));
        when(documentRepository.findTop10ByPreviewStatusAndScanStatusOrderByCreatedAtAsc(
                PreviewStatus.PENDING, ScanStatus.CLEAN)).thenReturn(List.of(document));

        new DocumentPreviewWorker(documentRepository, previewService).createPendingPreviews();

        assertEquals(PreviewStatus.PENDING, document.getPreviewStatus());
        verify(documentRepository).saveAll(List.of(document));
        verify(previewService).generatePreview(documentId);
    }
}
