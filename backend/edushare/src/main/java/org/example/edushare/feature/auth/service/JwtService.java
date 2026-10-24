package org.example.edushare.feature.auth.service;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.JWSObject;
import com.nimbusds.jose.JWSVerifier;
import com.nimbusds.jose.Payload;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import lombok.extern.slf4j.Slf4j;
import org.example.edushare.common.exception.AppException;
import org.example.edushare.common.exception.ErrorCode;
import org.example.edushare.feature.user.entity.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.StringJoiner;
import java.util.UUID;

@Service
@Slf4j
public class JwtService {
    private final String signerKey;
    private final long validDuration;
    private final String issuer;

    public JwtService(
            @Value("${jwt.signerKey}") String signerKey,
            @Value("${jwt.valid-duration}") long validDuration,
            @Value("${jwt.issuer:huynn}") String issuer) {
        this.signerKey = signerKey;
        this.validDuration = validDuration;
        this.issuer = issuer;
    }

    public String generateToken(User user) {
        JWSHeader header = new JWSHeader(JWSAlgorithm.HS512);
        JWTClaimsSet claims = new JWTClaimsSet.Builder()
                .subject(user.getEmail())
                .issuer(issuer)
                .issueTime(new Date())
                .jwtID(UUID.randomUUID().toString())
                .expirationTime(Date.from(Instant.now().plus(validDuration, ChronoUnit.SECONDS)))
                .claim("userId", user.getId())
                .claim("scope", buildScope(user))
                .build();

        JWSObject token = new JWSObject(header, new Payload(claims.toJSONObject()));
        try {
            token.sign(new MACSigner(signerKey.getBytes(StandardCharsets.UTF_8)));
            return token.serialize();
        } catch (JOSEException exception) {
            log.error("Error while signing an EduShare access token", exception);
            throw new IllegalStateException("Unable to issue access token", exception);
        }
    }

    public void verifyToken(String rawToken) {
        verify(rawToken, true);
    }

    public VerifiedToken verifyAndRead(String rawToken) {
        return verify(rawToken, true);
    }

    public VerifiedToken verifyForRevocation(String rawToken) {
        return verify(rawToken, false);
    }

    public Duration remainingValidity(String rawToken) {
        VerifiedToken token = verifyAndRead(rawToken);
        long remainingSeconds = Math.max(0, token.expiresAt().getEpochSecond() - Instant.now().getEpochSecond());
        return Duration.ofSeconds(remainingSeconds);
    }

    private VerifiedToken verify(String rawToken, boolean rejectExpired) {
        try {
            SignedJWT token = SignedJWT.parse(rawToken);
            JWSVerifier verifier = new MACVerifier(signerKey.getBytes(StandardCharsets.UTF_8));
            JWTClaimsSet claims = token.getJWTClaimsSet();
            Date expirationTime = claims.getExpirationTime();
            String tokenId = claims.getJWTID();

            boolean invalid = !JWSAlgorithm.HS512.equals(token.getHeader().getAlgorithm())
                    || !token.verify(verifier)
                    || !issuer.equals(claims.getIssuer())
                    || expirationTime == null
                    || !StringUtils.hasText(tokenId)
                    || (rejectExpired && !expirationTime.after(new Date()));
            if (invalid) {
                throw new AppException(ErrorCode.UNAUTHENTICATED);
            }
            return new VerifiedToken(tokenId, expirationTime.toInstant());
        } catch (JOSEException | java.text.ParseException | IllegalArgumentException exception) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
    }

    private String buildScope(User user) {
        StringJoiner scopes = new StringJoiner(" ");
        if (!CollectionUtils.isEmpty(user.getRoles())) {
            user.getRoles().forEach(role -> {
                scopes.add("ROLE_" + role.getName());
                if (!CollectionUtils.isEmpty(role.getPermissions())) {
                    role.getPermissions().forEach(permission -> scopes.add(permission.getName()));
                }
            });
        }
        return scopes.toString();
    }

    public record VerifiedToken(String id, Instant expiresAt) {
    }
}
