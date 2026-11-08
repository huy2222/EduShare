package org.example.edushare.feature.document.repository;

import org.example.edushare.feature.document.entity.DocumentModeration;
import org.example.edushare.feature.document.entity.ModerationAction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface DocumentModerationRepository extends JpaRepository<DocumentModeration, UUID> {

    List<DocumentModeration> findAllByDocumentIdOrderByCreatedAtDesc(UUID documentId);

    long countByActionAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(
            ModerationAction action,
            LocalDateTime start,
            LocalDateTime end);
}
