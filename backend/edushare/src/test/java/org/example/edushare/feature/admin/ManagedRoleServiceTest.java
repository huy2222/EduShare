package org.example.edushare.feature.admin;

import org.example.edushare.config.ManagedPermissionInitializer;
import org.example.edushare.feature.admin.dto.*;
import org.example.edushare.feature.admin.service.*;
import org.example.edushare.feature.auth.entity.*;
import org.example.edushare.feature.auth.repository.*;
import org.example.edushare.feature.auth.service.CurrentAccountService;
import org.example.edushare.feature.user.entity.*;
import org.example.edushare.feature.user.repository.UserRepository;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.server.ResponseStatusException;
import java.util.*;
import static org.assertj.core.api.Assertions.*;

@DataJpaTest
@Import({org.example.edushare.feature.admin.service.AdminAuthorization.class, ManagedRoleService.class, AdminService.class, CurrentAccountService.class, ManagedPermissionInitializer.class, AdminServiceTest.Security.class})
@WithMockUser(username = "admin", roles = "ADMIN")
class ManagedRoleServiceTest {
    @Autowired ManagedRoleService service;
    @Autowired ManagedPermissionInitializer initializer;
    @Autowired RoleRepository roles;
    @Autowired PermissionRepository permissions;
    @Autowired UserRepository users;
    @Autowired CurrentAccountService accounts;
    @Autowired AdminService admin;

    @BeforeEach void seed() { initializer.run(null); }

    private Role role(String code) {
        return roles.saveAndFlush(Role.builder().name(code).permissions(new HashSet<>()).build());
    }
    private User user(String email, Role role) {
        return users.saveAndFlush(User.builder().email(email).status(UserStatus.ACTIVE).roles(new HashSet<>(Set.of(role))).build());
    }

    @Test void createsSearchableRoleAndImmutableCode() {
        var created = service.save(null, new ManagedRoleRequest("ASSISTANT", "Trợ giảng", "Mô tả", true));
        assertThat(service.search("trợ", 0).items()).hasSize(1);
        assertThatThrownBy(() -> service.save(null, new ManagedRoleRequest("ASSISTANT", "Trùng", "", true))).isInstanceOf(ResponseStatusException.class);
        assertThatThrownBy(() -> service.save(created.id(), new ManagedRoleRequest("NEW_CODE", "Tên mới", "", true))).isInstanceOf(ResponseStatusException.class);
        assertThat(service.save(created.id(), new ManagedRoleRequest("ASSISTANT", "Tên mới", "", false)).active()).isFalse();
        service.delete(created.id());
        assertThat(roles.findById(created.id())).isEmpty();
    }

    @Test void configuresPermissionsAndDisablesExistingSessionsWithoutRemovingAssignments() {
        Role role = role("ASSISTANT");
        User user = user("assistant@example.com", role);
        service.configure(role.getId(), Set.of("USER_VIEW", "CATALOG_VIEW"));
        assertThat(accounts.scope(user.getEmail())).contains("USER_VIEW", "CATALOG_VIEW");
        assertThat(service.search("ASSISTANT", 0).items().getFirst().userCount()).isEqualTo(1);
        service.configure(role.getId(), Set.of("CATALOG_VIEW"));
        assertThat(accounts.scope(user.getEmail())).doesNotContain("USER_VIEW");
        service.save(role.getId(), new ManagedRoleRequest("ASSISTANT", "Trợ giảng", "", false));
        assertThat(accounts.scope(user.getEmail())).isEmpty();
        assertThat(user.getRoles()).contains(role);
        assertThatThrownBy(() -> service.delete(role.getId())).isInstanceOf(ResponseStatusException.class);
        service.save(role.getId(), new ManagedRoleRequest("ASSISTANT", "Trợ giảng", "", true));
        assertThat(accounts.scope(user.getEmail())).contains("CATALOG_VIEW");
    }

    @Test void protectsSystemRolesAndRejectsUnknownPermissions() {
        Role root = role("ADMIN"); Role normal = role("USER"); Role custom = role("CUSTOM");
        assertThatThrownBy(() -> service.configure(root.getId(), Set.of())).isInstanceOf(ResponseStatusException.class);
        assertThatThrownBy(() -> service.delete(normal.getId())).isInstanceOf(ResponseStatusException.class);
        assertThatThrownBy(() -> service.save(root.getId(), new ManagedRoleRequest("ADMIN", "Admin", "", false))).isInstanceOf(ResponseStatusException.class);
        assertThatThrownBy(() -> service.configure(custom.getId(), Set.of("UNKNOWN"))).isInstanceOf(ResponseStatusException.class);
    }

