package org.example.edushare.feature.document.dto.response;

import lombok.Builder;
import lombok.Value;
import org.example.edushare.feature.document.entity.Document;

import java.util.UUID;

@Value
@Builder
public class DocumentScanStatusResponse {
    UUID id;
    String title;
    String scanStatus;
    String documentStatus;

    public static DocumentScanStatusResponse from(Document document) {
        return DocumentScanStatusResponse.builder()
                .id(document.getId())
                .title(document.getTitle())
                .scanStatus(document.getScanStatus().name())
                .documentStatus(document.getStatus().name())
                .build();
    }
}
