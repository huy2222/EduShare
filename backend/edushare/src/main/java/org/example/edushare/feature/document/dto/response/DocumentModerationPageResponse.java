package org.example.edushare.feature.document.dto.response;

import lombok.Builder;
import lombok.Value;
import org.springframework.data.domain.Page;

import java.util.List;

@Value
@Builder
public class DocumentModerationPageResponse {
    List<DocumentModerationResponse> items;
    int page;
    int size;
    long totalElements;

    public static DocumentModerationPageResponse from(Page<org.example.edushare.feature.document.entity.Document> page) {
        return DocumentModerationPageResponse.builder()
                .items(page.getContent().stream().map(DocumentModerationResponse::from).toList())
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .build();
    }
}