    @Test void seedsExistingModeratorPermissionOnceAndKeepsLaterChanges() {
        // Initializer is idempotent: removed grants must not be restored on startup.
        Role moderator = role("MODERATOR");
        service.configure(moderator.getId(), Set.of("USER_VIEW"));
        initializer.run(null);
        assertThat(service.detail(moderator.getId()).permissions()).containsExactly("USER_VIEW");
    }

    @Test @WithMockUser(roles = "USER") void rejectsNonAdminManagement() {
        assertThatThrownBy(() -> service.search("", 0)).isInstanceOf(AccessDeniedException.class);
        assertThatThrownBy(() -> service.save(null, new ManagedRoleRequest("ASSISTANT", "Trợ giảng", "", true))).isInstanceOf(AccessDeniedException.class);
    }

    @Test @WithMockUser(username = "creator", authorities = {"ACCESS_ROLE_CREATE"})
    void roleCreationDoesNotGrantPermissionConfigurationOrDeletion() {
        var created = service.save(null, new ManagedRoleRequest("CREATED", "Vai trò mới", "", true));
        assertThat(service.detail(created.id()).permissions()).isEmpty();
        assertThatThrownBy(() -> service.configure(created.id(), Set.of("USER_BAN"))).isInstanceOf(AccessDeniedException.class);
        assertThatThrownBy(() -> service.delete(created.id())).isInstanceOf(AccessDeniedException.class);
    }

    @Test @WithMockUser(username = "facultycreator", authorities = {"FACULTY_CREATE"})
    void facultyCreateDoesNotGrantUpdateOrDeleteOrOtherCatalogs() {
        admin.saveFaculty(null, new CatalogRequest("ONLYCREATE", "Khoa mới", "", null, null, null));
        assertThatThrownBy(() -> admin.saveFaculty("anything", new CatalogRequest("OTHER", "Sửa", "", null, null, null)))
                .isInstanceOf(AccessDeniedException.class);
        assertThatThrownBy(() -> admin.deleteFaculty("anything")).isInstanceOf(AccessDeniedException.class);
        assertThatThrownBy(() -> admin.saveMajor(null, new CatalogRequest("OTHER", "Ngành", "", "f", null, null)))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Autowired AdminAuthorization authorization;
    @Test @WithMockUser(authorities = "DOCUMENT_APPROVE")
    void approvalPermissionDoesNotAllowRejectingOrHiding() {
        assertThat(authorization.documentAction(org.example.edushare.feature.document.entity.ModerationAction.APPROVED)).isTrue();
        assertThat(authorization.documentAction(org.example.edushare.feature.document.entity.ModerationAction.REJECTED)).isFalse();
        assertThat(authorization.documentAction(org.example.edushare.feature.document.entity.ModerationAction.HIDDEN)).isFalse();
    }

    @Test void unavailableRightsCannotBeAssignedAndUserPermissionsCanBeConfigured() {
        Role custom = role("CUSTOM"); Role normal = role("USER");
        assertThatThrownBy(() -> service.configure(custom.getId(), Set.of("REPORT_VIEW"))).isInstanceOf(ResponseStatusException.class);
        service.configure(normal.getId(), Set.of("DOCUMENT_VIEW", "DOCUMENT_UPLOAD"));
        assertThat(service.detail(normal.getId()).permissions()).containsExactlyInAnyOrder("DOCUMENT_VIEW", "DOCUMENT_UPLOAD");
    }

    @Test @WithMockUser(username = "delegate", authorities = {"USER_VIEW", "USER_ROLE_ASSIGN"})
    void enforcesSeparateBanPermissionAndProtectsAdminAssignment() {
        Role normal = role("USER"); role("ADMIN"); Role inactive = role("INACTIVE_ROLE"); inactive.setActive(false); roles.flush();
        User target = user("target@example.com", normal);
        assertThat(admin.users("target", "", null, 0).getTotalElements()).isEqualTo(1);
        assertThatThrownBy(() -> admin.updateUser(target.getId(), new UserAccessRequest(Set.of("USER"), UserStatus.BANNED))).isInstanceOf(AccessDeniedException.class);
        assertThatThrownBy(() -> admin.updateUser(target.getId(), new UserAccessRequest(Set.of("ADMIN"), UserStatus.ACTIVE))).isInstanceOf(AccessDeniedException.class);
        assertThatThrownBy(() -> admin.updateUser(target.getId(), new UserAccessRequest(Set.of("INACTIVE_ROLE"), UserStatus.ACTIVE))).isInstanceOf(ResponseStatusException.class);
    }
}
