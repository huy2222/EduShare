package org.example.edushare.feature.auth.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.edushare.common.response.ApiResponse;
import org.example.edushare.feature.auth.dto.request.RoleRequest;
import org.example.edushare.feature.auth.dto.response.RoleResponse;
import org.example.edushare.feature.auth.service.RoleService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/roles")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class RoleController {
    private final RoleService roleService;

    @PostMapping
    public ApiResponse<RoleResponse> create(@Valid @RequestBody RoleRequest request) {
        return ApiResponse.<RoleResponse>builder()
                .result(roleService.create(request))
                .build();
    }

    @GetMapping
    public ApiResponse<List<RoleResponse>> getAll() {
        return ApiResponse.<List<RoleResponse>>builder()
                .result(roleService.getAll())
                .build();
    }

    @GetMapping("/{id}")
    public ApiResponse<RoleResponse> getById(@PathVariable String id) {
        return ApiResponse.<RoleResponse>builder()
                .result(roleService.getById(id))
                .build();
    }

    @PutMapping("/{id}")
    public ApiResponse<RoleResponse> update(
            @PathVariable String id,
            @Valid @RequestBody RoleRequest request) {
        return ApiResponse.<RoleResponse>builder()
                .result(roleService.update(id, request))
                .build();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable String id) {
        roleService.delete(id);
        return ApiResponse.<Void>builder()
                .message("Role deleted successfully")
                .build();
    }

    @PostMapping("/{roleId}/permissions/{permissionId}")
    public ApiResponse<RoleResponse> addPermission(
            @PathVariable String roleId,
            @PathVariable String permissionId) {
        return ApiResponse.<RoleResponse>builder()
                .result(roleService.addPermission(roleId, permissionId))
                .build();
    }

    @DeleteMapping("/{roleId}/permissions/{permissionId}")
    public ApiResponse<RoleResponse> removePermission(
            @PathVariable String roleId,
            @PathVariable String permissionId) {
        return ApiResponse.<RoleResponse>builder()
                .result(roleService.removePermission(roleId, permissionId))
                .build();
    }
}
