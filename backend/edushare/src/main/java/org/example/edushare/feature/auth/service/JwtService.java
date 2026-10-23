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

import java.text.ParseException;
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

    public JwtService(
            @Value("${jwt.signerKey}") String signerKey,
            @Value("${jwt.valid-duration}") long validDuration) {
        this.signerKey = signerKey;
        this.validDuration = validDuration;
    }

    public String generateToken(User user) {
        JWSHeader header = new JWSHeader(JWSAlgorithm.HS512);
        JWTClaimsSet claims = new JWTClaimsSet.Builder()
                .subject(user.getEmail())
                .issuer("huynn")
                .issueTime(new Date())
                .jwtID(UUID.randomUUID().toString())
                .expirationTime(Date.from(Instant.now().plus(validDuration, ChronoUnit.SECONDS)))
                .claim("userId", user.getId())
                .claim("scope", buildScope(user))
                .build();

        JWSObject token = new JWSObject(header, new Payload(claims.toJSONObject()));
        try {
            token.sign(new MACSigner(signerKey.getBytes()));
            return token.serialize();
        } catch (JOSEException exception) {
            log.error("Error while signing an EduShare access token", exception);
            throw new IllegalStateException("Unable to issue access token", exception);
        }
    }

    public void verifyToken(String rawToken) throws JOSEException, ParseException {
        JWSVerifier verifier = new MACVerifier(signerKey.getBytes());
        SignedJWT token = SignedJWT.parse(rawToken);
        Date expirationTime = token.getJWTClaimsSet().getExpirationTime();
        if (!token.verify(verifier)
                || expirationTime == null
                || !expirationTime.after(new Date())) {
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
}
