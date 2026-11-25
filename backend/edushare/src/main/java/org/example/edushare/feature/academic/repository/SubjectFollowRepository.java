package org.example.edushare.feature.academic.repository;

import org.example.edushare.feature.academic.entity.SubjectFollow;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SubjectFollowRepository extends JpaRepository<SubjectFollow, UUID> {
    Optional<SubjectFollow> findBySubjectIdAndUserId(String subjectId, String userId);
    long countBySubjectId(String subjectId);

    @Query("select f.subject.id from SubjectFollow f where f.user.id = :userId and f.subject.active = true")
    List<String> findActiveSubjectIds(@Param("userId") String userId);

    interface SubjectCount {
        String getSubjectId();
        long getTotal();
    }

    @Query("select f.subject.id as subjectId, count(f) as total from SubjectFollow f where f.subject.id in :ids group by f.subject.id")
    List<SubjectCount> countForSubjects(@Param("ids") Collection<String> ids);
}
