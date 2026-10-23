package org.example.edushare.feature.auth.service;

import org.example.edushare.common.exception.AppException;
import org.example.edushare.common.exception.ErrorCode;
import org.example.edushare.feature.auth.dto.response.AuthenticationResponse;
import org.example.edushare.feature.auth.dto.response.GoogleUserInfo;
import org.example.edushare.feature.auth.entity.AuthProvider;
import org.example.edushare.feature.auth.entity.Role;
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

import java.util.HashSet;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GoogleAccountServiceTest {
    @Mock
    private UserRepository userRepository;
    @Mock
    private UserAuthProviderRepository providerRepository;
    @Mock
    private DefaultRoleService defaultRoleService;
    @Mock
    private LinkTokenService linkTokenService;
    @Mock
    private JwtService jwtService;

    private GoogleAccountService service;

    @BeforeEach
    void setUp() {
        service = new GoogleAccountService(
                userRepository,
                providerRepository,
                defaultRoleService,
                linkTokenService,
                jwtService);
    }

    @Test
    void createsActivePasswordlessUserAndGoogleProviderForNewGoogleIdentity() {
        GoogleUserInfo googleUser = googleUser("new@example.com");
        Role role = Role.builder().id("role-1").name("USER").permissions(new HashSet<>()).build();
        when(providerRepository.findByProviderAndProviderId(AuthProvider.GOOGLE, "google-sub-1"))
                .thenReturn(Optional.empty());
        when(userRepository.findByEmailForUpdate("new@example.com")).thenReturn(Optional.empty());
        when(defaultRoleService.getUserRole()).thenReturn(role);
        when(userRepository.saveAndFlush(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId("user-1");
            return user;
        });
        when(providerRepository.saveAndFlush(any(UserAuthProvider.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(jwtService.generateToken(any(User.class))).thenReturn("edushare-jwt");

        AuthenticationResponse response = service.authenticateVerified(googleUser);

        assertThat(response.isAuthenticated()).isTrue();
        assertThat(response.getToken()).isEqualTo("edushare-jwt");
        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).saveAndFlush(userCaptor.capture());
        assertThat(userCaptor.getValue().getPassword()).isNull();
        assertThat(userCaptor.getValue().getStatus()).isEqualTo(UserStatus.ACTIVE);
        assertThat(userCaptor.getValue().getProfile().getAvatarUrl())
                .isEqualTo("https://example.com/avatar.png");
        ArgumentCaptor<UserAuthProvider> providerCaptor = ArgumentCaptor.forClass(UserAuthProvider.class);
        verify(providerRepository).saveAndFlush(providerCaptor.capture());
        assertThat(providerCaptor.getValue().getProvider()).isEqualTo(AuthProvider.GOOGLE);
        assertThat(providerCaptor.getValue().getProviderId()).isEqualTo("google-sub-1");
        assertThat(providerCaptor.getValue().getUser().getId()).isEqualTo("user-1");
    }

    @Test
    void logsInPreviouslyLinkedGoogleProviderWithoutPassword() {
        User user = activeUser("user-1", "student@example.com", null);
        when(providerRepository.findByProviderAndProviderId(AuthProvider.GOOGLE, "google-sub-1"))
                .thenReturn(Optional.of(googleProvider(user)));
        when(jwtService.generateToken(user)).thenReturn("edushare-jwt");

        AuthenticationResponse response = service.authenticateVerified(googleUser("student@example.com"));

        assertThat(response.isAuthenticated()).isTrue();
        assertThat(response.isAccountLinkRequired()).isFalse();
        verify(linkTokenService, never()).issue(any(), any(), any());
    }

    @Test
    void returnsLinkTokenWhenVerifiedGoogleEmailBelongsToLocalAccount() {
        User user = activeUser("user-1", "student@example.com", "bcrypt");
        when(providerRepository.findByProviderAndProviderId(AuthProvider.GOOGLE, "google-sub-1"))
                .thenReturn(Optional.empty());
        when(userRepository.findByEmailForUpdate("student@example.com")).thenReturn(Optional.of(user));
        when(providerRepository.existsByUser_IdAndProvider("user-1", AuthProvider.GOOGLE))
                .thenReturn(false);
        when(linkTokenService.issue("user-1", "google-sub-1", "student@example.com"))
                .thenReturn("short-lived-link-token");

        AuthenticationResponse response = service.authenticateVerified(googleUser("student@example.com"));

        assertThat(response.isAuthenticated()).isFalse();
        assertThat(response.isAccountLinkRequired()).isTrue();
        assertThat(response.getLinkToken()).isEqualTo("short-lived-link-token");
        verify(providerRepository, never()).saveAndFlush(any());
    }

    @Test
    void rejectsBlockedUserBeforeIssuingAccessOrLinkToken() {
        User user = activeUser("user-1", "student@example.com", "bcrypt");
        user.setStatus(UserStatus.BANNED);
        when(providerRepository.findByProviderAndProviderId(AuthProvider.GOOGLE, "google-sub-1"))
                .thenReturn(Optional.of(googleProvider(user)));

        assertError(() -> service.authenticateVerified(googleUser("student@example.com")),
                ErrorCode.ACCOUNT_DISABLED);
        verify(jwtService, never()).generateToken(any());
    }

    @Test
    void googleSubIsCanonicalWhenGoogleEmailChanges() {
        User linkedUser = activeUser("same-user-id", "old-email@example.com", null);
        when(providerRepository.findByProviderAndProviderId(AuthProvider.GOOGLE, "google-sub-1"))
                .thenReturn(Optional.of(googleProvider(linkedUser)));
        when(jwtService.generateToken(linkedUser)).thenReturn("jwt-for-same-user");

        AuthenticationResponse response = service.authenticateVerified(googleUser("new-email@example.com"));

        assertThat(response.getToken()).isEqualTo("jwt-for-same-user");
        verify(userRepository, never()).findByEmailForUpdate(any());
        verify(jwtService).generateToken(linkedUser);
    }

    @Test
    void rejectsDifferentGoogleProviderAlreadyAttachedToEmailOwner() {
        User user = activeUser("user-1", "student@example.com", "bcrypt");
        when(providerRepository.findByProviderAndProviderId(AuthProvider.GOOGLE, "google-sub-1"))
                .thenReturn(Optional.empty());
        when(userRepository.findByEmailForUpdate("student@example.com")).thenReturn(Optional.of(user));
        when(providerRepository.existsByUser_IdAndProvider("user-1", AuthProvider.GOOGLE))
                .thenReturn(true);

        assertError(() -> service.authenticateVerified(googleUser("student@example.com")),
                ErrorCode.GOOGLE_PROVIDER_ALREADY_LINKED);
    }

    private GoogleUserInfo googleUser(String email) {
        return new GoogleUserInfo(
                "google-sub-1",
                email,
                "Student Name",
                "https://example.com/avatar.png",
                true);
    }

    private User activeUser(String id, String email, String password) {
        return User.builder()
                .id(id)
                .email(email)
                .password(password)
                .status(UserStatus.ACTIVE)
                .roles(new HashSet<>())
                .build();
    }

    private UserAuthProvider googleProvider(User user) {
        return UserAuthProvider.builder()
                .id("provider-1")
                .user(user)
                .provider(AuthProvider.GOOGLE)
                .providerId("google-sub-1")
                .build();
    }

    private void assertError(Runnable action, ErrorCode errorCode) {
        assertThatThrownBy(action::run)
                .isInstanceOfSatisfying(AppException.class,
                        exception -> assertThat(exception.getErrorCode()).isEqualTo(errorCode));
    }
}
