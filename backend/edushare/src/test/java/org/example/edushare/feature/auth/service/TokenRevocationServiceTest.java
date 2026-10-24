package org.example.edushare.feature.auth.service;

import org.example.edushare.feature.auth.repository.InvalidatedTokenRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TokenRevocationServiceTest {
    @Mock
    private InvalidatedTokenRepository repository;
    @Mock
    private JwtService jwtService;

    private TokenRevocationService service;

    @BeforeEach
    void setUp() {
        service = new TokenRevocationService(repository, jwtService);
    }

    @Test
    void revokesOnlyAValidatedUnexpiredJwtId() {
        Instant expiry = Instant.now().plusSeconds(300);
        when(jwtService.verifyForRevocation("jwt"))
                .thenReturn(new JwtService.VerifiedToken("jti-1", expiry));

        service.revokeToken("jwt");

        verify(repository).insertIfAbsent(eq("jti-1"), eq(expiry), any(Instant.class));
    }

    @Test
    void expiredLogoutIsIdempotentAndDoesNotGrowBlacklist() {
        when(jwtService.verifyForRevocation("expired"))
                .thenReturn(new JwtService.VerifiedToken("jti-old", Instant.now().minusSeconds(1)));

        service.revokeToken("expired");

        verify(repository, never()).insertIfAbsent(any(), any(), any());
    }

    @Test
    void cleanupUsesCurrentTimeAndReturnsDeletedCount() {
        when(repository.deleteExpiredBefore(any(Instant.class))).thenReturn(2);

        assertThat(service.deleteExpiredTokens()).isEqualTo(2);
    }
}
