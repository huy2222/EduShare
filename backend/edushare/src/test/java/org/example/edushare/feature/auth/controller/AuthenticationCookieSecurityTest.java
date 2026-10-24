package org.example.edushare.feature.auth.controller;

import org.example.edushare.config.CustomJwtDecoder;
import org.example.edushare.feature.auth.dto.response.AuthenticationResponse;
import org.example.edushare.feature.auth.dto.response.LoginResponse;
import org.example.edushare.feature.auth.service.AccountLinkService;
import org.example.edushare.feature.auth.service.AuthenticationService;
import org.example.edushare.feature.auth.service.EmailVerificationService;
import org.example.edushare.feature.auth.service.GoogleAuthenticationService;
import org.example.edushare.feature.auth.service.JwtService;
import org.example.edushare.feature.auth.service.TokenRevocationService;
import org.example.edushare.feature.user.controller.UserController;
import org.example.edushare.feature.user.dto.response.UserResponse;
import org.example.edushare.feature.user.service.UserService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.context.WebApplicationContext;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.setup.MockMvcBuilders.webAppContextSetup;

@SpringBootTest(properties = {
        "app.security.cookie.name=access_token",
        "app.security.cookie.secure=true",
        "app.security.cookie.same-site=Lax",
        "app.security.cookie.path=/",
        "app.security.cors.allowed-origins[0]=http://localhost:5173"
})
class AuthenticationCookieSecurityTest {
    private MockMvc mockMvc;
    @Autowired
    private WebApplicationContext applicationContext;

    @MockitoBean
    private AuthenticationService authenticationService;
    @MockitoBean
    private EmailVerificationService emailVerificationService;
    @MockitoBean
    private GoogleAuthenticationService googleAuthenticationService;
    @MockitoBean
    private AccountLinkService accountLinkService;
    @MockitoBean
    private TokenRevocationService tokenRevocationService;
    @MockitoBean
    private JwtService jwtService;
    @MockitoBean
    private CustomJwtDecoder customJwtDecoder;
    @MockitoBean
    private UserService userService;

    @BeforeEach
    void setUpMockMvc() {
        mockMvc = webAppContextSetup(applicationContext).apply(springSecurity()).build();
    }

    @Test
    void passwordLoginReturnsSecureHttpOnlyCookieWithoutJwtInJson() throws Exception {
        when(authenticationService.authenticate(org.mockito.ArgumentMatchers.any()))
                .thenReturn(LoginResponse.builder().token("signed.jwt.value").authenticated(true).build());
        when(jwtService.remainingValidity("signed.jwt.value")).thenReturn(Duration.ofSeconds(3600));

        mockMvc.perform(post("/api/v1/auth/token")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"student@example.com\",\"password\":\"Password123\"}"))
                .andExpect(status().isOk())
                .andExpect(header().string("Set-Cookie", containsString("access_token=signed.jwt.value")))
                .andExpect(header().string("Set-Cookie", containsString("Max-Age=3600")))
                .andExpect(header().string("Set-Cookie", containsString("Secure")))
                .andExpect(header().string("Set-Cookie", containsString("HttpOnly")))
                .andExpect(header().string("Set-Cookie", containsString("SameSite=Lax")))
                .andExpect(jsonPath("$.result.authenticated").value(true))
                .andExpect(jsonPath("$.result.token").doesNotExist());
    }

    @Test
    void googleLoginSetsCookieButLinkConfirmationDoesNotIssueJwtEarly() throws Exception {
        when(googleAuthenticationService.authenticate("google-token"))
                .thenReturn(AuthenticationResponse.authenticated("google-jwt"));
        when(jwtService.remainingValidity("google-jwt")).thenReturn(Duration.ofSeconds(3600));

        mockMvc.perform(post("/api/v1/auth/google")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"idToken\":\"google-token\"}"))
                .andExpect(status().isOk())
                .andExpect(header().string("Set-Cookie", containsString("access_token=google-jwt")))
                .andExpect(jsonPath("$.result.token").doesNotExist());

        when(googleAuthenticationService.authenticate("needs-link"))
                .thenReturn(AuthenticationResponse.linkRequired("short-link-token"));

        mockMvc.perform(post("/api/v1/auth/google")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"idToken\":\"needs-link\"}"))
                .andExpect(status().isOk())
                .andExpect(header().doesNotExist("Set-Cookie"))
                .andExpect(jsonPath("$.result.linkToken").value("short-link-token"));
    }

    @Test
    void logoutRequiresCsrfRevokesTokenAndExpiresCookie() throws Exception {
        mockMvc.perform(post("/api/v1/auth/logout")
                        .cookie(new jakarta.servlet.http.Cookie("access_token", "jwt-to-revoke")))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/v1/auth/logout")
                        .with(csrf())
                        .cookie(new jakarta.servlet.http.Cookie("access_token", "jwt-to-revoke")))
                .andExpect(status().isOk())
                .andExpect(header().string("Set-Cookie", containsString("Max-Age=0")));

        verify(tokenRevocationService).revokeToken("jwt-to-revoke");
    }

    @Test
    void validCookieAuthenticatesProtectedEndpointAndCookieWinsOverBearer() throws Exception {
        when(customJwtDecoder.decode("cookie-jwt")).thenReturn(jwt("cookie-jwt"));
        when(userService.getMyInfo()).thenReturn(UserResponse.builder()
                .id("user-1").email("student@example.com").build());

        mockMvc.perform(get("/api/v1/users/me")
                        .cookie(new jakarta.servlet.http.Cookie("access_token", "cookie-jwt"))
                        .header("Authorization", "Bearer different-header-jwt"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.email").value("student@example.com"));
    }

    @Test
    void missingExpiredOrBadSignatureTokenGetsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/v1/users/me"))
                .andExpect(status().isUnauthorized());

        when(customJwtDecoder.decode("expired-jwt")).thenThrow(new JwtException("expired"));
        mockMvc.perform(get("/api/v1/users/me")
                        .cookie(new jakarta.servlet.http.Cookie("access_token", "expired-jwt")))
                .andExpect(status().isUnauthorized());

        when(customJwtDecoder.decode("bad-signature")).thenThrow(new JwtException("bad signature"));
        mockMvc.perform(get("/api/v1/users/me")
                        .cookie(new jakarta.servlet.http.Cookie("access_token", "bad-signature")))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void csrfBootstrapIsPublicAndCorsAllowsConfiguredCredentialedOrigin() throws Exception {
        mockMvc.perform(get("/api/v1/auth/csrf"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.token").isNotEmpty())
                .andExpect(jsonPath("$.result.headerName").value("X-XSRF-TOKEN"));

        mockMvc.perform(options("/api/v1/users/me")
                        .header("Origin", "http://localhost:5173")
                        .header("Access-Control-Request-Method", "GET"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"))
                .andExpect(header().string("Access-Control-Allow-Credentials", "true"));
    }

    private Jwt jwt(String value) {
        Instant now = Instant.now();
        return new Jwt(value, now, now.plusSeconds(3600),
                Map.of("alg", "HS512"),
                Map.of("sub", "student@example.com", "scope", "ROLE_USER"));
    }
}
