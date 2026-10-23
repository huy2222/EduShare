package org.example.edushare.feature.auth.service;

import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.example.edushare.common.exception.AppException;
import org.example.edushare.common.exception.ErrorCode;
import org.example.edushare.feature.auth.dto.request.RegisterRequest;
import org.example.edushare.feature.auth.dto.response.RegisterResponse;
import org.example.edushare.feature.auth.entity.Role;
import org.example.edushare.feature.auth.repository.RoleRepository;
import org.example.edushare.feature.user.dto.request.UserCreationRequest;
import org.example.edushare.feature.user.dto.response.UserResponse;
import org.example.edushare.feature.user.entity.User;
import org.example.edushare.feature.user.entity.Profile;
import org.example.edushare.feature.user.mapper.UserMapper;
import org.example.edushare.feature.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;

import java.text.ParseException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class AuthenticationService {
    UserRepository userRepository;
    UserMapper userMapper;
    PasswordEncoder passwordEncoder;
    RoleRepository roleRepository;
    EmailVerificationService emailVerificationService;
//    InvalidatedTokenRepository invalidatedTokenRepository;

//    JWT configuration is temporarily disabled while testing registration only.
//    @NonFinal
//    @Value("${jwt.signerKey}")
//    protected String SIGNER_KEY;
//
//    @NonFinal
//    @Value("${jwt.valid-duration}")
//    protected Long VALID_DURATION;
//
//    @NonFinal
//    @Value("${jwt.refreshable-duration}")
//    protected Long REFRESHABLE_DURATION;


    @Transactional
    public RegisterResponse register(RegisterRequest request) {
        log.info("User service create");
        request.setEmail(request.getEmail().trim().toLowerCase(Locale.ROOT));
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AppException(ErrorCode.USER_EXISTED);
        }

        User user = userMapper.toUser(request);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.attachProfile(Profile.builder().fullName(request.getFullName()).build());

        Role role = roleRepository.findByName("USER").orElseGet(() -> roleRepository.save(
                Role.builder()
                        .name("USER")
                        .description("Default role for registered users")
                        .permissions(new HashSet<>())
                        .build()));
        user.setRoles(new HashSet<>(List.of(role)));

        try {
            user = userRepository.saveAndFlush(user);
        } catch (DataIntegrityViolationException e) {
            throw new AppException(ErrorCode.USER_EXISTED);
        }

        emailVerificationService.createAndSendOtp(user);

        return userMapper.toUserResponse(user);
    }



//    public IntrospectResponse introspect(IntrospectRequest request) throws ParseException, JOSEException {
//        var token = request.getToken();
//        boolean isValid = true;
//        try {
//            verifyToken(token, false);
//        } catch (AppException e) {
//            isValid = false;
//        }
//        return IntrospectResponse.builder().valid(isValid).build();
//    }

//    public AuthenticationResponse authenticate(AuthenticationRequest request) {
//        var user = userRepository
//                .findByUsername(request.getUsername())
//                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
//        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(10);
//        boolean authenticated = passwordEncoder.matches(request.getPassword(), user.getPassword());
//        if (!authenticated) {
//            throw new AppException(ErrorCode.UNAUTHENTICATED);
//        }
//        var token = generateToken(user);
//        return AuthenticationResponse.builder()
//                .token(token)
//                .authenticated(authenticated)
//                .build();
//    }

//    public void logout(LogoutRequest request) throws ParseException, JOSEException {
//
//        try {
//            var signToken = verifyToken(request.getToken(), true);
//            String jti = signToken.getJWTClaimsSet().getJWTID();
//            Date expiryTime = signToken.getJWTClaimsSet().getExpirationTime();
//            InvalidatedToken invalidatedToken =
//                    InvalidatedToken.builder().id(jti).expiryTime(expiryTime).build();
//            invalidatedTokenRepository.save(invalidatedToken);
//        } catch (AppException e) {
//            log.info("token already expired");
//        }
//    }


//    public AuthenticationResponse refreshToken(RefreshRequest request) throws ParseException, JOSEException {
//        // - kiểm tra token có hợp lệ hay không
//        var signedJWT = verifyToken(request.getToken(), true);
//        var jti = signedJWT.getJWTClaimsSet().getJWTID();
//        var expiryTime = signedJWT.getJWTClaimsSet().getExpirationTime();
//
//        InvalidatedToken invalidatedToken =
//                InvalidatedToken.builder().id(jti).expiryTime(expiryTime).build();
//        invalidatedTokenRepository.save(invalidatedToken);
//
//        var username = signedJWT.getJWTClaimsSet().getSubject();
//        var user =
//                userRepository.findByUsername(username).orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED));
//        var token = generateToken(user);
//        return AuthenticationResponse.builder().token(token).authenticated(true).build();
//    }

/*  JWT helpers are temporarily disabled while testing registration only.
    private SignedJWT verifyToken(String token, boolean isRefresh) throws JOSEException, ParseException {
        JWSVerifier verifier = new MACVerifier(SIGNER_KEY.getBytes());

        SignedJWT signedJWT = SignedJWT.parse(token);

        Date expirationTime = (isRefresh)
                ? new Date(signedJWT
                .getJWTClaimsSet()
                .getIssueTime()
                .toInstant()
                .plus(REFRESHABLE_DURATION, ChronoUnit.SECONDS)
                .toEpochMilli())
                : signedJWT.getJWTClaimsSet().getExpirationTime();

        var verify = signedJWT.verify(verifier);

        if (!(verify && expirationTime.after(new Date()))) throw new AppException(ErrorCode.UNAUTHENTICATED);

//        if (invalidatedTokenRepository.existsById(signedJWT.getJWTClaimsSet().getJWTID()))
//            throw new AppException(ErrorCode.UNAUTHENTICATED);

        return signedJWT;
    }

    private String generateToken(User user) {
        JWSHeader header = new JWSHeader(JWSAlgorithm.HS512);
        JWTClaimsSet jwtClaimsSet = new JWTClaimsSet.Builder()
                .subject(user.getEmail())
                .issuer("devteria.com")
                .issueTime(new Date())
                .jwtID(UUID.randomUUID().toString())
                .expirationTime(new Date(
                        Instant.now().plus(VALID_DURATION, ChronoUnit.SECONDS).toEpochMilli()))
                .claim("scope", buildScope(user))
                .build();

        Payload payload = new Payload(jwtClaimsSet.toJSONObject());
        JWSObject jwsObject = new JWSObject(header, payload);
        try {
            jwsObject.sign(new MACSigner(SIGNER_KEY.getBytes()));
            return jwsObject.serialize();
        } catch (JOSEException e) {
            log.error("Error while signing the JWT token: {}", e.getMessage(), e);
            throw new RuntimeException(e);
        }
    }

    private String buildScope(User user) {
        StringJoiner stringJoiner = new StringJoiner(" ");

        if (!CollectionUtils.isEmpty(user.getRoles())) {
            user.getRoles().forEach(role -> {
                stringJoiner.add("ROLE_" + role.getName());

                if (!CollectionUtils.isEmpty(role.getPermissions())) {
                    role.getPermissions().forEach(permission -> stringJoiner.add(permission.getName()));
                }
            });
        }
        return stringJoiner.toString();
    }
*/
}
