package org.example.edushare.feature.auth.service;

import lombok.RequiredArgsConstructor;
import org.example.edushare.common.exception.AppException;
import org.example.edushare.common.exception.ErrorCode;
import org.example.edushare.feature.auth.dto.request.PermissionRequest;
import org.example.edushare.feature.auth.dto.response.PermissionResponse;
import org.example.edushare.feature.auth.entity.Permission;
import org.example.edushare.feature.auth.repository.PermissionRepository;
import org.example.edushare.feature.auth.repository.RoleRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class PermissionService {
    private final PermissionRepository permissionRepository;
    private final RoleRepository roleRepository;

    @Transactional
    public PermissionResponse create(PermissionRequest request) {
        String name = normalizeName(request.name());
        if (permissionRepository.existsByNameIgnoreCase(name)) {
            throw new AppException(ErrorCode.PERMISSION_EXISTED);
        }

        Permission permission = Permission.builder()
                .name(name)
                .description(normalizeDescription(request.description()))
                .build();
        try {
            return toResponse(permissionRepository.saveAndFlush(permission));
        } catch (DataIntegrityViolationException exception) {
            throw new AppException(ErrorCode.PERMISSION_EXISTED);
        }
    }

    @Transactional(readOnly = true)
    public List<PermissionResponse> getAll() {
        return permissionRepository.findAll().stream()
                .sorted(Comparator.comparing(Permission::getName))
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public PermissionResponse getById(String id) {
        return toResponse(findById(id));
    }

    @Transactional
    public PermissionResponse update(String id, PermissionRequest request) {
        Permission permission = findById(id);
        String name = normalizeName(request.name());
        if (permissionRepository.existsByNameIgnoreCaseAndIdNot(name, id)) {
            throw new AppException(ErrorCode.PERMISSION_EXISTED);
        }

        permission.setName(name);
        permission.setDescription(normalizeDescription(request.description()));
        try {
            return toResponse(permissionRepository.saveAndFlush(permission));
        } catch (DataIntegrityViolationException exception) {
            throw new AppException(ErrorCode.PERMISSION_EXISTED);
        }
    }

    @Transactional
    public void delete(String id) {
        Permission permission = findById(id);
        roleRepository.findAllByPermissions_Id(id)
                .forEach(role -> role.getPermissions()
                        .removeIf(item -> item.getId().equals(id)));
        permissionRepository.delete(permission);
    }

    private Permission findById(String id) {
        return permissionRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.PERMISSION_NOT_FOUND));
    }

    private PermissionResponse toResponse(Permission permission) {
        return new PermissionResponse(
                permission.getId(),
                permission.getName(),
                permission.getDescription());
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
