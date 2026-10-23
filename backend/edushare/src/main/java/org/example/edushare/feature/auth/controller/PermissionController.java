package org.example.edushare.feature.auth.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.edushare.common.response.ApiResponse;
import org.example.edushare.feature.auth.dto.request.PermissionRequest;
import org.example.edushare.feature.auth.dto.response.PermissionResponse;
import org.example.edushare.feature.auth.service.PermissionService;
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
@RequestMapping("/permissions")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class PermissionController {
    private final PermissionService permissionService;

    @PostMapping
    public ApiResponse<PermissionResponse> create(@Valid @RequestBody PermissionRequest request) {
        return ApiResponse.<PermissionResponse>builder()
                .result(permissionService.create(request))
                .build();
    }

    @GetMapping
    public ApiResponse<List<PermissionResponse>> getAll() {
        return ApiResponse.<List<PermissionResponse>>builder()
                .result(permissionService.getAll())
                .build();
    }

    @GetMapping("/{id}")
    public ApiResponse<PermissionResponse> getById(@PathVariable String id) {
        return ApiResponse.<PermissionResponse>builder()
                .result(permissionService.getById(id))
                .build();
    }

    @PutMapping("/{id}")
    public ApiResponse<PermissionResponse> update(
            @PathVariable String id,
            @Valid @RequestBody PermissionRequest request) {
        return ApiResponse.<PermissionResponse>builder()
                .result(permissionService.update(id, request))
                .build();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable String id) {
        permissionService.delete(id);
        return ApiResponse.<Void>builder()
                .message("Permission deleted successfully")
                .build();
    }
}
