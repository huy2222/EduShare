package org.example.edushare.feature.auth.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import org.example.edushare.common.exception.AppException;
import org.example.edushare.common.exception.ErrorCode;
import org.example.edushare.feature.auth.config.GoogleAuthProperties;
import org.example.edushare.feature.auth.dto.response.GoogleUserInfo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Date;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GoogleTokenVerifierServiceTest {
    private static final String CLIENT_ID = "google-test-client.apps.googleusercontent.com";
    private static final String SIGNING_SECRET = "test-google-token-signing-secret-that-is-at-least-sixty-four-bytes-long";

    @Mock
    private GoogleIdTokenVerifier verifier;

    private GoogleTokenVerifierService service;

    @BeforeEach
    void setUp() {
        GoogleAuthProperties properties = new GoogleAuthProperties();
        properties.setClientId(CLIENT_ID);
        service = new GoogleTokenVerifierService(verifier, properties);
    }

    @Test
    void rejectsMalformedToken() throws Exception {
        when(verifier.verify("malformed")).thenReturn(null);

        assertError("malformed", ErrorCode.GOOGLE_TOKEN_INVALID);
    }

    @Test
    void rejectsExpiredToken() throws Exception {
        String token = token(List.of(CLIENT_ID), Instant.now().minusSeconds(30));
        when(verifier.verify(token)).thenReturn(null);

        assertError(token, ErrorCode.GOOGLE_TOKEN_EXPIRED);
    }

    @Test
    void rejectsWrongAudience() throws Exception {
        String token = token(List.of("another-client"), Instant.now().plusSeconds(300));
        when(verifier.verify(token)).thenReturn(null);

        assertError(token, ErrorCode.GOOGLE_TOKEN_AUDIENCE_INVALID);
    }

    @Test
    void rejectsUnverifiedEmail() throws Exception {
        GoogleIdToken idToken = googleToken(false);
        when(verifier.verify("token")).thenReturn(idToken);

        assertError("token", ErrorCode.GOOGLE_EMAIL_NOT_VERIFIED);
    }

    @Test
    void returnsOnlyClaimsFromVerifiedGoogleToken() throws Exception {
        GoogleIdToken idToken = googleToken(true);
        when(verifier.verify("token")).thenReturn(idToken);

        GoogleUserInfo result = service.verify("token");

        assertThat(result.sub()).isEqualTo("google-sub-1");
        assertThat(result.email()).isEqualTo("student@example.com");
        assertThat(result.fullName()).isEqualTo("Student Name");
        assertThat(result.picture()).isEqualTo("https://example.com/avatar.png");
        assertThat(result.emailVerified()).isTrue();
    }

    private GoogleIdToken googleToken(boolean emailVerified) {
        GoogleIdToken.Payload payload = new GoogleIdToken.Payload();
        payload.setSubject("google-sub-1");
        payload.setEmail("Student@Example.com");
        payload.setEmailVerified(emailVerified);
        payload.set("name", "Student Name");
        payload.set("picture", "https://example.com/avatar.png");
        GoogleIdToken idToken = mock(GoogleIdToken.class);
        when(idToken.getPayload()).thenReturn(payload);
        return idToken;
    }

    private String token(List<String> audience, Instant expiration) throws Exception {
        SignedJWT token = new SignedJWT(
                new JWSHeader(JWSAlgorithm.HS512),
                new JWTClaimsSet.Builder()
                        .audience(audience)
                        .expirationTime(Date.from(expiration))
                        .build());
        token.sign(new MACSigner(SIGNING_SECRET.getBytes()));
        return token.serialize();
    }

    private void assertError(String token, ErrorCode errorCode) {
        assertThatThrownBy(() -> service.verify(token))
                .isInstanceOfSatisfying(AppException.class,
                        exception -> assertThat(exception.getErrorCode()).isEqualTo(errorCode));
    }
}
