package org.example.edushare.feature.admin;

import org.example.edushare.feature.admin.service.AdminService;
import org.example.edushare.feature.admin.dto.*;
import org.example.edushare.feature.academic.entity.*;
import org.example.edushare.feature.academic.repository.*;
import org.example.edushare.feature.auth.entity.Role;
import org.example.edushare.feature.auth.repository.RoleRepository;
import org.example.edushare.feature.auth.service.CurrentAccountService;
import org.example.edushare.feature.user.entity.*;
import org.example.edushare.feature.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Import;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.oauth2.jwt.BadJwtException;
import org.springframework.web.server.ResponseStatusException;
import java.util.HashSet;
import java.util.Set;
import static org.assertj.core.api.Assertions.*;

@DataJpaTest
@Import({AdminService.class, CurrentAccountService.class, AdminServiceTest.Security.class})
@WithMockUser(username = "admin", roles = "ADMIN")
class AdminServiceTest {
    @TestConfiguration
    @EnableMethodSecurity
    static class Security {}

    @Autowired AdminService service;
    @Autowired CurrentAccountService accounts;
    @Autowired UserRepository users;
    @Autowired RoleRepository roles;
    @Autowired FacultyRepository faculties;
    @Autowired SubjectRepository subjects;
    @Autowired MajorRepository majors;
    @Autowired org.example.edushare.feature.auth.repository.UserAuthProviderRepository providers;

    @Test
    void developmentAdminIsCreatedOnceWithEncodedPassword() {
        var encoder = new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder();
        var initializer = new org.example.edushare.config.DevelopmentAdminInitializer(users, roles, providers, encoder);
        initializer.run(null);
        User admin = users.findByEmail("admin").orElseThrow();
        assertThat(encoder.matches("admin123", admin.getPassword())).isTrue();
        assertThat(admin.getRoles()).extracting(Role::getName).contains("ADMIN");
        assertThat(admin.getStatus()).isEqualTo(UserStatus.ACTIVE);
        String password = encoder.encode("changed-password");
        admin.setPassword(password);
        initializer.run(null);
        assertThat(users.findByEmail("admin").orElseThrow().getPassword()).isEqualTo(password);
    }

    private User createUser(String email) {
        Role role = roles.findByName("USER").orElseGet(() -> roles.save(Role.builder().name("USER").permissions(new HashSet<>()).build()));
        User user = User.builder().email(email).status(UserStatus.ACTIVE).roles(new HashSet<>(Set.of(role))).build();
        user.attachProfile(Profile.builder().fullName("Nguyễn An").build());
        return users.saveAndFlush(user);
    }

    @Test
    void searchesByNameAndFiltersRoleAndStatus() {
        createUser("student@example.com");
        assertThat(service.users("nguyễn", "USER", UserStatus.ACTIVE, 0).getTotalElements()).isEqualTo(1);
        assertThat(service.users("nguyễn", "ADMIN", null, 0).getTotalElements()).isZero();
        assertThat(service.users("student", "", UserStatus.BANNED, 0).getTotalElements()).isZero();
    }

    @Test
    void lockingAndRoleChangesImmediatelyAffectCurrentAccountScope() {
        User user = createUser("student@example.com");
        roles.saveAndFlush(Role.builder().name("ADMIN").permissions(new HashSet<>()).build());
        service.updateUser(user.getId(), new UserAccessRequest(Set.of("ADMIN"), UserStatus.ACTIVE));
        assertThat(accounts.scope(user.getEmail())).contains("ROLE_ADMIN").doesNotContain("ROLE_USER");
        service.updateUser(user.getId(), new UserAccessRequest(Set.of("USER"), UserStatus.BANNED));
        assertThatThrownBy(() -> accounts.scope(user.getEmail())).isInstanceOf(BadJwtException.class);
        service.updateUser(user.getId(), new UserAccessRequest(Set.of("USER"), UserStatus.ACTIVE));
        assertThat(accounts.scope(user.getEmail())).isEqualTo("ROLE_USER");
    }

    @Test
    void cannotChangeOwnAccount() {
        User user = createUser("admin");
        assertThatThrownBy(() -> service.updateUser(user.getId(), new UserAccessRequest(Set.of("USER"), UserStatus.BANNED)))
                .isInstanceOf(ResponseStatusException.class);
    }

