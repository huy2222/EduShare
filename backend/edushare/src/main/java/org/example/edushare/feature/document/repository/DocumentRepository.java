package org.example.edushare.feature.document.repository;

import jakarta.persistence.LockModeType;
import org.example.edushare.feature.document.entity.Document;
import org.example.edushare.feature.document.entity.DocumentStatus;
import org.example.edushare.feature.document.entity.FileType;
import org.example.edushare.feature.document.entity.DocumentType;
import org.example.edushare.feature.document.entity.PreviewStatus;
import org.example.edushare.feature.document.entity.ScanStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Collection;
import java.util.UUID;
import java.util.Optional;
import java.time.LocalDateTime;

public interface DocumentRepository extends JpaRepository<Document, UUID> {
    boolean existsBySubjectId(String subjectId);

    boolean existsByIdAndStatusAndScanStatus(UUID id, DocumentStatus status, ScanStatus scanStatus);

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
    @Query("""
            select d from Document d
            join d.uploader u
            left join u.profile p
            join d.subject s
            where (:status is null or d.status = :status)
              and (:fileType is null or d.fileType = :fileType)
              and (:subjectId is null or s.id = :subjectId)
              and (:createdFrom is null or d.createdAt >= :createdFrom)
              and (:search is null
                   or lower(d.title) like lower(concat('%', :search, '%'))
                   or lower(u.email) like lower(concat('%', :search, '%'))
                   or lower(coalesce(p.fullName, '')) like lower(concat('%', :search, '%'))
                   or lower(s.name) like lower(concat('%', :search, '%')))
            """)
    Page<Document> searchForAdministration(
            @Param("search") String search,
            @Param("status") DocumentStatus status,
            @Param("fileType") FileType fileType,
            @Param("subjectId") String subjectId,
            @Param("createdFrom") LocalDateTime createdFrom,
            Pageable pageable);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {
            "uploader", "uploader.profile", "uploader.profile.major", "subject", "subject.faculty"
    })
    Optional<Document> findDetailedById(UUID id);

    @EntityGraph(attributePaths = {"uploader", "uploader.profile", "subject", "subject.faculty"})
    @Query("""
            select d from Document d join d.subject s
            where d.status = :status and d.scanStatus = :scanStatus
              and (:search = '' or lower(d.title) like concat('%', :search, '%')
                   or lower(s.name) like concat('%', :search, '%')
                   or lower(s.code) like concat('%', :search, '%'))
            """)
    Page<Document> searchPublished(@Param("status") DocumentStatus status,
                                   @Param("scanStatus") ScanStatus scanStatus,
                                   @Param("search") String search, Pageable pageable);

    @EntityGraph(attributePaths = {"uploader", "uploader.profile", "subject", "subject.faculty"})
    @Query("""
            select d from Document d join d.subject s left join s.faculty f
            where d.status = :status and d.scanStatus = :scanStatus
              and (:search = '' or lower(d.title) like concat('%', :search, '%')
                   or lower(coalesce(d.description, '')) like concat('%', :search, '%')
                   or lower(s.name) like concat('%', :search, '%') or lower(s.code) like concat('%', :search, '%'))
              and (:subjectId is null or s.id = :subjectId)
              and (:facultyId is null or f.id = :facultyId)
              and (:majorId is null or exists (select m.id from Major m join m.subjects ms where ms.id = s.id and m.id = :majorId))
              and (:documentType is null or d.documentType = :documentType)
              and (:fileType is null or d.fileType = :fileType)
            """)
    Page<Document> browsePublished(@Param("search") String search, @Param("subjectId") String subjectId,
                                   @Param("facultyId") String facultyId, @Param("majorId") String majorId,
                                   @Param("documentType") DocumentType documentType, @Param("fileType") FileType fileType,
                                   @Param("status") DocumentStatus status, @Param("scanStatus") ScanStatus scanStatus,
                                   Pageable pageable);

    interface SubjectCount {
        String getSubjectId();
        long getTotal();
    }

    @Query("""
            select d.subject.id as subjectId, count(d) as total from Document d
            where d.subject.id in :ids and d.status = :status and d.scanStatus = :scanStatus group by d.subject.id
            """)
    List<SubjectCount> countPublishedForSubjects(@Param("ids") Collection<String> ids,
                                                @Param("status") DocumentStatus status, @Param("scanStatus") ScanStatus scanStatus);

    interface TypeCount {
        DocumentType getDocumentType();
        long getTotal();
    }

    @Query("""
            select d.documentType as documentType, count(d) as total from Document d
            where d.subject.id = :subjectId and d.status = :status and d.scanStatus = :scanStatus group by d.documentType
            """)
    List<TypeCount> countPublishedTypes(@Param("subjectId") String subjectId,
                                       @Param("status") DocumentStatus status, @Param("scanStatus") ScanStatus scanStatus);

    long countByUploaderIdAndStatusAndScanStatus(String uploaderId, DocumentStatus status, ScanStatus scanStatus);

    @EntityGraph(attributePaths = {"uploader", "uploader.profile", "subject", "subject.faculty"})
    List<Document> findTop3BySubjectIdAndIdNotAndStatusAndScanStatusOrderByCreatedAtDescIdDesc(
            String subjectId, UUID id, DocumentStatus status, ScanStatus scanStatus);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select d from Document d where d.id = :id")
    Optional<Document> findForInteraction(@Param("id") UUID id);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            update Document d set d.viewCount = d.viewCount + 1
            where d.id = :id and d.status = :status and d.scanStatus = :scanStatus
            """)
    int incrementPublishedViewCount(@Param("id") UUID id, @Param("status") DocumentStatus status,
                                    @Param("scanStatus") ScanStatus scanStatus);

    @Modifying
    @Query("""
            update Document d set d.downloadCount = d.downloadCount + 1
            where d.id = :id and d.status = :status and d.scanStatus = :scanStatus
            """)
    int incrementPublishedDownloadCount(@Param("id") UUID id, @Param("status") DocumentStatus status,
                                        @Param("scanStatus") ScanStatus scanStatus);

    @Modifying
    @Query("update Document d set d.averageRating = :average where d.id = :id")
    void updateAverageRating(@Param("id") UUID id, @Param("average") double average);

    List<Document> findAllByUploaderIdOrderByCreatedAtDesc(String uploaderId);

    List<Document> findTop10ByPreviewStatusAndScanStatusOrderByCreatedAtAsc(
            PreviewStatus previewStatus,
            org.example.edushare.feature.document.entity.ScanStatus scanStatus);

    List<Document> findTop10ByPreviewStatusAndScanStatusAndFileTypeInOrderByCreatedAtAsc(
            PreviewStatus previewStatus,
            ScanStatus scanStatus,
            Collection<FileType> fileTypes);

    List<Document> findTop10ByScanStatusOrderByCreatedAtAsc(
            org.example.edushare.feature.document.entity.ScanStatus scanStatus);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update Document d set d.viewCount = d.viewCount + 1 where d.id = :documentId")
    int incrementViewCount(@Param("documentId") UUID documentId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update Document d set d.downloadCount = d.downloadCount + 1 where d.id = :documentId")
    int incrementDownloadCount(@Param("documentId") UUID documentId);
}
