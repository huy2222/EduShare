package org.example.edushare.feature.document.dto.response;

import org.example.edushare.feature.document.entity.Document;
import org.example.edushare.feature.document.entity.DocumentType;
import org.example.edushare.feature.document.entity.FileType;
import org.example.edushare.feature.user.entity.User;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.UUID;

public record PublishedDocumentResponse(
        UUID id, String title, String description, String fileName, long fileSize, FileType fileType,
        DocumentType documentType, String author, String subjectCode, String subjectName, String facultyName,
        LocalDateTime createdAt, long views, long downloads, double averageRating
) {
    public static PublishedDocumentResponse from(Document document) {
        var subject = document.getSubject();
        return new PublishedDocumentResponse(
                document.getId(), document.getTitle(), document.getDescription(), document.getFileName(),
                document.getFileSize(), document.getFileType(), document.getDocumentType(),
                displayName(document.getUploader()), subject.getCode(), subject.getName(),
                subject.getFaculty() == null ? null : subject.getFaculty().getName(),
                document.getCreatedAt(), document.getViewCount(), document.getDownloadCount(),
                document.getAverageRating());
    }

    public static String displayName(User user) {
        var profile = user.getProfile();
        return profile != null && StringUtils.hasText(profile.getFullName())
                ? profile.getFullName() : "Thành viên EduShare";
    }
}
