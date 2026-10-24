package org.example.edushare.feature.auth.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.example.edushare.common.exception.ErrorCode;
import org.example.edushare.common.exception.AppException;
import org.example.edushare.common.response.ApiResponse;
import org.example.edushare.feature.auth.dto.request.GoogleLinkRequest;
import org.example.edushare.feature.auth.dto.request.GoogleLoginRequest;
import org.example.edushare.feature.auth.dto.request.LoginRequest;
import org.example.edushare.feature.auth.dto.request.RegisterRequest;
import org.example.edushare.feature.auth.dto.request.ResendOtpRequest;
import org.example.edushare.feature.auth.dto.request.VerifyEmailRequest;
import org.example.edushare.feature.auth.dto.response.AuthenticationResponse;
import org.example.edushare.feature.auth.dto.response.CsrfTokenResponse;
import org.example.edushare.feature.auth.dto.response.LoginResponse;
import org.example.edushare.feature.auth.dto.response.RegisterResponse;
import org.example.edushare.feature.auth.service.AccountLinkService;
import org.example.edushare.feature.auth.service.AuthenticationService;
import org.example.edushare.feature.auth.service.EmailVerificationService;
import org.example.edushare.feature.auth.service.GoogleAuthenticationService;
import org.example.edushare.feature.auth.service.JwtCookieService;
import org.example.edushare.feature.auth.service.TokenRevocationService;
import org.example.edushare.config.CookieBearerTokenResolver;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({"/auth", "/api/v1/auth"})
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class AuthenticationController {

    AuthenticationService authenticationService;
    EmailVerificationService emailVerificationService;
    GoogleAuthenticationService googleAuthenticationService;
    AccountLinkService accountLinkService;
    JwtCookieService jwtCookieService;
    TokenRevocationService tokenRevocationService;
    CookieBearerTokenResolver bearerTokenResolver;


    @PostMapping("/token")
    ApiResponse<LoginResponse> authenticate(
            @Valid @RequestBody LoginRequest request,
            HttpServletResponse response) {
        var result = authenticationService.authenticate(request);
        jwtCookieService.addAccessTokenCookie(response, result.getToken());
        return ApiResponse.<LoginResponse>builder().result(result).build();
    }

    @PostMapping("/register")
    public ApiResponse<RegisterResponse> register(@Valid @RequestBody RegisterRequest request) {
        var result = authenticationService.register(request);
        return ApiResponse.<RegisterResponse>builder()
                .result(result)
                .build();

    }

    @PostMapping("/verify-email")
    public ApiResponse<Void> verifyEmail(@Valid @RequestBody VerifyEmailRequest request) {
        emailVerificationService.verifyEmail(request);
        return ApiResponse.<Void>builder()
                .message("Email verified successfully")
                .build();
    }

    @PostMapping("/resend-otp")
    public ApiResponse<Void> resendOtp(@Valid @RequestBody ResendOtpRequest request) {
        emailVerificationService.resendOtp(request.getEmail());
        return ApiResponse.<Void>builder()
                .message("A new verification code has been sent")
                .build();
    }



    @PostMapping("/google")
    public ApiResponse<AuthenticationResponse> authenticateWithGoogle(
            @Valid @RequestBody GoogleLoginRequest request,
            HttpServletResponse response) {
        AuthenticationResponse result = googleAuthenticationService.authenticate(request.idToken());
        if (result.isAccountLinkRequired()) {
            return ApiResponse.<AuthenticationResponse>builder()
                    .code(ErrorCode.ACCOUNT_LINK_REQUIRED.getCode())
                    .message(ErrorCode.ACCOUNT_LINK_REQUIRED.getMessage())
                    .result(result)
                    .build();
        }
        jwtCookieService.addAccessTokenCookie(response, result.getToken());
        return ApiResponse.<AuthenticationResponse>builder().result(result).build();
    }

    @PostMapping("/google/link")
    public ApiResponse<AuthenticationResponse> linkGoogleAccount(
            @Valid @RequestBody GoogleLinkRequest request,
            HttpServletResponse response) {
        AuthenticationResponse result = accountLinkService.linkGoogle(request);
        jwtCookieService.addAccessTokenCookie(response, result.getToken());
        return ApiResponse.<AuthenticationResponse>builder()
                .result(result)
                .build();
    }

    @GetMapping("/csrf")
    public ApiResponse<CsrfTokenResponse> csrf(CsrfToken csrfToken) {
        return ApiResponse.<CsrfTokenResponse>builder()
                .result(new CsrfTokenResponse(csrfToken.getToken(), csrfToken.getHeaderName()))
                .build();
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout(HttpServletRequest request, HttpServletResponse response) {
        try {
            String token = bearerTokenResolver.resolveForLogout(request);
            if (StringUtils.hasText(token)) {
                tokenRevocationService.revokeToken(token);
            }
        } catch (AppException | OAuth2AuthenticationException ignored) {
            // Logout is intentionally idempotent for malformed or expired tokens. The
            // cookie is still removed below, but no blacklist entry is created from an
            // unverified token. Persistence failures are not swallowed.
        }
        jwtCookieService.clearAccessTokenCookie(response);
        return ApiResponse.<Void>builder().message("Logged out successfully").build();
    }

//    @PostMapping("/token")
//    ApiResponse<AuthenticationResponse> authenticate(@RequestBody AuthenticationRequest request) {
//        var result = authenticationService.authenticate(request);
//        return ApiResponse.<AuthenticationResponse>builder().result(result).build();
//    }
//
//    @PostMapping("/introspect")
//    ApiResponse<IntrospectResponse> authenticate(@RequestBody IntrospectRequest request)
//            throws ParseException, JOSEException {
//        var result = authenticationService.introspect(request);
//        return ApiResponse.<IntrospectResponse>builder().result(result).build();
//    }
//
//    @PostMapping("/logout")
//    ApiResponse<IntrospectResponse> logout(@RequestBody LogoutRequest request) throws ParseException, JOSEException {
//        authenticationService.logout(request);
//        return ApiResponse.<IntrospectResponse>builder().build();
//    }
//
//    @PostMapping("/refresh")
//    ApiResponse<AuthenticationResponse> authenticate(@RequestBody RefreshRequest request)
//            throws ParseException, JOSEException {
//        var result = authenticationService.refreshToken(request);
//        return ApiResponse.<AuthenticationResponse>builder().result(result).build();
//    }
}
