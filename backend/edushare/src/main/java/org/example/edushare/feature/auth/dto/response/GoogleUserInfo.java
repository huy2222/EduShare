package org.example.edushare.feature.auth.dto.response;

public record GoogleUserInfo(
        String sub,
        String email,
        String fullName,
        String picture,
        boolean emailVerified) {
}
