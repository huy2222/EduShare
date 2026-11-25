package org.example.edushare.feature.academic.repository;

import org.example.edushare.feature.academic.entity.Subject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Lock;
import org.example.edushare.feature.document.entity.DocumentStatus;
import org.example.edushare.feature.document.entity.ScanStatus;

import java.util.Optional;

public interface SubjectRepository extends JpaRepository<Subject, String> {
    @EntityGraph(attributePaths = "faculty")
    Optional<Subject> findByIdAndActiveTrue(String id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from Subject s where s.id = :id and s.active = true")
    Optional<Subject> findForFollow(@Param("id") String id);

    @EntityGraph(attributePaths = "faculty")
    @Query(value = """
            select s from Subject s left join s.faculty f
            where s.active = true
              and (:search = '' or lower(s.name) like concat('%', :search, '%')
                   or lower(s.code) like concat('%', :search, '%'))
              and (:facultyId is null or f.id = :facultyId)
              and (:majorId is null or exists (select m.id from Major m join m.subjects ms where ms.id = s.id and m.id = :majorId))
              and (:userId is null or exists (select sf.id from SubjectFollow sf where sf.subject = s and sf.user.id = :userId))
            order by (select count(d) from Document d where d.subject = s and d.status = :status and d.scanStatus = :scanStatus) desc,
                     s.name, s.id
            """, countQuery = """
            select count(s) from Subject s left join s.faculty f
            where s.active = true
              and (:search = '' or lower(s.name) like concat('%', :search, '%')
                   or lower(s.code) like concat('%', :search, '%'))
              and (:facultyId is null or f.id = :facultyId)
              and (:majorId is null or exists (select m.id from Major m join m.subjects ms where ms.id = s.id and m.id = :majorId))
              and (:userId is null or exists (select sf.id from SubjectFollow sf where sf.subject = s and sf.user.id = :userId))
            """)
    Page<Subject> browse(@Param("search") String search, @Param("facultyId") String facultyId,
                         @Param("majorId") String majorId, @Param("userId") String userId,
                         @Param("status") DocumentStatus status, @Param("scanStatus") ScanStatus scanStatus,
                         Pageable pageable);

    boolean existsByFacultyId(String facultyId);

    Optional<Subject> findByCode(String code);

    @Query("select distinct s from Subject s join s.majors m where s.id = :subjectId and m.id = :majorId")
    Optional<Subject> findByIdAndMajorId(
            @Param("subjectId") String subjectId,
            @Param("majorId") String majorId
    );
}
