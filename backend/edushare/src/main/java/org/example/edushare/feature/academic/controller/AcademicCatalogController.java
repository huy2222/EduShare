package org.example.edushare.feature.academic.controller;

import lombok.RequiredArgsConstructor;
import org.example.edushare.common.response.ApiResponse;
import org.example.edushare.feature.academic.dto.FacultyOptionResponse;
import org.example.edushare.feature.academic.service.AcademicCatalogService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/academic")
@RequiredArgsConstructor
public class AcademicCatalogController {

    private final AcademicCatalogService academicCatalogService;

    @GetMapping("/faculties")
    public ApiResponse<List<FacultyOptionResponse>> getFaculties() {
        return ApiResponse.<List<FacultyOptionResponse>>builder()
                .result(academicCatalogService.getFaculties())
                .build();
    }
}
