package org.example.edushare.feature.auth.service;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import lombok.RequiredArgsConstructor;
import org.example.edushare.common.exception.AppException;
import org.example.edushare.common.exception.ErrorCode;
import org.example.edushare.feature.auth.config.GoogleAuthProperties;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.nio.charset.StandardCharsets;
import java.text.ParseException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LinkTokenService {
    private static final String ISSUER = "edushare-google-link";
    private static final String AUDIENCE = "edushare-account-link";
    private static final String PURPOSE = "GOOGLE_ACCOUNT_LINK";

    private final GoogleAuthProperties properties;

    public String issue(String userId, String googleSub, String email) {
        byte[] secret = signingSecret();
        Instant now = Instant.now();
        JWTClaimsSet claims = new JWTClaimsSet.Builder()
                .subject(userId)
                .issuer(ISSUER)
                .audience(AUDIENCE)
                .issueTime(Date.from(now))
                .expirationTime(Date.from(now.plus(
                        properties.getLinkTokenExpirationMinutes(), ChronoUnit.MINUTES)))
                .jwtID(UUID.randomUUID().toString())
                .claim("purpose", PURPOSE)
                .claim("google_sub", googleSub)
                .claim("email", email)
                .build();

        SignedJWT token = new SignedJWT(new JWSHeader(JWSAlgorithm.HS512), claims);
        try {
            token.sign(new MACSigner(secret));
            return token.serialize();
        } catch (JOSEException exception) {
            throw new IllegalStateException("Unable to issue account link token", exception);
        }
    }

    public GoogleLinkContext verify(String rawToken) {
        try {
            SignedJWT token = SignedJWT.parse(rawToken);
            if (!JWSAlgorithm.HS512.equals(token.getHeader().getAlgorithm())
                    || !token.verify(new MACVerifier(signingSecret()))) {
                throw new AppException(ErrorCode.LINK_TOKEN_INVALID);
            }

            JWTClaimsSet claims = token.getJWTClaimsSet();
            Date expirationTime = claims.getExpirationTime();
            if (expirationTime == null || !expirationTime.after(new Date())) {
                throw new AppException(ErrorCode.LINK_TOKEN_EXPIRED);
            }
            if (!ISSUER.equals(claims.getIssuer())
                    || !claims.getAudience().equals(List.of(AUDIENCE))
                    || !PURPOSE.equals(claims.getStringClaim("purpose"))) {
                throw new AppException(ErrorCode.LINK_TOKEN_INVALID);
            }

            String userId = claims.getSubject();
            String googleSub = claims.getStringClaim("google_sub");
            String email = claims.getStringClaim("email");
            if (!StringUtils.hasText(userId)
                    || !StringUtils.hasText(googleSub)
                    || !StringUtils.hasText(email)) {
                throw new AppException(ErrorCode.LINK_TOKEN_INVALID);
            }
            return new GoogleLinkContext(userId, googleSub, email);
        } catch (AppException exception) {
            throw exception;
        } catch (ParseException | JOSEException | RuntimeException exception) {
            throw new AppException(ErrorCode.LINK_TOKEN_INVALID);
        }
    }

    private byte[] signingSecret() {
        String secret = properties.getLinkTokenSecret();
        if (!StringUtils.hasText(secret)
                || secret.getBytes(StandardCharsets.UTF_8).length < 64) {
            throw new IllegalStateException("Google link-token secret must contain at least 64 bytes");
        }
        return secret.getBytes(StandardCharsets.UTF_8);
    }
}
