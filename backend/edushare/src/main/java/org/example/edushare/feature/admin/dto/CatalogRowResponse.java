package org.example.edushare.feature.admin.dto;

public record CatalogRowResponse(String id, String code, String name, String description,
        String facultyId, String facultyName, Integer credits, Long majorCount) {}
