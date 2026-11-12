package org.example.edushare.feature.document.repository;

import org.example.edushare.feature.document.entity.DocumentInteraction;
import org.example.edushare.feature.document.entity.DocumentStatus;
import org.example.edushare.feature.document.entity.ScanStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DocumentInteractionRepository extends JpaRepository<DocumentInteraction, UUID> {
    Optional<DocumentInteraction> findByDocumentIdAndUserId(UUID documentId, String userId);

    interface RatingCount {
        int getStars();
        long getTotal();
    }

    @Query("""
            select i.rating as stars, count(i) as total from DocumentInteraction i
            where i.document.id = :id and i.rating is not null group by i.rating
            """)
    List<RatingCount> countRatings(@Param("id") UUID documentId);

    @EntityGraph(attributePaths = {
            "document", "document.uploader", "document.uploader.profile",
            "document.subject", "document.subject.faculty"
    })
    @Query("""
            select i from DocumentInteraction i join i.document d join d.subject s
            where i.user.id = :userId and i.favorite = true
              and d.status = :status and d.scanStatus = :scanStatus
              and (:search = '' or lower(d.title) like concat('%', :search, '%')
                   or lower(s.name) like concat('%', :search, '%')
                   or lower(s.code) like concat('%', :search, '%'))
            """)
    Page<DocumentInteraction> searchFavorites(@Param("userId") String userId, @Param("status") DocumentStatus status,
                                              @Param("scanStatus") ScanStatus scanStatus,
                                              @Param("search") String search, Pageable pageable);
}
