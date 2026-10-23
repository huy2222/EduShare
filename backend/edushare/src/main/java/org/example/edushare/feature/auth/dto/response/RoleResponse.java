package org.example.edushare.feature.auth.dto.response;

import java.util.List;

public record RoleResponse(
        String id,
        String name,
        String description,
        List<PermissionResponse> permissions
) {
}
