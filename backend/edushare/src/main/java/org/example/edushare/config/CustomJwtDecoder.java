package org.example.edushare.config;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import org.example.edushare.common.exception.AppException;
import org.example.edushare.feature.auth.service.JwtService;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.BadJwtException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.stereotype.Component;


import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Objects;

@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
@Component
public class CustomJwtDecoder implements JwtDecoder {
    @NonFinal
    @Value("${jwt.signerKey}")
    private String signerKey;

    JwtService jwtService;
    org.example.edushare.feature.auth.service.CurrentAccountService currentAccountService;

    @NonFinal
    private volatile NimbusJwtDecoder nimbusJwtDecoder = null;

    @Override
    public Jwt decode(String token) throws JwtException {
        String tokenId;
        try {
            JwtService.VerifiedToken verifiedToken = jwtService.verifyAndRead(token);
            tokenId = verifiedToken.id();
        } catch (AppException e) {
            throw new BadJwtException("Invalid access token", e);
        }

        if (Objects.isNull(nimbusJwtDecoder)) {
            synchronized (this) {
                if (nimbusJwtDecoder == null) {
                    SecretKeySpec secretKeySpec = new SecretKeySpec(
                            signerKey.getBytes(StandardCharsets.UTF_8), "HmacSHA512");
                    nimbusJwtDecoder = NimbusJwtDecoder.withSecretKey(secretKeySpec)
                            .macAlgorithm(MacAlgorithm.HS512)
                            .build();
                }
            }
        }
        Jwt jwt = nimbusJwtDecoder.decode(token);
        return Jwt.withTokenValue(jwt.getTokenValue()).headers(h -> h.putAll(jwt.getHeaders()))
                .claims(c -> c.putAll(jwt.getClaims()))
                .claim("scope", currentAccountService.scope(jwt.getSubject(), tokenId)).build();
    }
}
