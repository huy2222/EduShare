package org.example.edushare.config;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.example.edushare.feature.auth.service.JwtCookieService;
import org.springframework.http.HttpMethod;
import org.springframework.security.oauth2.server.resource.web.BearerTokenResolver;
import org.springframework.security.oauth2.server.resource.web.DefaultBearerTokenResolver;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class CookieBearerTokenResolver implements BearerTokenResolver {
    private final JwtCookieService jwtCookieService;
    private final DefaultBearerTokenResolver headerResolver = new DefaultBearerTokenResolver();

    @Override
    public String resolve(HttpServletRequest request) {
        // Logout performs signature validation and idempotent revocation itself. Skipping
        // resource-server authentication here also lets an already-revoked token logout again.
        if (isLogout(request)) {
            return null;
        }
        return resolveForLogout(request);
    }

    public String resolveForLogout(HttpServletRequest request) {
        return jwtCookieService.extractAccessToken(request)
                .orElseGet(() -> headerResolver.resolve(request));
    }

    private boolean isLogout(HttpServletRequest request) {
        if (!HttpMethod.POST.matches(request.getMethod())) {
            return false;
        }
        String uri = request.getRequestURI();
        return uri.endsWith("/auth/logout");
    }
}
