package org.example.edushare.feature.document.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.example.edushare.feature.document.entity.Document;
import org.example.edushare.feature.document.entity.DocumentStatus;
import org.example.edushare.feature.document.entity.ScanStatus;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentUploadResponse {
    private UUID id;
    private String title;
    private String fileName;
    private String objectKey;
    private DocumentStatus status;
    private ScanStatus scanStatus;
    private LocalDateTime createdAt;

    public static DocumentUploadResponse from(Document document) {
        return DocumentUploadResponse.builder()
                .id(document.getId())
                .title(document.getTitle())
                .fileName(document.getFileName())
                .objectKey(document.getFileUrl())
                .status(document.getStatus())
                .scanStatus(document.getScanStatus())
                .createdAt(document.getCreatedAt())
                .build();
    }
}
