package org.example.edushare.feature.auth.service;

import lombok.RequiredArgsConstructor;
import org.example.edushare.common.exception.AppException;
import org.example.edushare.common.exception.ErrorCode;
import org.example.edushare.feature.auth.dto.request.RoleRequest;
import org.example.edushare.feature.auth.dto.response.PermissionResponse;
import org.example.edushare.feature.auth.dto.response.RoleResponse;
import org.example.edushare.feature.auth.entity.Permission;
import org.example.edushare.feature.auth.entity.Role;
import org.example.edushare.feature.auth.repository.PermissionRepository;
import org.example.edushare.feature.auth.repository.RoleRepository;
import org.example.edushare.feature.user.repository.UserRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class RoleService {
    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final UserRepository userRepository;

    @Transactional
    public RoleResponse create(RoleRequest request) {
        String name = normalizeName(request.name());
        if (roleRepository.existsByNameIgnoreCase(name)) {
            throw new AppException(ErrorCode.ROLE_EXISTED);
        }

        Role role = Role.builder()
                .name(name)
                .description(normalizeDescription(request.description()))
                .permissions(new HashSet<>())
                .build();
        try {
            return toResponse(roleRepository.saveAndFlush(role));
        } catch (DataIntegrityViolationException exception) {
            throw new AppException(ErrorCode.ROLE_EXISTED);
        }
    }

    @Transactional(readOnly = true)
    public List<RoleResponse> getAll() {
        return roleRepository.findAll().stream()
                .sorted(Comparator.comparing(Role::getName))
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public RoleResponse getById(String id) {
        return toResponse(findRole(id));
    }

    @Transactional
    public RoleResponse update(String id, RoleRequest request) {
        Role role = findRole(id);
        String name = normalizeName(request.name());
        if (roleRepository.existsByNameIgnoreCaseAndIdNot(name, id)) {
            throw new AppException(ErrorCode.ROLE_EXISTED);
        }

        role.setName(name);
        role.setDescription(normalizeDescription(request.description()));
        try {
            return toResponse(roleRepository.saveAndFlush(role));
        } catch (DataIntegrityViolationException exception) {
            throw new AppException(ErrorCode.ROLE_EXISTED);
        }
    }

    @Transactional
    public void delete(String id) {
        Role role = findRole(id);
        userRepository.findAllByRoles_Id(id)
                .forEach(user -> user.getRoles()
                        .removeIf(item -> item.getId().equals(id)));
        roleRepository.delete(role);
    }

    @Transactional
    public RoleResponse addPermission(String roleId, String permissionId) {
        Role role = findRole(roleId);
        Permission permission = findPermission(permissionId);
        if (role.getPermissions() == null) {
            role.setPermissions(new HashSet<>());
        }
        role.getPermissions().add(permission);
        return toResponse(role);
    }

    @Transactional
    public RoleResponse removePermission(String roleId, String permissionId) {
        Role role = findRole(roleId);
        findPermission(permissionId);
        if (role.getPermissions() != null) {
            role.getPermissions().removeIf(permission -> permission.getId().equals(permissionId));
        }
        return toResponse(role);
    }

    private Role findRole(String id) {
        return roleRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND));
    }

    private Permission findPermission(String id) {
        return permissionRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.PERMISSION_NOT_FOUND));
    }

    private RoleResponse toResponse(Role role) {
        List<PermissionResponse> permissions = role.getPermissions() == null
                ? List.of()
                : role.getPermissions().stream()
                        .sorted(Comparator.comparing(Permission::getName))
                        .map(permission -> new PermissionResponse(
                                permission.getId(),
                                permission.getName(),
                                permission.getDescription()))
                        .toList();

        return new RoleResponse(
                role.getId(),
                role.getName(),
                role.getDescription(),
                permissions);
    }

    private String normalizeName(String name) {
        return name.trim().toUpperCase(Locale.ROOT);
    }

    private String normalizeDescription(String description) {
        if (description == null || description.isBlank()) {
            return null;
        }
        return description.trim();
    }
}
