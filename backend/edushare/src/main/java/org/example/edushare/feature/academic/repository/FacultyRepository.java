package org.example.edushare.feature.academic.repository;

import org.example.edushare.feature.academic.entity.Faculty;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface FacultyRepository extends JpaRepository<Faculty, String> {
    @org.springframework.data.jpa.repository.Query("select distinct f from Faculty f left join fetch f.majors order by f.name")
    java.util.List<Faculty> findAdminCatalog();

    Optional<Faculty> findByCode(String code);
}
