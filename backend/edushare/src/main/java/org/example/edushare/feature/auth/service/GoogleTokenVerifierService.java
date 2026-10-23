package org.example.edushare.feature.auth.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import lombok.RequiredArgsConstructor;
import org.example.edushare.common.exception.AppException;
import org.example.edushare.common.exception.ErrorCode;
import org.example.edushare.feature.auth.config.GoogleAuthProperties;
import org.example.edushare.feature.auth.dto.response.GoogleUserInfo;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.text.ParseException;
import java.util.Date;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class GoogleTokenVerifierService {
    private final GoogleIdTokenVerifier googleIdTokenVerifier;
    private final GoogleAuthProperties properties;

    public GoogleUserInfo verify(String rawIdToken) {
        if (!StringUtils.hasText(properties.getClientId())) {
            throw new AppException(ErrorCode.GOOGLE_AUTH_NOT_CONFIGURED);
        }

        GoogleIdToken idToken;
        try {
            idToken = googleIdTokenVerifier.verify(rawIdToken);
        } catch (IOException exception) {
            throw new AppException(ErrorCode.GOOGLE_VERIFICATION_UNAVAILABLE);
        } catch (GeneralSecurityException | IllegalArgumentException exception) {
            throw new AppException(ErrorCode.GOOGLE_TOKEN_INVALID);
        }

        if (idToken == null) {
            throw classifyInvalidToken(rawIdToken);
        }

        GoogleIdToken.Payload payload = idToken.getPayload();
        String subject = payload.getSubject();
        String email = payload.getEmail();
        if (!StringUtils.hasText(subject) || !StringUtils.hasText(email)) {
            throw new AppException(ErrorCode.GOOGLE_TOKEN_INVALID);
        }
        if (!Boolean.TRUE.equals(payload.getEmailVerified())) {
            throw new AppException(ErrorCode.GOOGLE_EMAIL_NOT_VERIFIED);
        }

        return new GoogleUserInfo(
                subject,
                email.trim().toLowerCase(Locale.ROOT),
                stringClaim(payload, "name"),
                stringClaim(payload, "picture"),
                true);
    }

    private AppException classifyInvalidToken(String rawIdToken) {
        try {
            JWTClaimsSet claims = SignedJWT.parse(rawIdToken).getJWTClaimsSet();
            Date expirationTime = claims.getExpirationTime();
            if (expirationTime != null && !expirationTime.after(new Date())) {
                return new AppException(ErrorCode.GOOGLE_TOKEN_EXPIRED);
            }
            if (!claims.getAudience().contains(properties.getClientId())) {
                return new AppException(ErrorCode.GOOGLE_TOKEN_AUDIENCE_INVALID);
            }
        } catch (ParseException ignored) {
            // The token is malformed and is handled by the generic invalid-token error below.
        }
        return new AppException(ErrorCode.GOOGLE_TOKEN_INVALID);
    }

    private String stringClaim(GoogleIdToken.Payload payload, String name) {
        Object value = payload.get(name);
        return value instanceof String text && StringUtils.hasText(text) ? text.trim() : null;
    }
}
