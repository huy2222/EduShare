package org.example.edushare.feature.auth.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "app.security.cookie")
public class AuthCookieProperties {
    private String name = "access_token";
    private boolean secure = true;
    private String sameSite = "Lax";
    private String path = "/";
}
