package org.example.edushare.feature.auth.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AuthenticationResponse {
    private String token;
    private boolean authenticated;
    private boolean accountLinkRequired;
    private String linkToken;

    public static AuthenticationResponse authenticated(String token) {
        return AuthenticationResponse.builder()
                .token(token)
                .authenticated(true)
                .accountLinkRequired(false)
                .build();
    }

    public static AuthenticationResponse linkRequired(String linkToken) {
        return AuthenticationResponse.builder()
                .authenticated(false)
                .accountLinkRequired(true)
                .linkToken(linkToken)
                .build();
    }
}
