package org.example.edushare.feature.admin;

import jakarta.persistence.EntityManager;
import org.example.edushare.feature.admin.repository.AdminCatalogRepository;
import org.example.edushare.feature.admin.service.AdminCatalogQueryService;
import org.example.edushare.feature.admin.service.AdminService;
import org.example.edushare.feature.admin.dto.CatalogRequest;
import org.example.edushare.feature.academic.entity.*;
import org.example.edushare.feature.academic.repository.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.test.context.support.WithMockUser;
import static org.assertj.core.api.Assertions.*;

@DataJpaTest
@Import({org.example.edushare.feature.admin.service.AdminAuthorization.class, AdminCatalogRepository.class, AdminCatalogQueryService.class, AdminService.class, AdminServiceTest.Security.class})
@WithMockUser(username = "admin", roles = "ADMIN")
class AdminCatalogQueryTest {
    @Autowired AdminCatalogQueryService queries;
    @Autowired AdminService service;
    @Autowired FacultyRepository faculties;
    @Autowired MajorRepository majors;
    @Autowired SubjectRepository subjects;
    @Autowired EntityManager em;
    @Autowired org.springframework.transaction.PlatformTransactionManager transactions;

    @Test
    @WithMockUser(roles = "USER")
    void deniesNonAdminReadAccess() {
        assertThatThrownBy(() -> queries.search("subjects", "", "", "", 0, 10, false))
                .isInstanceOf(org.springframework.security.access.AccessDeniedException.class);
        assertThatThrownBy(() -> queries.detail("subjects", "id"))
                .isInstanceOf(org.springframework.security.access.AccessDeniedException.class);
    }

    @Test
    @org.springframework.transaction.annotation.Transactional(propagation = org.springframework.transaction.annotation.Propagation.NOT_SUPPORTED)
    void cachesOverviewAndInvalidatesOnlyAfterCommit() {
        var tx = new org.springframework.transaction.support.TransactionTemplate(transactions);
        org.springframework.test.util.ReflectionTestUtils.setField(service, "overviewCache", null);
        long original = tx.execute(status -> service.overview().get("faculties"));
        var stats = em.getEntityManagerFactory().unwrap(org.hibernate.SessionFactory.class).getStatistics();
        stats.setStatisticsEnabled(true); stats.clear();
        try {
            assertThat(tx.<Long>execute(status -> service.overview().get("faculties"))).isEqualTo(original);
            assertThat(stats.getPrepareStatementCount()).isZero();
            tx.executeWithoutResult(status -> service.saveFaculty(null, new CatalogRequest("CACHE", "Cache test", "", null, null, null)));
            assertThat(tx.<Long>execute(status -> service.overview().get("faculties"))).isEqualTo(original + 1);
            tx.executeWithoutResult(status -> {
                service.saveFaculty(null, new CatalogRequest("ROLLBACK", "Rollback", "", null, null, null));
                status.setRollbackOnly();
            });
            stats.clear();
            assertThat(tx.<Long>execute(status -> service.overview().get("faculties"))).isEqualTo(original + 1);
            assertThat(stats.getPrepareStatementCount()).isZero();
            org.springframework.test.util.ReflectionTestUtils.setField(service, "overviewExpiresAt", 0L);
            stats.clear();
            tx.executeWithoutResult(status -> service.overview());
            assertThat(stats.getPrepareStatementCount()).isEqualTo(4);
        } finally {
            stats.setStatisticsEnabled(false);
            tx.executeWithoutResult(status -> faculties.findByCode("CACHE").ifPresent(f -> service.deleteFaculty(f.getId())));
        }
    }

    @Test
    void paginatesAndFiltersInDatabaseWithoutLoadingEntities() {
        Faculty faculty = faculties.save(Faculty.builder().code("MATH").name("Toán").build());
        Faculty other = faculties.save(Faculty.builder().code("IT").name("CNTT").build());
        Major major = majors.save(Major.builder().code("SE").name("Phần mềm").faculty(other).build());
        for (int i = 0; i < 23; i++) {
            Subject subject = subjects.save(Subject.builder().code(String.format("S%02d", i)).name("Môn " + i).description("Mô tả").credits(3).faculty(faculty).build());
            major.addSubject(subject);
        }
        em.flush(); em.clear();
        var stats = em.getEntityManagerFactory().unwrap(org.hibernate.SessionFactory.class).getStatistics();
        stats.setStatisticsEnabled(true); stats.clear();
        try {
            var result = queries.search("subjects", "", faculty.getId(), major.getId(), 1, 10, false);
            assertThat(result.totalElements()).isEqualTo(23);
            assertThat(result.items()).hasSize(10);
            assertThat(result.items().getFirst().code()).isEqualTo("S10");
            assertThat(stats.getPrepareStatementCount()).isEqualTo(2);
            assertThat(stats.getEntityLoadCount()).isZero();
            assertThat(queries.search("subjects", "S22", "", "", 0, 10, false).items()).hasSize(1);
            assertThat(queries.search("subjects", "", other.getId(), "", 0, 10, false).items()).isEmpty();
            assertThat(queries.search("subjects", "", "", "", 0, 10, true).items().getFirst().description()).isNull();
            var detail = queries.detail("subjects", result.items().getFirst().id());
            assertThat(detail.majors()).extracting(row -> row.id()).containsExactly(major.getId());
            assertThat(detail.facultyId()).isEqualTo(faculty.getId());
        } finally { stats.setStatisticsEnabled(false); }
    }

    @Test
    void returnsFacultyCountsAndMajorProjectionAndRejectsOversizedPages() {
        service.saveFaculty(null, new CatalogRequest("F", "Khoa", "", null, null, null));
        String id = faculties.findByCode("F").orElseThrow().getId();
        service.saveMajor(null, new CatalogRequest("M", "Ngành", "", id, null, null));
        em.clear();
        assertThat(queries.search("faculties", "", "", "", 0, 10, false).items().getFirst().majorCount()).isEqualTo(1);
        assertThat(queries.search("majors", "", id, "", 0, 10, false).items().getFirst().facultyId()).isEqualTo(id);
        assertThatThrownBy(() -> queries.search("subjects", "", "", "", 0, 10000, false))
                .isInstanceOf(org.springframework.web.server.ResponseStatusException.class);
    }
}
