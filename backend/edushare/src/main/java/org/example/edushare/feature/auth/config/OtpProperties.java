package org.example.edushare.feature.auth.config;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import org.springframework.validation.annotation.Validated;

@Getter
@Setter
@Validated
@Component
@ConfigurationProperties(prefix = "app.otp")
public class OtpProperties {

    @Min(4)
    @Max(12)
    private int length = 6;

    @Min(1)
    private long expirationMinutes = 5;

    @Min(1)
    private int maxAttempts = 5;

    @Min(1)
    private long resendCooldownSeconds = 60;

    @Min(0)
    private int maxResends = 5;

    @NotBlank
    @Size(min = 32)
    private String hmacSecret;
}
