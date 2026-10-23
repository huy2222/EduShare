package org.example.edushare.feature.auth.service;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import org.example.edushare.common.exception.AppException;
import org.example.edushare.common.exception.ErrorCode;
import org.example.edushare.feature.auth.dto.request.VerifyEmailRequest;
import org.example.edushare.feature.auth.entity.EmailVerification;
import org.example.edushare.feature.auth.repository.EmailVerificationRepository;
import org.example.edushare.feature.notification.service.EmailService;
import org.example.edushare.feature.user.entity.User;
import org.example.edushare.feature.user.entity.UserStatus;
import org.example.edushare.feature.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class EmailVerificationService {
    static final SecureRandom RANDOM = new SecureRandom();

    EmailVerificationRepository emailVerificationRepository;
    UserRepository userRepository;
    EmailService emailService;
    PasswordEncoder passwordEncoder;

    @NonFinal
    @Value("${app.otp.expiration-minutes:5}")
    long expirationMinutes;

    @NonFinal
    @Value("${app.otp.max-attempts:5}")
    int maxAttempts;

    @NonFinal
    @Value("${app.otp.resend-cooldown-seconds:60}")
    long resendCooldownSeconds;

    @Transactional
    public void createAndSendOtp(User user) {
        invalidateExistingOtps(user);

        String otp = generateOtp();
        LocalDateTime now = LocalDateTime.now();
        EmailVerification verification = EmailVerification.builder()
                .user(user)
                .otpHash(passwordEncoder.encode(otp))
                .expiresAt(now.plusMinutes(expirationMinutes))
                .attempts(0)
                .used(false)
                .createdAt(now)
                .build();

        emailVerificationRepository.save(verification);
        emailService.sendOtp(user.getEmail(), otp);
    }

    @Transactional(noRollbackFor = AppException.class)
    public void verifyEmail(VerifyEmailRequest request) {
        String email = normalizeEmail(request.getEmail());
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        if (user.getStatus() == UserStatus.ACTIVE) {
            throw new AppException(ErrorCode.EMAIL_ALREADY_VERIFIED);
        }

        EmailVerification verification = emailVerificationRepository
                .findFirstByUser_EmailAndUsedFalseOrderByCreatedAtDesc(email)
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_OTP));

        if (verification.getExpiresAt().isBefore(LocalDateTime.now())) {
            verification.setUsed(true);
            throw new AppException(ErrorCode.OTP_EXPIRED);
        }

        if (verification.getAttempts() >= maxAttempts) {
            verification.setUsed(true);
            throw new AppException(ErrorCode.OTP_ATTEMPTS_EXCEEDED);
        }

        if (!passwordEncoder.matches(request.getOtp(), verification.getOtpHash())) {
            verification.setAttempts(verification.getAttempts() + 1);
            if (verification.getAttempts() >= maxAttempts) {
                verification.setUsed(true);
                throw new AppException(ErrorCode.OTP_ATTEMPTS_EXCEEDED);
            }
            throw new AppException(ErrorCode.INVALID_OTP);
        }

        verification.setUsed(true);
        user.setStatus(UserStatus.ACTIVE);
    }

    @Transactional
    public void resendOtp(String rawEmail) {
        String email = normalizeEmail(rawEmail);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        if (user.getStatus() == UserStatus.ACTIVE) {
            throw new AppException(ErrorCode.EMAIL_ALREADY_VERIFIED);
        }

        emailVerificationRepository.findFirstByUser_EmailAndUsedFalseOrderByCreatedAtDesc(email)
                .filter(otp -> otp.getCreatedAt()
                        .isAfter(LocalDateTime.now().minusSeconds(resendCooldownSeconds)))
                .ifPresent(otp -> {
                    throw new AppException(ErrorCode.OTP_RESEND_TOO_SOON);
                });

        createAndSendOtp(user);
    }

    String generateOtp() {
        return String.format("%06d", RANDOM.nextInt(1_000_000));
    }

    private void invalidateExistingOtps(User user) {
        emailVerificationRepository.findAllByUser_IdAndUsedFalse(user.getId())
                .forEach(otp -> otp.setUsed(true));
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
