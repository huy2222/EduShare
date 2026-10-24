package org.example.edushare.feature.auth.service;

import lombok.RequiredArgsConstructor;
import org.example.edushare.feature.auth.repository.InvalidatedTokenRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class TokenRevocationService {
    private final InvalidatedTokenRepository invalidatedTokenRepository;
    private final JwtService jwtService;

    @Transactional
    public void revokeToken(String rawToken) {
        JwtService.VerifiedToken token = jwtService.verifyForRevocation(rawToken);
        Instant now = Instant.now();
        if (!token.expiresAt().isAfter(now)) {
            return;
        }
        invalidatedTokenRepository.insertIfAbsent(token.id(), token.expiresAt(), now);
    }

    @Transactional(readOnly = true)
    public boolean isTokenRevoked(String tokenId) {
        return invalidatedTokenRepository.existsById(tokenId);
    }

    @Transactional
    @Scheduled(cron = "${app.security.token-revocation.cleanup-cron:0 0 3 * * *}", zone = "UTC")
    public int deleteExpiredTokens() {
        return invalidatedTokenRepository.deleteExpiredBefore(Instant.now());
    }
}
