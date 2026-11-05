package org.example.edushare.feature.admin.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.edushare.feature.admin.dto.*;
import org.example.edushare.feature.auth.entity.*;
import org.example.edushare.feature.auth.repository.*;
import org.example.edushare.feature.user.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
@Transactional(readOnly = true)
@PreAuthorize("@adminAuthorization.has('ACCESS_ROLE_VIEW', 'ACCESS_ROLE_CREATE', 'ACCESS_ROLE_UPDATE', 'ACCESS_ROLE_DELETE', 'PERMISSION_MANAGE')")
public class ManagedRoleService {
    private final RoleRepository roles;
    private final PermissionRepository permissions;
    private final UserRepository users;

    public AdminPageResponse<ManagedRoleRow> search(String search, int page) {
        if (page < 0 || page > 1000000 || search.length() > 100) throw conflict("Tham số tìm kiếm không hợp lệ.");
        return AdminPageResponse.from(roles.searchManaged("%" + search.trim().toLowerCase(Locale.ROOT) + "%", PageRequest.of(page, 10)));
    }

    public record Detail(String id, String code, String displayName, String description, boolean active, Set<String> permissions) {}
    public Detail detail(String id) {
        Role role = find(id);
        return new Detail(role.getId(), role.getName(), role.getDisplayName(), role.getDescription(), role.isActive(),
                role.getName().equals("ADMIN") ? PermissionCatalog.availableCodes()
                        : role.getPermissions().stream().map(Permission::getName).collect(Collectors.toSet()));
    }

    @Transactional
    @PreAuthorize("@adminAuthorization.has(#id == null ? 'ACCESS_ROLE_CREATE' : 'ACCESS_ROLE_UPDATE')")
    public Detail save(String id, ManagedRoleRequest request) {
        Role role = id == null ? new Role() : find(id);
        if (id != null) {
            protect(role);
            if (!role.getName().equals(request.code())) throw conflict("Không thể thay đổi mã vai trò.");
        }
        if (roles.existsByNameIgnoreCaseAndIdNot(request.code(), id == null ? "" : id)) throw conflict("Mã vai trò đã tồn tại.");
        role.setName(request.code()); role.setDisplayName(request.displayName().trim());
        role.setDescription(request.description() == null ? null : request.description().trim()); role.setActive(request.active());
        roles.saveAndFlush(role);
        audit("SAVE_ROLE", role);
        return detail(role.getId());
    }

    @Transactional
    @PreAuthorize("@adminAuthorization.has('PERMISSION_MANAGE')")
    public Detail configure(String id, Set<String> codes) {
        Role role = find(id);
        if (role.getName().equals("ADMIN")) throw conflict("Không thể sửa quyền ADMIN.");
        Set<String> allowed = PermissionCatalog.ITEMS.stream().map(PermissionCatalog.Item::code).collect(Collectors.toSet());
        // Existing permissions outside this UI's catalogue are retained, never silently removed.
        Set<String> existing = role.getPermissions().stream().map(Permission::getName).collect(Collectors.toSet());
        if (codes.stream().anyMatch(code -> !allowed.contains(code) && !existing.contains(code))) throw conflict("Danh sách quyền không hợp lệ.");
        Set<Permission> selected = codes.isEmpty() ? new HashSet<>() : new HashSet<>(permissions.findAllByNameIn(codes));
        if (selected.size() != codes.size()) throw conflict("Danh mục quyền chưa sẵn sàng. Vui lòng khởi động lại backend.");
        role.setPermissions(selected);
        roles.flush(); audit("CONFIGURE_PERMISSIONS", role);
        return detail(id);
    }

    @Transactional
    @PreAuthorize("@adminAuthorization.has('ACCESS_ROLE_DELETE')")
    public void delete(String id) {
        Role role = find(id); protect(role);
        if (users.existsByRoles_Id(id)) throw conflict("Vai trò đang được gán cho người dùng. Hãy gỡ vai trò trước khi xoá.");
        roles.delete(role); roles.flush(); audit("DELETE_ROLE", role);
    }

    private Role find(String id) { return roles.findWithPermissions(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Vai trò không tồn tại.")); }
    private void protect(Role role) {
        if (Set.of("ADMIN", "USER").contains(role.getName())) throw conflict("Vai trò hệ thống được bảo vệ và không thể chỉnh sửa.");
    }
    private ResponseStatusException conflict(String message) { return new ResponseStatusException(HttpStatus.CONFLICT, message); }
    private void audit(String action, Role role) {
        log.info("Authorization change: action={}, actor={}, roleId={}, code={}", action,
                SecurityContextHolder.getContext().getAuthentication().getName(), role.getId(), role.getName());
    }
}
