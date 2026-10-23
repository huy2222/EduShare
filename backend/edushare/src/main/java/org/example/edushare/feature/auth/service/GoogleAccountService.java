package org.example.edushare.feature.auth.service;

import lombok.RequiredArgsConstructor;
import org.example.edushare.common.exception.AppException;
import org.example.edushare.common.exception.ErrorCode;
import org.example.edushare.feature.auth.dto.response.AuthenticationResponse;
import org.example.edushare.feature.auth.dto.response.GoogleUserInfo;
import org.example.edushare.feature.auth.entity.AuthProvider;
import org.example.edushare.feature.auth.entity.Role;
import org.example.edushare.feature.auth.entity.UserAuthProvider;
import org.example.edushare.feature.auth.repository.UserAuthProviderRepository;
import org.example.edushare.feature.user.entity.Profile;
import org.example.edushare.feature.user.entity.User;
import org.example.edushare.feature.user.entity.UserStatus;
import org.example.edushare.feature.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.HashSet;
import java.util.List;

@Service
@RequiredArgsConstructor
public class GoogleAccountService {
    private final UserRepository userRepository;
    private final UserAuthProviderRepository userAuthProviderRepository;
    private final DefaultRoleService defaultRoleService;
    private final LinkTokenService linkTokenService;
    private final JwtService jwtService;

    @Transactional
    public AuthenticationResponse authenticateVerified(GoogleUserInfo googleUser) {
        return userAuthProviderRepository
                .findByProviderAndProviderId(AuthProvider.GOOGLE, googleUser.sub())
                .map(UserAuthProvider::getUser)
                .map(this::login)
                .orElseGet(() -> authenticateWithoutExistingProvider(googleUser));
    }

    @Transactional(readOnly = true)
    public AuthenticationResponse recoverAfterConcurrentRequest(GoogleUserInfo googleUser) {
        return userAuthProviderRepository
                .findByProviderAndProviderId(AuthProvider.GOOGLE, googleUser.sub())
                .map(UserAuthProvider::getUser)
                .map(this::login)
                .orElseGet(() -> userRepository.findByEmail(googleUser.email())
                        .map(user -> requireAccountLink(user, googleUser.sub()))
                        .orElseThrow(() -> new AppException(ErrorCode.GOOGLE_PROVIDER_ALREADY_LINKED)));
    }

    private AuthenticationResponse authenticateWithoutExistingProvider(GoogleUserInfo googleUser) {
        return userRepository.findByEmailForUpdate(googleUser.email())
                .map(user -> requireAccountLink(user, googleUser.sub()))
                .orElseGet(() -> createGoogleUser(googleUser));
    }

    private AuthenticationResponse createGoogleUser(GoogleUserInfo googleUser) {
        Role defaultRole = defaultRoleService.getUserRole();
        User user = User.builder()
                .email(googleUser.email())
                .password(null)
                .status(UserStatus.ACTIVE)
                .roles(new HashSet<>(List.of(defaultRole)))
                .build();
        user.attachProfile(Profile.builder()
                .fullName(resolveFullName(googleUser))
                .avatarUrl(googleUser.picture())
                .build());

        user = userRepository.saveAndFlush(user);
        userAuthProviderRepository.saveAndFlush(UserAuthProvider.builder()
                .user(user)
                .provider(AuthProvider.GOOGLE)
                .providerId(googleUser.sub())
                .build());
        return login(user);
    }

    private AuthenticationResponse requireAccountLink(User user, String googleSub) {
        validateNotDisabled(user);
        if (userAuthProviderRepository.existsByUser_IdAndProvider(user.getId(), AuthProvider.GOOGLE)) {
            throw new AppException(ErrorCode.GOOGLE_PROVIDER_ALREADY_LINKED);
        }
        if (user.getPassword() == null) {
            throw new AppException(ErrorCode.LOCAL_CREDENTIALS_REQUIRED);
        }
        String linkToken = linkTokenService.issue(user.getId(), googleSub, user.getEmail());
        return AuthenticationResponse.linkRequired(linkToken);
    }

    private AuthenticationResponse login(User user) {
        validateActive(user);
        return AuthenticationResponse.authenticated(jwtService.generateToken(user));
    }

    private void validateActive(User user) {
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new AppException(ErrorCode.ACCOUNT_DISABLED);
        }
    }

    private void validateNotDisabled(User user) {
        if (user.getStatus() == UserStatus.INACTIVE || user.getStatus() == UserStatus.BANNED) {
            throw new AppException(ErrorCode.ACCOUNT_DISABLED);
        }
    }

    private String resolveFullName(GoogleUserInfo googleUser) {
        if (StringUtils.hasText(googleUser.fullName())) {
            return googleUser.fullName();
        }
        int separator = googleUser.email().indexOf('@');
        return separator > 0 ? googleUser.email().substring(0, separator) : googleUser.email();
    }
}
