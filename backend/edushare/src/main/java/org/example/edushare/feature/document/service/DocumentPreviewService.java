package org.example.edushare.feature.document.service;

import lombok.RequiredArgsConstructor;
import org.example.edushare.feature.document.entity.Document;
import org.example.edushare.feature.document.entity.FileType;
import org.example.edushare.feature.document.entity.PreviewStatus;
import org.example.edushare.feature.document.entity.ScanStatus;
import org.example.edushare.feature.document.repository.DocumentRepository;
import org.example.edushare.infrastructure.storage.R2StorageService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.io.ByteArrayOutputStream;
import java.util.UUID;

/** Creates private PDF review copies through the local Gotenberg/LibreOffice container. */
@Service
@RequiredArgsConstructor
public class DocumentPreviewService {

    private final DocumentRepository documentRepository;
    private final R2StorageService storageService;

    @Value("${document.preview.gotenberg-url:http://localhost:3000}")
    private String gotenbergUrl;

    @Value("${document.preview.conversion-timeout-seconds:60}")
    private long conversionTimeoutSeconds;

    public void generatePreview(UUID documentId) {
        Document document = documentRepository.findById(documentId).orElse(null);
        if (document == null || document.getPreviewStatus() != PreviewStatus.PENDING
                || document.getScanStatus() != ScanStatus.CLEAN || !isWordDocument(document)) {
            return;
        }

        document.setPreviewStatus(PreviewStatus.CONVERTING);
        document.setPreviewError(null);
        documentRepository.saveAndFlush(document);

        String previewKey = null;
        try {
            byte[] preview = convertToPdf(document);
            previewKey = storageService.uploadPreview(preview, document.getFileName());
            document.setPreviewFileUrl(previewKey);
            document.setPreviewStatus(PreviewStatus.AVAILABLE);
            document.setPreviewError(null);
            documentRepository.save(document);
        } catch (Exception exception) {
            if (previewKey != null) {
                try {
                    storageService.delete(previewKey);
                } catch (RuntimeException ignored) {
                    // Keep the conversion failure as the primary outcome.
                }
            }
            document.setPreviewStatus(PreviewStatus.FAILED);
            document.setPreviewError("Không thể tạo bản xem trước PDF. Vui lòng tải tệp gốc để kiểm tra.");
            documentRepository.save(document);
        }
    }

    public String resolvePreviewObjectKey(Document document) {
        if (document.getFileType() == FileType.PDF) {
            return document.getFileUrl();
        }
        if (document.getPreviewStatus() == PreviewStatus.AVAILABLE && document.getPreviewFileUrl() != null) {
            return document.getPreviewFileUrl();
        }
        return null;
    }

    private byte[] convertToPdf(Document document) throws IOException, InterruptedException {
        String boundary = "EduShare-" + UUID.randomUUID();
        byte[] source = storageService.getObjectBytes(document.getFileUrl()).asByteArray();
        byte[] requestBody = createMultipartRequest(boundary, document.getFileName(), source);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(gotenbergUrl.replaceAll("/+$", "") + "/forms/libreoffice/convert"))
                .timeout(Duration.ofSeconds(conversionTimeoutSeconds))
                .header("Content-Type", "multipart/form-data; boundary=" + boundary)
                .header("Gotenberg-Output-Filename", "edushare-preview")
                .POST(HttpRequest.BodyPublishers.ofByteArray(requestBody))
                .build();
        HttpResponse<byte[]> response = HttpClient.newHttpClient()
                .send(request, HttpResponse.BodyHandlers.ofByteArray());
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new IOException("Gotenberg conversion failed with HTTP " + response.statusCode());
        }
        if (response.body().length == 0) {
            throw new IOException("Gotenberg returned an empty PDF");
        }
        return response.body();
    }

    private boolean isWordDocument(Document document) {
        return document.getFileType() == FileType.DOC || document.getFileType() == FileType.DOCX;
    }

    private byte[] createMultipartRequest(String boundary, String fileName, byte[] source) throws IOException {
        String safeFileName = fileName.replace("\\", "_").replace("\"", "_");
        try (ByteArrayOutputStream body = new ByteArrayOutputStream()) {
            body.write(("--" + boundary + "\r\n").getBytes(StandardCharsets.UTF_8));
            body.write(("Content-Disposition: form-data; name=\"files\"; filename=\"" + safeFileName + "\"\r\n")
                    .getBytes(StandardCharsets.UTF_8));
            body.write(("Content-Type: application/octet-stream\r\n\r\n").getBytes(StandardCharsets.UTF_8));
            body.write(source);
            body.write(("\r\n--" + boundary + "--\r\n").getBytes(StandardCharsets.UTF_8));
            return body.toByteArray();
        }
    }
}
