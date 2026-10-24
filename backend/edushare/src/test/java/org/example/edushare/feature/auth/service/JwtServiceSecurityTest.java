package org.example.edushare.feature.auth.service;

import com.nimbusds.jwt.SignedJWT;
import org.example.edushare.common.exception.AppException;
import org.example.edushare.feature.user.entity.User;
import org.example.edushare.feature.user.entity.UserStatus;
import org.junit.jupiter.api.Test;

import java.text.ParseException;
import java.util.HashSet;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtServiceSecurityTest {
    private static final String SECRET = "edushare-test-jwt-secret-that-is-at-least-sixty-four-bytes-long!";

    @Test
    void eachLoginGetsANewJwtId() throws ParseException {
        JwtService service = new JwtService(SECRET, 3600, "edushare-test");
        User user = activeUser();

        String first = service.generateToken(user);
        String second = service.generateToken(user);

        assertThat(SignedJWT.parse(first).getJWTClaimsSet().getJWTID())
                .isNotEqualTo(SignedJWT.parse(second).getJWTClaimsSet().getJWTID());
    }

    @Test
    void rejectsExpiredAndTamperedTokens() {
        JwtService validIssuer = new JwtService(SECRET, 3600, "edushare-test");
        String validToken = validIssuer.generateToken(activeUser());
        String tampered = validToken.substring(0, validToken.length() - 1)
                + (validToken.endsWith("a") ? "b" : "a");
        JwtService expiredIssuer = new JwtService(SECRET, -1, "edushare-test");
        String expiredToken = expiredIssuer.generateToken(activeUser());

        assertThatThrownBy(() -> validIssuer.verifyToken(tampered)).isInstanceOf(AppException.class);
        assertThatThrownBy(() -> expiredIssuer.verifyToken(expiredToken)).isInstanceOf(AppException.class);
    }

    private User activeUser() {
        return User.builder()
                .id("user-1")
                .email("student@example.com")
                .status(UserStatus.ACTIVE)
                .roles(new HashSet<>())
                .build();
    }
}
