package org.example.edushare.feature.admin.dto;

import java.util.List;

public record CatalogDetailResponse(String id, String code, String name, String description,
        String facultyId, String facultyName, Integer credits, List<CatalogRowResponse> majors) {}
