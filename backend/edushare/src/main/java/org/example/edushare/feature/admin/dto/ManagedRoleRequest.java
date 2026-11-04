package org.example.edushare.feature.admin.dto;

import jakarta.validation.constraints.*;

public record ManagedRoleRequest(
        @NotBlank @Pattern(regexp = "[A-Z][A-Z0-9_]{1,99}") String code,
        @NotBlank @Size(max = 100) String displayName,
        @Size(max = 500) String description,
        boolean active) {}
