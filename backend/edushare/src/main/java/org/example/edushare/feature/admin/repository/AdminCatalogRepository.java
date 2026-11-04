package org.example.edushare.feature.admin.repository;

import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.example.edushare.feature.admin.dto.*;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Repository;
import java.util.*;

@Repository
@RequiredArgsConstructor
public class AdminCatalogRepository {
    private final EntityManager entityManager;
    private static final String DTO = "org.example.edushare.feature.admin.dto.CatalogRowResponse";

    public Page<CatalogRowResponse> search(String type, String search, String facultyId, String majorId,
            Pageable pageable, boolean options) {
        String entity = switch (type) {
            case "faculties" -> "Faculty";
            case "majors" -> "Major";
            case "subjects" -> "Subject";
            default -> throw new IllegalArgumentException("Unsupported catalog");
        };
        boolean faculty = type.equals("faculties");
        String from = " from " + entity + " e" + (faculty ? "" : " left join e.faculty f");
        String where = " where (lower(e.code) like :search escape '!' or lower(e.name) like :search escape '!')";
        Map<String, Object> params = new HashMap<>();
        params.put("search", "%" + search.trim().toLowerCase(Locale.ROOT).replace("!", "!!").replace("%", "!%").replace("_", "!_") + "%");
        if (!faculty && !facultyId.isBlank()) {
            where += " and f.id = :facultyId";
            params.put("facultyId", facultyId);
        }
        if (type.equals("subjects") && !majorId.isBlank()) {
            where += " and exists (select m.id from Major m join m.subjects s where m.id = :majorId and s.id = e.id)";
            params.put("majorId", majorId);
        }
        String fields = "e.id, e.code, e.name, " + (options ? "cast(null as String)" : "e.description")
                + (faculty ? ", cast(null as String), cast(null as String), cast(null as Integer), "
                    + (options ? "0L" : "(select count(m) from Major m where m.faculty.id = e.id)")
                : ", f.id, f.name, " + (type.equals("subjects") ? "e.credits" : "cast(null as Integer)") + ", 0L");
        var query = entityManager.createQuery("select new " + DTO + "(" + fields + ")" + from + where + " order by e.code, e.id", CatalogRowResponse.class);
        var count = entityManager.createQuery("select count(e)" + from + where, Long.class);
        params.forEach((key, value) -> { query.setParameter(key, value); count.setParameter(key, value); });
        var items = query.setFirstResult(Math.toIntExact(pageable.getOffset())).setMaxResults(pageable.getPageSize()).getResultList();
        return new PageImpl<>(items, pageable, count.getSingleResult());
    }

    public List<CatalogRowResponse> subjectMajors(String id) {
        return entityManager.createQuery("select new " + DTO
                + "(m.id, m.code, m.name, cast(null as String), f.id, f.name, cast(null as Integer), 0L)"
                + " from Major m join m.faculty f join m.subjects s where s.id = :id order by m.code", CatalogRowResponse.class)
                .setParameter("id", id).getResultList();
    }
}
