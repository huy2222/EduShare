package org.example.edushare.feature.auth.service;

import org.example.edushare.common.exception.AppException;
import org.example.edushare.common.exception.ErrorCode;
import org.example.edushare.feature.auth.config.GoogleAuthProperties;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class LinkTokenServiceTest {
    private static final String SECRET = "edushare-test-google-link-secret-that-is-at-least-sixty-four-bytes-long";

    @Test
    void roundTripsAValidShortLivedToken() {
        LinkTokenService service = service(10);

        String token = service.issue("user-1", "google-sub-1", "student@example.com");
        GoogleLinkContext context = service.verify(token);

        assertThat(context.userId()).isEqualTo("user-1");
        assertThat(context.googleSub()).isEqualTo("google-sub-1");
        assertThat(context.email()).isEqualTo("student@example.com");
    }

    @Test
    void rejectsExpiredLinkToken() {
        LinkTokenService service = service(-1);
        String token = service.issue("user-1", "google-sub-1", "student@example.com");

        assertError(service, token, ErrorCode.LINK_TOKEN_EXPIRED);
    }

    @Test
    void rejectsTamperedLinkToken() {
        LinkTokenService service = service(10);
        String token = service.issue("user-1", "google-sub-1", "student@example.com");
        String[] tokenParts = token.split("\\.");
        String signature = tokenParts[2];
        char replacement = signature.charAt(0) == 'A' ? 'B' : 'A';
        String tampered = tokenParts[0] + "." + tokenParts[1] + "."
                + replacement + signature.substring(1);

        assertError(service, tampered, ErrorCode.LINK_TOKEN_INVALID);
    }

    private LinkTokenService service(long expirationMinutes) {
        GoogleAuthProperties properties = new GoogleAuthProperties();
        properties.setLinkTokenSecret(SECRET);
        properties.setLinkTokenExpirationMinutes(expirationMinutes);
        return new LinkTokenService(properties);
    }

    private void assertError(LinkTokenService service, String token, ErrorCode errorCode) {
        assertThatThrownBy(() -> service.verify(token))
                .isInstanceOfSatisfying(AppException.class,
                        exception -> assertThat(exception.getErrorCode()).isEqualTo(errorCode));
    }
}
