package org.example.edushare.feature.document.repository;

import org.example.edushare.feature.document.entity.Document;
import org.example.edushare.feature.document.entity.DocumentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface DocumentRepository extends JpaRepository<Document, UUID> {

    Page<Document> findAllByStatus(DocumentStatus status, Pageable pageable);

    List<Document> findAllByUploaderIdOrderByCreatedAtDesc(String uploaderId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update Document d set d.viewCount = d.viewCount + 1 where d.id = :documentId")
    int incrementViewCount(@Param("documentId") UUID documentId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update Document d set d.downloadCount = d.downloadCount + 1 where d.id = :documentId")
    int incrementDownloadCount(@Param("documentId") UUID documentId);
}
