package org.example.edushare.feature.academic.repository;

import org.example.edushare.feature.academic.entity.Major;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MajorRepository extends JpaRepository<Major, String> {
    @org.springframework.data.jpa.repository.Query("select m from Major m join fetch m.faculty order by m.name")
    java.util.List<Major> findAdminCatalog();

    Optional<Major> findByCode(String code);

    Optional<Major> findByIdAndFacultyId(String majorId, String facultyId);
}
