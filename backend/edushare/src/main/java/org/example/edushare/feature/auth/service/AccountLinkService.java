package org.example.edushare.feature.auth.service;

import lombok.RequiredArgsConstructor;
import org.example.edushare.common.exception.AppException;
import org.example.edushare.common.exception.ErrorCode;
import org.example.edushare.feature.auth.dto.request.GoogleLinkRequest;
import org.example.edushare.feature.auth.dto.response.AuthenticationResponse;
import org.example.edushare.feature.auth.entity.AuthProvider;
import org.example.edushare.feature.auth.entity.UserAuthProvider;
import org.example.edushare.feature.auth.repository.UserAuthProviderRepository;
import org.example.edushare.feature.user.entity.User;
import org.example.edushare.feature.user.entity.UserStatus;
import org.example.edushare.feature.user.repository.UserRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AccountLinkService {
    private final LinkTokenService linkTokenService;
    private final UserRepository userRepository;
    private final UserAuthProviderRepository userAuthProviderRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Transactional
    public AuthenticationResponse linkGoogle(GoogleLinkRequest request) {
        GoogleLinkContext context = linkTokenService.verify(request.linkToken());
        User user = userRepository.findByIdForUpdate(context.userId())
                .orElseThrow(() -> new AppException(ErrorCode.LINK_TOKEN_INVALID));

        if (!user.getEmail().equalsIgnoreCase(context.email())) {
            throw new AppException(ErrorCode.LINK_TOKEN_INVALID);
        }
        if (user.getStatus() == UserStatus.INACTIVE || user.getStatus() == UserStatus.BANNED) {
            throw new AppException(ErrorCode.ACCOUNT_DISABLED);
        }
        if (user.getPassword() == null) {
            throw new AppException(ErrorCode.LOCAL_CREDENTIALS_REQUIRED);
        }
        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new AppException(ErrorCode.INVALID_PASSWORD);
        }

        if (userAuthProviderRepository
                .findByProviderAndProviderIdForUpdate(AuthProvider.GOOGLE, context.googleSub())
                .isPresent()
                || userAuthProviderRepository.existsByUser_IdAndProvider(user.getId(), AuthProvider.GOOGLE)) {
            throw new AppException(ErrorCode.GOOGLE_PROVIDER_ALREADY_LINKED);
        }

        try {
            userAuthProviderRepository.saveAndFlush(UserAuthProvider.builder()
                    .user(user)
                    .provider(AuthProvider.GOOGLE)
                    .providerId(context.googleSub())
                    .build());
        } catch (DataIntegrityViolationException exception) {
            throw new AppException(ErrorCode.GOOGLE_PROVIDER_ALREADY_LINKED);
        }

        if (user.getStatus() == UserStatus.PENDING_VERIFICATION) {
            user.setStatus(UserStatus.ACTIVE);
        }
        return AuthenticationResponse.authenticated(jwtService.generateToken(user));
    }
}
