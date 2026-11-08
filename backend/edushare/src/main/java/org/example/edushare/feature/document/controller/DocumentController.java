package org.example.edushare.feature.document.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.edushare.common.response.ApiResponse;
import org.example.edushare.feature.document.dto.request.DocumentCreateRequest;
import org.example.edushare.feature.document.dto.response.DocumentUploadResponse;
import org.example.edushare.feature.document.dto.response.DocumentScanStatusResponse;
import org.example.edushare.feature.document.entity.Document;
import org.example.edushare.feature.document.service.DocumentService;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<DocumentUploadResponse> upload(
            @Valid @RequestPart("metadata") DocumentCreateRequest request,
            @RequestPart("file") MultipartFile file
    ) throws IOException {
        Document document = documentService.create(request, file);

        return ApiResponse.<DocumentUploadResponse>builder()
                .message("Document uploaded successfully and is pending virus scan")
                .result(DocumentUploadResponse.from(document))
                .build();
    }

    @GetMapping("/{id}/scan-status")
    public ApiResponse<DocumentScanStatusResponse> scanStatus(@PathVariable UUID id) {
        return ApiResponse.<DocumentScanStatusResponse>builder()
                .result(DocumentScanStatusResponse.from(documentService.getCurrentUserDocument(id)))
                .build();
    }
}
