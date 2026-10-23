package org.example.edushare.feature.auth.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RoleRequest(
        @NotBlank(message = "Role name is required")
        @Size(max = 100, message = "Role name must not exceed 100 characters")
        String name,

        @Size(max = 500, message = "Role description must not exceed 500 characters")
        String description
) {
}
