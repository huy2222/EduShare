package org.example.edushare.feature.auth.service;

import org.example.edushare.feature.auth.config.OtpProperties;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;

@Component
public class OtpHasher {
    private static final String ALGORITHM = "HmacSHA256";
    private static final String VERSION = "v1";
    private static final int SALT_BYTES = 16;

    private final byte[] secret;
    private final SecureRandom secureRandom = new SecureRandom();

    public OtpHasher(OtpProperties properties) {
        this.secret = properties.getHmacSecret().getBytes(StandardCharsets.UTF_8);
    }

    public String hash(String otp) {
        byte[] salt = new byte[SALT_BYTES];
        secureRandom.nextBytes(salt);
        byte[] digest = hmac(salt, otp);
        Base64.Encoder encoder = Base64.getUrlEncoder().withoutPadding();
        return VERSION + "$" + encoder.encodeToString(salt) + "$" + encoder.encodeToString(digest);
    }

    public boolean matches(String otp, String encodedHash) {
        if (otp == null || encodedHash == null) {
            return false;
        }

        try {
            String[] parts = encodedHash.split("\\$", -1);
            if (parts.length != 3 || !VERSION.equals(parts[0])) {
                return false;
            }
            Base64.Decoder decoder = Base64.getUrlDecoder();
            byte[] salt = decoder.decode(parts[1]);
            byte[] expected = decoder.decode(parts[2]);
            return MessageDigest.isEqual(expected, hmac(salt, otp));
        } catch (IllegalArgumentException exception) {
            return false;
        }
    }

    private byte[] hmac(byte[] salt, String otp) {
        try {
            Mac mac = Mac.getInstance(ALGORITHM);
            mac.init(new SecretKeySpec(secret, ALGORITHM));
            mac.update(salt);
            return mac.doFinal(otp.getBytes(StandardCharsets.UTF_8));
        } catch (GeneralSecurityException exception) {
            throw new IllegalStateException("Unable to hash OTP", exception);
        }
    }
}
