package org.example.edushare.feature.admin.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.edushare.common.response.ApiResponse;
import org.example.edushare.feature.admin.dto.*;
import org.example.edushare.feature.admin.service.AdminService;
import org.example.edushare.feature.user.entity.UserStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class AdminController {
    private final AdminService service;
    @GetMapping("/majors")
    public ApiResponse<?> majors() { return response(service.majors()); }

    @PostMapping("/majors")
    public ApiResponse<?> createMajor(@Valid @RequestBody CatalogRequest request) {
        service.saveMajor(null, request);
        return response(null);
    }

    @PutMapping("/majors/{id}")
    public ApiResponse<?> updateMajor(@PathVariable String id, @Valid @RequestBody CatalogRequest request) {
        service.saveMajor(id, request);
        return response(null);
    }

    @DeleteMapping("/majors/{id}")
    public ApiResponse<?> deleteMajor(@PathVariable String id) {
        service.deleteMajor(id);
        return response(null);
    }
    private ApiResponse<Object> response(Object result) { return ApiResponse.builder().result(result).build(); }

    @GetMapping("/overview") public ApiResponse<?> overview() { return response(service.overview()); }
    @GetMapping("/roles") public ApiResponse<?> roles() { return response(service.roles()); }
    @GetMapping("/users") public ApiResponse<?> users(@RequestParam(defaultValue = "") String search,
            @RequestParam(defaultValue = "") String role, @RequestParam(required = false) UserStatus status,
            @RequestParam(defaultValue = "0") int page) { return response(service.users(search, role, status, page)); }
    @PutMapping("/users/{id}") public ApiResponse<?> updateUser(@PathVariable String id, @Valid @RequestBody UserAccessRequest request) {
        return response(service.updateUser(id, request));
    }
    @GetMapping("/faculties") public ApiResponse<?> faculties() { return response(service.faculties()); }
    @PostMapping("/faculties") public ApiResponse<?> createFaculty(@Valid @RequestBody CatalogRequest request) { service.saveFaculty(null, request); return response(null); }
    @PutMapping("/faculties/{id}") public ApiResponse<?> updateFaculty(@PathVariable String id, @Valid @RequestBody CatalogRequest request) { service.saveFaculty(id, request); return response(null); }
    @DeleteMapping("/faculties/{id}") public ApiResponse<?> deleteFaculty(@PathVariable String id) { service.deleteFaculty(id); return response(null); }
    @GetMapping("/subjects") public ApiResponse<?> subjects() { return response(service.subjects()); }
    @PostMapping("/subjects") public ApiResponse<?> createSubject(@Valid @RequestBody CatalogRequest request) { service.saveSubject(null, request); return response(null); }
    @PutMapping("/subjects/{id}") public ApiResponse<?> updateSubject(@PathVariable String id, @Valid @RequestBody CatalogRequest request) { service.saveSubject(id, request); return response(null); }
    @DeleteMapping("/subjects/{id}") public ApiResponse<?> deleteSubject(@PathVariable String id) { service.deleteSubject(id); return response(null); }
}
