package org.example.edushare.feature.auth.service;

import org.example.edushare.common.exception.AppException;
import org.example.edushare.common.exception.ErrorCode;
import org.example.edushare.feature.auth.dto.request.LoginRequest;
import org.example.edushare.feature.auth.dto.request.RegisterRequest;
import org.example.edushare.feature.auth.dto.response.LoginResponse;
import org.example.edushare.feature.auth.dto.response.RegisterResponse;
import org.example.edushare.feature.auth.entity.AuthProvider;
import org.example.edushare.feature.auth.entity.Role;
import org.example.edushare.feature.auth.entity.UserAuthProvider;
import org.example.edushare.feature.auth.repository.UserAuthProviderRepository;
import org.example.edushare.feature.user.entity.User;
import org.example.edushare.feature.user.entity.UserStatus;
import org.example.edushare.feature.user.mapper.UserMapper;
import org.example.edushare.feature.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
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
class AuthenticationServiceProviderTest {
    @Mock
    private UserRepository userRepository;
    @Mock
    private UserMapper userMapper;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private DefaultRoleService defaultRoleService;
    @Mock
    private UserAuthProviderRepository providerRepository;
    @Mock
    private EmailVerificationService emailVerificationService;
    @Mock
    private JwtService jwtService;

    private AuthenticationService service;

    @BeforeEach
    void setUp() {
        service = new AuthenticationService(
                userRepository,
                userMapper,
                passwordEncoder,
                defaultRoleService,
                providerRepository,
                emailVerificationService,
                jwtService);
    }

    @Test
    void localRegistrationCreatesLocalProviderAndKeepsOtpFlow() {
        RegisterRequest request = RegisterRequest.builder()
                .email(" Student@Example.com ")
                .fullName("Student Name")
                .password("Password123")
                .build();
        User user = User.builder().status(UserStatus.PENDING_VERIFICATION).build();
        Role role = Role.builder().id("role-1").name("USER").permissions(new HashSet<>()).build();
        RegisterResponse mappedResponse = RegisterResponse.builder().id("user-1").build();
        when(userRepository.existsByEmail("student@example.com")).thenReturn(false);
        when(userMapper.toUser(request)).thenReturn(user);
        when(passwordEncoder.encode("Password123")).thenReturn("bcrypt");
        when(defaultRoleService.getUserRole()).thenReturn(role);
        when(userRepository.saveAndFlush(user)).thenAnswer(invocation -> {
            user.setId("user-1");
            return user;
        });
        when(providerRepository.saveAndFlush(any(UserAuthProvider.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(userMapper.toUserResponse(user)).thenReturn(mappedResponse);

        RegisterResponse response = service.register(request);

        assertThat(response.getId()).isEqualTo("user-1");
        assertThat(user.getPassword()).isEqualTo("bcrypt");
        ArgumentCaptor<UserAuthProvider> captor = ArgumentCaptor.forClass(UserAuthProvider.class);
        verify(providerRepository).saveAndFlush(captor.capture());
        assertThat(captor.getValue().getProvider()).isEqualTo(AuthProvider.LOCAL);
        assertThat(captor.getValue().getProviderId()).isNull();
        verify(emailVerificationService).createAndSendOtp(user);
    }

    @Test
    void existingEmailPasswordLoginStillWorksAfterProviderRefactor() {
        LoginRequest request = LoginRequest.builder()
                .email("student@example.com")
                .password("Password123")
                .build();
        User user = User.builder()
                .id("user-1")
                .email("student@example.com")
                .password("bcrypt")
                .status(UserStatus.ACTIVE)
                .roles(new HashSet<>())
                .build();
        when(userRepository.findByEmail("student@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("Password123", "bcrypt")).thenReturn(true);
        when(jwtService.generateToken(user)).thenReturn("edushare-jwt");

        LoginResponse response = service.authenticate(request);

        assertThat(response.isAuthenticated()).isTrue();
        assertThat(response.getToken()).isEqualTo("edushare-jwt");
    }

    @Test
    void passwordlessGoogleUserCannotUseLocalLoginAndDoesNotCrashBcrypt() {
        LoginRequest request = LoginRequest.builder()
                .email("student@example.com")
                .password("Password123")
                .build();
        User user = User.builder()
                .id("user-1")
                .email("student@example.com")
                .password(null)
                .status(UserStatus.ACTIVE)
                .build();
        when(userRepository.findByEmail("student@example.com")).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> service.authenticate(request))
                .isInstanceOfSatisfying(AppException.class,
                        exception -> assertThat(exception.getErrorCode()).isEqualTo(ErrorCode.UNAUTHENTICATED));
        verify(passwordEncoder, never()).matches(any(), any());
    }
}
