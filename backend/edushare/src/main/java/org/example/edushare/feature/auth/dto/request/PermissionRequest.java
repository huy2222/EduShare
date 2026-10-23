package org.example.edushare.feature.auth.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PermissionRequest(
        @NotBlank(message = "Permission name is required")
        @Size(max = 100, message = "Permission name must not exceed 100 characters")
        String name,

        @Size(max = 500, message = "Permission description must not exceed 500 characters")
        String description
) {
}
