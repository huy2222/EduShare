package org.example.edushare.feature.academic.repository;

import org.example.edushare.feature.academic.entity.Faculty;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface FacultyRepository extends JpaRepository<Faculty, String> {

    Optional<Faculty> findByCode(String code);
}
