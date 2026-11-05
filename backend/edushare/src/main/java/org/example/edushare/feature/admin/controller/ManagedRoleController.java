package org.example.edushare.feature.admin.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.example.edushare.common.response.ApiResponse;
import org.example.edushare.feature.admin.dto.*;
import org.example.edushare.feature.admin.service.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/v1/admin/access")
@RequiredArgsConstructor
@PreAuthorize("@adminAuthorization.has('ACCESS_ROLE_VIEW', 'ACCESS_ROLE_CREATE', 'ACCESS_ROLE_UPDATE', 'ACCESS_ROLE_DELETE', 'PERMISSION_MANAGE')")
public class ManagedRoleController {
    private final ManagedRoleService service;
    @GetMapping("/roles") public ApiResponse<AdminPageResponse<ManagedRoleRow>> roles(@RequestParam(defaultValue = "") String search, @RequestParam(defaultValue = "0") int page) {
        return ApiResponse.<AdminPageResponse<ManagedRoleRow>>builder().result(service.search(search, page)).build();
    }
    @GetMapping("/permissions") public ApiResponse<List<PermissionCatalog.Item>> permissions() {
        return ApiResponse.<List<PermissionCatalog.Item>>builder().result(PermissionCatalog.ITEMS).build();
    }
    @GetMapping("/roles/{id}") public ApiResponse<ManagedRoleService.Detail> detail(@PathVariable String id) {
        return ApiResponse.<ManagedRoleService.Detail>builder().result(service.detail(id)).build();
    }
    @PostMapping("/roles") public ApiResponse<ManagedRoleService.Detail> create(@Valid @RequestBody ManagedRoleRequest request) {
        return ApiResponse.<ManagedRoleService.Detail>builder().result(service.save(null, request)).build();
    }
    @PutMapping("/roles/{id}") public ApiResponse<ManagedRoleService.Detail> update(@PathVariable String id, @Valid @RequestBody ManagedRoleRequest request) {
        return ApiResponse.<ManagedRoleService.Detail>builder().result(service.save(id, request)).build();
    }
    public record PermissionsRequest(@NotNull Set<String> permissions) {}
    @PutMapping("/roles/{id}/permissions") public ApiResponse<ManagedRoleService.Detail> configure(@PathVariable String id, @Valid @RequestBody PermissionsRequest request) {
        return ApiResponse.<ManagedRoleService.Detail>builder().result(service.configure(id, request.permissions())).build();
    }
    @DeleteMapping("/roles/{id}") public ApiResponse<Void> delete(@PathVariable String id) {
        service.delete(id); return ApiResponse.<Void>builder().build();
    }
}
