package org.example.edushare.feature.auth.service;

import lombok.RequiredArgsConstructor;
import org.example.edushare.feature.auth.dto.response.AuthenticationResponse;
import org.example.edushare.feature.auth.dto.response.GoogleUserInfo;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class GoogleAuthenticationService {
    private final GoogleTokenVerifierService googleTokenVerifierService;
    private final GoogleAccountService googleAccountService;

    public AuthenticationResponse authenticate(String idToken) {
        GoogleUserInfo googleUser = googleTokenVerifierService.verify(idToken);
        try {
            return googleAccountService.authenticateVerified(googleUser);
        } catch (DataIntegrityViolationException exception) {
            return googleAccountService.recoverAfterConcurrentRequest(googleUser);
        }
    }
}
