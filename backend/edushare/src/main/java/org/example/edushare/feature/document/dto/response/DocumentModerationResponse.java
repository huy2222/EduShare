package org.example.edushare.feature.document.dto.response;

import lombok.Builder;
import lombok.Value;
import org.example.edushare.feature.document.entity.Document;

import java.time.LocalDateTime;
import java.util.UUID;

@Value
@Builder
public class DocumentModerationResponse {
    UUID id;
    String title;
    String description;
    String objectKey;
    String fileName;
    Long fileSize;
    String fileType;
    String documentType;
    String status;
    String scanStatus;
    String previewStatus;
    String previewError;
    LocalDateTime createdAt;
    String uploaderId;
    String uploaderName;
    String uploaderEmail;
    String subjectCode;
    String subjectName;
    String facultyName;
    String majorName;
    String semester;
    String academicYear;

    public static DocumentModerationResponse from(Document document) {
        var uploader = document.getUploader();
        var subject = document.getSubject();
        return DocumentModerationResponse.builder()
                .id(document.getId())
                .title(document.getTitle())
                .description(document.getDescription())
                .objectKey(document.getFileUrl())
                .fileName(document.getFileName())
                .fileSize(document.getFileSize())
                .fileType(document.getFileType() == null ? null : document.getFileType().name())
                .documentType(document.getDocumentType() == null ? null : document.getDocumentType().name())
                .status(document.getStatus() == null ? null : document.getStatus().name())
                .scanStatus(document.getScanStatus() == null ? null : document.getScanStatus().name())
                .previewStatus(document.getPreviewStatus() == null ? null : document.getPreviewStatus().name())
                .previewError(document.getPreviewError())
                .createdAt(document.getCreatedAt())
                .uploaderId(uploader == null ? null : uploader.getId())
                .uploaderName(uploader == null || uploader.getProfile() == null
                        ? null : uploader.getProfile().getFullName())
                .uploaderEmail(uploader == null ? null : uploader.getEmail())
                .subjectCode(subject == null ? null : subject.getCode())
                .subjectName(subject == null ? null : subject.getName())
                .facultyName(subject == null || subject.getFaculty() == null
                        ? null : subject.getFaculty().getName())
                .majorName(uploader == null || uploader.getProfile() == null
                        || uploader.getProfile().getMajor() == null
                        ? null : uploader.getProfile().getMajor().getName())
                .semester(document.getSemester() == null ? null : document.getSemester().name())
                .academicYear(document.getAcademicYear())
                .build();
    }
}
