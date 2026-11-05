package org.example.edushare.feature.admin.dto;

import jakarta.validation.constraints.*;
import java.util.Set;

public record CatalogRequest(
        @NotBlank @Size(max = 50) String code,
        @NotBlank @Size(max = 200) String name,
        @Size(max = 1000) String description,
        String facultyId,
        @Min(1) @Max(30) Integer credits,
        Set<String> majorIds) {}
