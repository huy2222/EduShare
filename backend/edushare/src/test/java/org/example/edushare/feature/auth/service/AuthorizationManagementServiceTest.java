package org.example.edushare.feature.auth.service;

import org.example.edushare.feature.auth.dto.request.PermissionRequest;
import org.example.edushare.feature.auth.dto.response.PermissionResponse;
import org.example.edushare.feature.auth.dto.response.RoleResponse;
import org.example.edushare.feature.auth.entity.Permission;
import org.example.edushare.feature.auth.entity.Role;
import org.example.edushare.feature.auth.repository.PermissionRepository;
import org.example.edushare.feature.auth.repository.RoleRepository;
import org.example.edushare.feature.user.entity.User;
import org.example.edushare.feature.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthorizationManagementServiceTest {

    @Mock
    PermissionRepository permissionRepository;
    @Mock
    RoleRepository roleRepository;
    @Mock
    UserRepository userRepository;

    PermissionService permissionService;
    RoleService roleService;

    @BeforeEach
    void setUp() {
        permissionService = new PermissionService(permissionRepository, roleRepository);
        roleService = new RoleService(roleRepository, permissionRepository, userRepository);
    }

    @Test
    void createPermissionNormalizesName() {
        when(permissionRepository.existsByNameIgnoreCase("APPROVE_POST")).thenReturn(false);
        when(permissionRepository.saveAndFlush(any(Permission.class))).thenAnswer(invocation -> {
            Permission permission = invocation.getArgument(0);
            permission.setId("permission-id");
            return permission;
        });

        PermissionResponse response = permissionService.create(
                new PermissionRequest(" approve_post ", " Approve a post "));

        assertEquals("permission-id", response.id());
        assertEquals("APPROVE_POST", response.name());
        assertEquals("Approve a post", response.description());
    }

    @Test
    void addPermissionToRoleIsIdempotent() {
        Permission permission = Permission.builder()
                .id("permission-id")
                .name("APPROVE_POST")
                .build();
        Role role = Role.builder()
                .id("role-id")
                .name("MODERATOR")
                .permissions(new HashSet<>())
                .build();
        when(roleRepository.findById("role-id")).thenReturn(Optional.of(role));
        when(permissionRepository.findById("permission-id")).thenReturn(Optional.of(permission));

        RoleResponse first = roleService.addPermission("role-id", "permission-id");
        RoleResponse second = roleService.addPermission("role-id", "permission-id");

        assertEquals(1, first.permissions().size());
        assertEquals(1, second.permissions().size());
        assertEquals("APPROVE_POST", second.permissions().get(0).name());
    }

    @Test
    void deletePermissionDetachesItFromRoles() {
        Permission permission = Permission.builder().id("permission-id").name("DELETE_POST").build();
        Role role = Role.builder()
                .id("role-id")
                .name("ADMIN")
                .permissions(new HashSet<>(Set.of(permission)))
                .build();
        when(permissionRepository.findById("permission-id")).thenReturn(Optional.of(permission));
        when(roleRepository.findAllByPermissions_Id("permission-id")).thenReturn(List.of(role));

        permissionService.delete("permission-id");

        assertTrue(role.getPermissions().isEmpty());
        verify(permissionRepository).delete(permission);
    }

    @Test
    void deleteRoleDetachesItFromUsers() {
        Role role = Role.builder().id("role-id").name("MODERATOR").build();
        User user = User.builder().id("user-id").roles(new HashSet<>(Set.of(role))).build();
        when(roleRepository.findById("role-id")).thenReturn(Optional.of(role));
        when(userRepository.findAllByRoles_Id("role-id")).thenReturn(List.of(user));

        roleService.delete("role-id");

        assertTrue(user.getRoles().isEmpty());
        verify(roleRepository).delete(role);
    }
}
