package org.example.edushare.feature.auth.service;

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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.HashSet;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AccountLinkServiceTest {
    @Mock
    private LinkTokenService linkTokenService;
    @Mock
    private UserRepository userRepository;
    @Mock
    private UserAuthProviderRepository providerRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private JwtService jwtService;

    private AccountLinkService service;
    private GoogleLinkRequest request;

    @BeforeEach
    void setUp() {
        service = new AccountLinkService(
                linkTokenService,
                userRepository,
                providerRepository,
                passwordEncoder,
                jwtService);
        request = new GoogleLinkRequest("link-token", "Password123");
        when(linkTokenService.verify("link-token"))
                .thenReturn(new GoogleLinkContext("user-1", "google-sub-1", "student@example.com"));
    }

    @Test
    void linksGoogleWithCorrectLocalPasswordAndReturnsAccessToken() {
        User user = user("bcrypt", UserStatus.ACTIVE);
        arrangeLinkableUser(user);
        when(passwordEncoder.matches("Password123", "bcrypt")).thenReturn(true);
        when(providerRepository.saveAndFlush(any(UserAuthProvider.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(jwtService.generateToken(user)).thenReturn("edushare-jwt");

        AuthenticationResponse response = service.linkGoogle(request);

        assertThat(response.isAuthenticated()).isTrue();
        assertThat(response.getToken()).isEqualTo("edushare-jwt");
        ArgumentCaptor<UserAuthProvider> providerCaptor = ArgumentCaptor.forClass(UserAuthProvider.class);
        verify(providerRepository).saveAndFlush(providerCaptor.capture());
        assertThat(providerCaptor.getValue().getProviderId()).isEqualTo("google-sub-1");
        assertThat(providerCaptor.getValue().getUser().getId()).isEqualTo("user-1");
    }

    @Test
    void rejectsWrongPasswordWithoutLinking() {
        User user = user("bcrypt", UserStatus.ACTIVE);
        when(userRepository.findByIdForUpdate("user-1")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("Password123", "bcrypt")).thenReturn(false);

        assertError(() -> service.linkGoogle(request), ErrorCode.INVALID_PASSWORD);
        verify(providerRepository, never()).saveAndFlush(any());
    }

    @Test
    void rejectsAlreadyLinkedGoogleProvider() {
        User user = user("bcrypt", UserStatus.ACTIVE);
        when(userRepository.findByIdForUpdate("user-1")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("Password123", "bcrypt")).thenReturn(true);
        when(providerRepository.findByProviderAndProviderIdForUpdate(
                AuthProvider.GOOGLE, "google-sub-1"))
                .thenReturn(Optional.of(UserAuthProvider.builder().user(user).build()));

        assertError(() -> service.linkGoogle(request), ErrorCode.GOOGLE_PROVIDER_ALREADY_LINKED);
    }

    @Test
    void mapsDatabaseRaceToAlreadyLinkedError() {
        User user = user("bcrypt", UserStatus.ACTIVE);
        arrangeLinkableUser(user);
        when(passwordEncoder.matches("Password123", "bcrypt")).thenReturn(true);
        when(providerRepository.saveAndFlush(any(UserAuthProvider.class)))
                .thenThrow(new DataIntegrityViolationException("unique constraint"));

        assertError(() -> service.linkGoogle(request), ErrorCode.GOOGLE_PROVIDER_ALREADY_LINKED);
    }

    @Test
    void rejectsUserWithoutLocalPassword() {
        User user = user(null, UserStatus.ACTIVE);
        when(userRepository.findByIdForUpdate("user-1")).thenReturn(Optional.of(user));

        assertError(() -> service.linkGoogle(request), ErrorCode.LOCAL_CREDENTIALS_REQUIRED);
        verify(passwordEncoder, never()).matches(any(), any());
    }

    @Test
    void verifiedGoogleLinkActivatesPendingLocalAccountWithoutOtp() {
        User user = user("bcrypt", UserStatus.PENDING_VERIFICATION);
        arrangeLinkableUser(user);
        when(passwordEncoder.matches("Password123", "bcrypt")).thenReturn(true);
        when(providerRepository.saveAndFlush(any(UserAuthProvider.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(jwtService.generateToken(user)).thenReturn("edushare-jwt");

        service.linkGoogle(request);

        assertThat(user.getStatus()).isEqualTo(UserStatus.ACTIVE);
    }

    private void arrangeLinkableUser(User user) {
        when(userRepository.findByIdForUpdate("user-1")).thenReturn(Optional.of(user));
        when(providerRepository.findByProviderAndProviderIdForUpdate(
                AuthProvider.GOOGLE, "google-sub-1"))
                .thenReturn(Optional.empty());
        when(providerRepository.existsByUser_IdAndProvider("user-1", AuthProvider.GOOGLE))
                .thenReturn(false);
    }

    private User user(String password, UserStatus status) {
        return User.builder()
                .id("user-1")
                .email("student@example.com")
                .password(password)
                .status(status)
                .roles(new HashSet<>())
                .build();
    }

    private void assertError(Runnable action, ErrorCode errorCode) {
        assertThatThrownBy(action::run)
                .isInstanceOfSatisfying(AppException.class,
                        exception -> assertThat(exception.getErrorCode()).isEqualTo(errorCode));
    }
}
