package org.example.edushare.feature.document.repository;

import org.example.edushare.feature.document.entity.DocumentComment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DocumentCommentRepository extends JpaRepository<DocumentComment, UUID> {
    @EntityGraph(attributePaths = {"author", "author.profile"})
    Page<DocumentComment> findByDocumentIdAndParentIsNull(UUID documentId, Pageable pageable);

    @EntityGraph(attributePaths = {"author", "author.profile"})
    Page<DocumentComment> findByDocumentIdAndParentId(UUID documentId, UUID parentId, Pageable pageable);

    Optional<DocumentComment> findByIdAndDocumentId(UUID id, UUID documentId);

    interface ReplyCount {
        UUID getParentId();
        long getTotal();
    }

    @Query("""
            select c.parent.id as parentId, count(c) as total
            from DocumentComment c where c.parent.id in :ids group by c.parent.id
            """)
    List<ReplyCount> countReplies(@Param("ids") List<UUID> parentIds);
}