    @Test
    @WithMockUser(roles = "USER")
    void ordinaryUserCannotAccessAdministration() {
        assertThatThrownBy(() -> service.overview()).isInstanceOf(AccessDeniedException.class);
        assertThatThrownBy(() -> service.deleteFaculty("any")).isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void managesFacultyAndSubjectWithoutLosingMajorLinks() {
        service.saveFaculty(null, new CatalogRequest("TEST", "Khoa thử nghiệm", "", null, null, null));
        Faculty faculty = faculties.findByCode("TEST").orElseThrow();
        Major major = majors.saveAndFlush(Major.builder().code("TEST-MAJOR").name("Ngành thử nghiệm").faculty(faculty).build());
        faculty.getMajors().add(major);
        service.saveSubject(null, new CatalogRequest("TEST101", "Môn thử nghiệm", "", faculty.getId(), 3, Set.of(major.getId())));
        Subject subject = subjects.findByCode("TEST101").orElseThrow();
        assertThat(subject.getFaculty()).isEqualTo(faculty);
        assertThat(major.getSubjects()).contains(subject);
        assertThatThrownBy(() -> service.deleteFaculty(faculty.getId())).isInstanceOf(ResponseStatusException.class);
        service.saveSubject(subject.getId(), new CatalogRequest("TEST102", "Môn đã sửa", "Mô tả", faculty.getId(), 4, Set.of()));
        assertThat(major.getSubjects()).doesNotContain(subject);
        service.deleteSubject(subject.getId());
        assertThat(subjects.findById(subject.getId())).isEmpty();
        faculty.getMajors().clear();
        majors.delete(major);
        majors.flush();
        service.deleteFaculty(faculty.getId());
        assertThat(faculties.findById(faculty.getId())).isEmpty();
    }

    @Test
    void rejectsDuplicateCodesButAllowsCrossFacultyMajor() {
        service.saveFaculty(null, new CatalogRequest("F1", "Khoa 1", "", null, null, null));
        service.saveFaculty(null, new CatalogRequest("F2", "Khoa 2", "", null, null, null));
        Faculty first = faculties.findByCode("F1").orElseThrow();
        Faculty second = faculties.findByCode("F2").orElseThrow();
        Major major = majors.saveAndFlush(Major.builder().code("M1").name("Ngành 1").faculty(first).build());
        assertThatThrownBy(() -> service.saveFaculty(null, new CatalogRequest("f1", "Trùng", "", null, null, null)))
                .isInstanceOf(ResponseStatusException.class);
        service.saveSubject(null, new CatalogRequest("S1", "Môn 1", "", second.getId(), 3, Set.of(major.getId())));
        Subject subject = subjects.findByCode("S1").orElseThrow();
        assertThat(subject.getFaculty()).isEqualTo(second);
        assertThat(subject.getMajors()).contains(major);
        assertThat(subjects.findByIdAndMajorId(subject.getId(), major.getId())).isPresent();
        assertThatThrownBy(() -> service.deleteMajor(major.getId())).isInstanceOf(ResponseStatusException.class);
    }

    @Autowired jakarta.persistence.EntityManager entityManager;

    @Autowired org.example.edushare.feature.auth.repository.InvalidatedTokenRepository invalidatedTokens;

    @Test
    void combinedAuthorizationUsesOneQueryAndRejectsRevokedTokensImmediately() {
        User user = createUser("token@example.com");
        entityManager.clear();
        var stats = entityManager.getEntityManagerFactory().unwrap(org.hibernate.SessionFactory.class).getStatistics();
        stats.setStatisticsEnabled(true);
        try {
            stats.clear();
            assertThat(accounts.scope(user.getEmail(), "test-token")).isEqualTo("ROLE_USER");
            assertThat(stats.getPrepareStatementCount()).isEqualTo(1);
            invalidatedTokens.saveAndFlush(org.example.edushare.feature.auth.entity.InvalidatedToken.builder()
                    .id("test-token").expiryTime(java.time.Instant.now().plusSeconds(3600))
                    .revokedAt(java.time.Instant.now()).build());
            assertThatThrownBy(() -> accounts.scope(user.getEmail(), "test-token")).isInstanceOf(BadJwtException.class);
            assertThat(accounts.scope(user.getEmail(), "other-token")).isEqualTo("ROLE_USER");
            User current = users.findByEmail(user.getEmail()).orElseThrow();
            current.setStatus(UserStatus.BANNED);
            users.flush();
            assertThatThrownBy(() -> accounts.scope(user.getEmail(), "other-token")).isInstanceOf(BadJwtException.class);
        } finally {
            stats.setStatisticsEnabled(false);
        }
    }

    @Test
    void managesMajorsAndProtectsProfileReferences() {
        service.saveFaculty(null, new CatalogRequest("F1", "Khoa 1", "", null, null, null));
        service.saveFaculty(null, new CatalogRequest("F2", "Khoa 2", "", null, null, null));
        String first = faculties.findByCode("F1").orElseThrow().getId();
        String second = faculties.findByCode("F2").orElseThrow().getId();
        service.saveMajor(null, new CatalogRequest("M1", "Ngành 1", "", first, null, null));
        String id = majors.findByCode("M1").orElseThrow().getId();
        service.saveMajor(id, new CatalogRequest("M2", "Ngành đã sửa", "Mô tả", second, null, null));
        entityManager.clear();
        assertThat(majors.findById(id).orElseThrow().getFaculty().getId()).isEqualTo(second);
        User user = createUser("major@example.com");
        user.getProfile().setMajor(majors.findById(id).orElseThrow());
        users.flush();
        assertThatThrownBy(() -> service.deleteMajor(id)).isInstanceOf(ResponseStatusException.class);
        user.getProfile().setMajor(null);
        users.flush();
        service.deleteMajor(id);
        assertThat(majors.findById(id)).isEmpty();
    }

    @Test
    void overviewAndCatalogQueriesRemainBounded() {
        for (int i = 0; i < 12; i++) createUser("user" + i + "@example.com");
        entityManager.flush();
        entityManager.clear();
        var stats = entityManager.getEntityManagerFactory().unwrap(org.hibernate.SessionFactory.class).getStatistics();
        stats.setStatisticsEnabled(true);
        try {
            stats.clear();
            assertThat(service.overview().get("users")).isEqualTo(12);
            assertThat(stats.getPrepareStatementCount()).isEqualTo(4);
            stats.clear();
            assertThat(service.users("", "", null, 0).getContent()).hasSize(10);
            assertThat(stats.getPrepareStatementCount()).isLessThanOrEqualTo(3);
            entityManager.clear();
            stats.clear();
            assertThat(accounts.scope("user0@example.com")).contains("ROLE_USER");
            assertThat(stats.getPrepareStatementCount()).isEqualTo(1);
        } finally {
            stats.setStatisticsEnabled(false);
        }
    }
}
