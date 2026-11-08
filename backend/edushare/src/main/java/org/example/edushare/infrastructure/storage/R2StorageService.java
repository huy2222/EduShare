package org.example.edushare.infrastructure.storage;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.CopyObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.core.ResponseBytes;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;

import java.io.IOException;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class R2StorageService {

    private final S3Client s3Client;

    @Value("${cloudflare.r2.bucket-name}")
    private String bucketName;

    public String upload(MultipartFile file) throws IOException {
        return uploadToPrefix(file, "documents/");
    }

    public String uploadToQuarantine(MultipartFile file) throws IOException {
        return uploadToPrefix(file, "quarantine/");
    }

    public String uploadPreview(byte[] content, String sourceFileName) {
        String safeBaseName = sourceFileName == null ? "document" : sourceFileName
                .replaceAll("[^a-zA-Z0-9._-]", "_");
        String objectKey = "previews/" + UUID.randomUUID() + "-" + safeBaseName + ".pdf";
        s3Client.putObject(PutObjectRequest.builder()
                        .bucket(bucketName)
                        .key(objectKey)
                        .contentType("application/pdf")
                        .build(),
                RequestBody.fromBytes(content));
        return objectKey;
    }

    public String promoteFromQuarantine(String quarantineKey) {
        if (quarantineKey == null || !quarantineKey.startsWith("quarantine/")) {
            throw new IllegalArgumentException("Only quarantine objects can be promoted");
        }

        String objectKey = "documents/" + quarantineKey.substring("quarantine/".length());
        s3Client.copyObject(CopyObjectRequest.builder()
                .copySource(bucketName + "/" + quarantineKey)
                .destinationBucket(bucketName)
                .destinationKey(objectKey)
                .build());
        s3Client.deleteObject(DeleteObjectRequest.builder()
                .bucket(bucketName)
                .key(quarantineKey)
                .build());
        return objectKey;
    }

    private String uploadToPrefix(MultipartFile file, String prefix) throws IOException {
        String originalName = file.getOriginalFilename();
        String extension = "";

        if (originalName != null && originalName.contains(".")) {
            extension = originalName.substring(originalName.lastIndexOf('.')).toLowerCase();
        }

        String objectKey = prefix + UUID.randomUUID() + extension;

        PutObjectRequest request = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(objectKey)
                .contentType(file.getContentType())
                .build();

        s3Client.putObject(request, RequestBody.fromBytes(file.getBytes()));

        return objectKey;
    }

    public void delete(String objectKey) {
        DeleteObjectRequest request = DeleteObjectRequest.builder()
                .bucket(bucketName)
                .key(objectKey)
                .build();

        s3Client.deleteObject(request);
    }

    public ResponseBytes<GetObjectResponse> getObjectBytes(String objectKey) {
        if (objectKey == null || (!objectKey.startsWith("documents/") && !objectKey.startsWith("previews/"))) {
            throw new IllegalArgumentException("Only document and preview objects can be read");
        }
        return s3Client.getObjectAsBytes(GetObjectRequest.builder()
                .bucket(bucketName)
                .key(objectKey)
                .build());
    }

    public ResponseBytes<GetObjectResponse> getQuarantineObjectBytes(String objectKey) {
        if (objectKey == null || !objectKey.startsWith("quarantine/")) {
            throw new IllegalArgumentException("Only quarantined document objects can be read");
        }
        return s3Client.getObjectAsBytes(GetObjectRequest.builder()
                .bucket(bucketName)
                .key(objectKey)
                .build());
    }
}
