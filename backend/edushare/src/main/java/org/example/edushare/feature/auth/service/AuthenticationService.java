package org.example.edushare.feature.auth.service;

import com.nimbusds.jose.JOSEException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.edushare.common.exception.AppException;
import org.example.edushare.common.exception.ErrorCode;
import org.example.edushare.feature.auth.dto.request.IntrospectRequest;
import org.example.edushare.feature.auth.dto.request.LoginRequest;
import org.example.edushare.feature.auth.dto.request.RegisterRequest;
import org.example.edushare.feature.auth.dto.response.IntrospectResponse;
import org.example.edushare.feature.auth.dto.response.LoginResponse;
import org.example.edushare.feature.auth.dto.response.RegisterResponse;
import org.example.edushare.feature.auth.entity.AuthProvider;
import org.example.edushare.feature.auth.entity.Role;
import org.example.edushare.feature.auth.entity.UserAuthProvider;
import org.example.edushare.feature.auth.repository.UserAuthProviderRepository;
import org.example.edushare.feature.user.entity.Profile;
import org.example.edushare.feature.user.entity.User;
import org.example.edushare.feature.user.entity.UserStatus;
import org.example.edushare.feature.user.mapper.UserMapper;
import org.example.edushare.feature.user.repository.UserRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.ParseException;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthenticationService {
    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final DefaultRoleService defaultRoleService;
    private final UserAuthProviderRepository userAuthProviderRepository;
    private final EmailVerificationService emailVerificationService;
    private final JwtService jwtService;

    @Transactional
    public RegisterResponse register(RegisterRequest request) {
        String email = request.getEmail().trim().toLowerCase(Locale.ROOT);
        request.setEmail(email);
        if (userRepository.existsByEmail(email)) {
            throw new AppException(ErrorCode.USER_EXISTED);
        }

        User user = userMapper.toUser(request);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.attachProfile(Profile.builder().fullName(request.getFullName().trim()).build());

        Role role = defaultRoleService.getUserRole();
        user.setRoles(new HashSet<>(List.of(role)));

        try {
            user = userRepository.saveAndFlush(user);
            userAuthProviderRepository.saveAndFlush(UserAuthProvider.builder()
                    .user(user)
                    .provider(AuthProvider.LOCAL)
                    .providerId(null)
                    .build());
        } catch (DataIntegrityViolationException exception) {
            throw new AppException(ErrorCode.USER_EXISTED);
        }

        emailVerificationService.createAndSendOtp(user);
        return userMapper.toUserResponse(user);
    }

    public IntrospectResponse introspect(IntrospectRequest request) throws ParseException, JOSEException {
        try {
            jwtService.verifyToken(request.getToken());
            return IntrospectResponse.builder().valid(true).build();
        } catch (AppException exception) {
            return IntrospectResponse.builder().valid(false).build();
        }
    }

    @Transactional(readOnly = true)
    public LoginResponse authenticate(LoginRequest request) {
        String email = request.getEmail().trim().toLowerCase(Locale.ROOT);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        if (user.getPassword() == null
                || !passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            log.info("Authentication failed for user: {}", email);
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        validateUserCanLogin(user);
        return LoginResponse.builder()
                .token(jwtService.generateToken(user))
                .authenticated(true)
                .build();
    }

    private void validateUserCanLogin(User user) {
        if (user.getStatus() == UserStatus.PENDING_VERIFICATION) {
            throw new AppException(ErrorCode.EMAIL_NOT_VERIFIED);
        }
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new AppException(ErrorCode.ACCOUNT_DISABLED);
        }
    }
}
