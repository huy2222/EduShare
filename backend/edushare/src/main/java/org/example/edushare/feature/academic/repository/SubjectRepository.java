package org.example.edushare.feature.academic.repository;

import org.example.edushare.feature.academic.entity.Subject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface SubjectRepository extends JpaRepository<Subject, String> {

    Optional<Subject> findByCode(String code);

    @Query("select distinct s from Subject s join s.majors m where s.id = :subjectId and m.id = :majorId")
    Optional<Subject> findByIdAndMajorId(
            @Param("subjectId") String subjectId,
            @Param("majorId") String majorId
    );
}
