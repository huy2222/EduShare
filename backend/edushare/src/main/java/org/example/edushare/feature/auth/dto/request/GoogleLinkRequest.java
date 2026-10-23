package org.example.edushare.feature.auth.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record GoogleLinkRequest(
        @NotBlank(message = "Account link token is required") String linkToken,
        @NotBlank(message = "Password is required")
        @Size(max = 72, message = "Password must not exceed 72 characters")
        String password) {
}
