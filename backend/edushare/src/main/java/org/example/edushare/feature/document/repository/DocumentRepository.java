package org.example.edushare.feature.document.repository;

import org.example.edushare.feature.document.entity.Document;
import org.example.edushare.feature.document.entity.DocumentStatus;
import org.example.edushare.feature.document.entity.PreviewStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;
import java.util.Optional;

public interface DocumentRepository extends JpaRepository<Document, UUID> {
    boolean existsBySubjectId(String subjectId);

    long countByStatus(DocumentStatus status);

    Page<Document> findAllByStatus(DocumentStatus status, Pageable pageable);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {
            "uploader", "uploader.profile", "uploader.profile.major", "subject", "subject.faculty"
    })
    Page<Document> findAllByStatusAndScanStatus(
            DocumentStatus status, org.example.edushare.feature.document.entity.ScanStatus scanStatus,
            Pageable pageable);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {
            "uploader", "uploader.profile", "uploader.profile.major", "subject", "subject.faculty"
    })
    Optional<Document> findDetailedById(UUID id);

    List<Document> findAllByUploaderIdOrderByCreatedAtDesc(String uploaderId);

    List<Document> findTop10ByPreviewStatusAndScanStatusOrderByCreatedAtAsc(
            PreviewStatus previewStatus,
            org.example.edushare.feature.document.entity.ScanStatus scanStatus);

    List<Document> findTop10ByScanStatusOrderByCreatedAtAsc(
            org.example.edushare.feature.document.entity.ScanStatus scanStatus);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update Document d set d.viewCount = d.viewCount + 1 where d.id = :documentId")
    int incrementViewCount(@Param("documentId") UUID documentId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update Document d set d.downloadCount = d.downloadCount + 1 where d.id = :documentId")
    int incrementDownloadCount(@Param("documentId") UUID documentId);
}
