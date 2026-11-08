package org.example.edushare.feature.document.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.edushare.common.response.ApiResponse;
import org.example.edushare.feature.document.dto.request.DocumentModerationRequest;
import org.example.edushare.feature.document.dto.response.DocumentModerationPageResponse;
import org.example.edushare.feature.document.dto.response.DocumentModerationResponse;
import org.example.edushare.feature.document.dto.response.DocumentModerationStatsResponse;
import org.example.edushare.feature.document.service.DocumentModerationService;
import org.example.edushare.feature.document.service.DocumentPreviewService;
import org.example.edushare.infrastructure.storage.R2StorageService;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/documents")
@RequiredArgsConstructor
public class AdminDocumentController {

    private final DocumentModerationService moderationService;
    private final R2StorageService storageService;
    private final DocumentPreviewService previewService;

    @GetMapping
    public ApiResponse<DocumentModerationPageResponse> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        int safeSize = Math.min(Math.max(size, 1), 50);
        return ApiResponse.<DocumentModerationPageResponse>builder()
                .result(moderationService.listPending(PageRequest.of(page, safeSize,
                        Sort.by(Sort.Direction.DESC, "createdAt"))))
                .build();
    }

    @GetMapping("/stats")
    public ApiResponse<DocumentModerationStatsResponse> stats() {
        return ApiResponse.<DocumentModerationStatsResponse>builder()
                .result(moderationService.stats())
                .build();
    }

    @GetMapping("/{id:[0-9a-fA-F-]+}")
    public ApiResponse<DocumentModerationResponse> detail(@PathVariable UUID id) {
        return ApiResponse.<DocumentModerationResponse>builder()
                .result(moderationService.detail(id))
                .build();
    }

    @GetMapping("/{id:[0-9a-fA-F-]+}/content")
    public ResponseEntity<byte[]> content(@PathVariable UUID id) {
        DocumentModerationResponse document = moderationService.detail(id);
        var object = storageService.getObjectBytes(document.getObjectKey());
        MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;
        try {
            mediaType = document.getFileName().toLowerCase().endsWith(".pdf")
                    ? MediaType.APPLICATION_PDF
                    : MediaType.parseMediaType(object.response().contentType());
        } catch (Exception ignored) {
            // Keep the safe binary fallback when the stored content type is absent/invalid.
        }
        return ResponseEntity.ok()
                .contentType(mediaType)
                .contentLength(object.asByteArray().length)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "inline; filename=\"" + document.getFileName().replace("\"", "") + "\"")
                .body(object.asByteArray());
    }

    @GetMapping("/{id:[0-9a-fA-F-]+}/preview")
    public ResponseEntity<byte[]> preview(@PathVariable UUID id) {
        DocumentModerationResponse document = moderationService.detail(id);
        String previewKey = previewService.resolvePreviewObjectKey(
                moderationService.document(id));
        if (previewKey == null) {
            return ResponseEntity.noContent().build();
        }
        var object = storageService.getObjectBytes(previewKey);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .contentLength(object.asByteArray().length)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "inline; filename=\"preview-" + document.getFileName().replace("\"", "") + ".pdf\"")
                .body(object.asByteArray());
    }

    @PostMapping("/{id:[0-9a-fA-F-]+}/moderate")
    public ApiResponse<Void> moderate(
            @PathVariable UUID id,
            @Valid @RequestBody DocumentModerationRequest request) {
        moderationService.moderate(id, request);
        return ApiResponse.<Void>builder().message("Document moderation updated").build();
    }
}
