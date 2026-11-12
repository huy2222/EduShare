package org.example.edushare.feature.document.repository;

import org.example.edushare.feature.document.entity.DocumentCommentLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DocumentCommentLikeRepository extends JpaRepository<DocumentCommentLike, UUID> {
    Optional<DocumentCommentLike> findByCommentIdAndUserId(UUID commentId, String userId);

    long countByCommentId(UUID commentId);

    interface LikeSummary {
        UUID getCommentId();
        long getTotal();
        long getViewerLikes();
    }

    @Query("""
            select l.comment.id as commentId, count(l) as total,
                   sum(case when l.user.id = :viewerId then 1 else 0 end) as viewerLikes
            from DocumentCommentLike l where l.comment.id in :ids group by l.comment.id
            """)
    List<LikeSummary> summarize(@Param("ids") List<UUID> commentIds, @Param("viewerId") String viewerId);
}
