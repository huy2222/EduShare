package org.example.edushare.feature.auth.service;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.example.edushare.common.exception.AppException;
import org.example.edushare.common.exception.ErrorCode;
import org.example.edushare.feature.auth.config.OtpProperties;
import org.example.edushare.feature.auth.dto.request.VerifyEmailRequest;
import org.example.edushare.feature.auth.entity.EmailVerification;
import org.example.edushare.feature.auth.entity.VerificationStatus;
import org.example.edushare.feature.auth.entity.VerificationType;
import org.example.edushare.feature.auth.repository.EmailVerificationRepository;
import org.example.edushare.feature.notification.service.EmailService;
import org.example.edushare.feature.user.entity.User;
import org.example.edushare.feature.user.entity.UserStatus;
import org.example.edushare.feature.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Locale;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class EmailVerificationService {
    static final SecureRandom RANDOM = new SecureRandom();
    static final VerificationType REGISTRATION = VerificationType.REGISTER;

    EmailVerificationRepository emailVerificationRepository;
    UserRepository userRepository;
    EmailService emailService;
    OtpHasher otpHasher;
    OtpProperties otpProperties;

    @Transactional
    public void createAndSendOtp(User user) {
        User lockedUser = userRepository.findByIdForUpdate(user.getId())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        invalidatePendingOtps(lockedUser, REGISTRATION);

        String otp = generateOtp();
        LocalDateTime sentAt = LocalDateTime.now();
        EmailVerification verification = EmailVerification.builder()
                .user(lockedUser)
                .otpHash(otpHasher.hash(otp))
                .type(REGISTRATION)
                .expiresAt(sentAt.plusMinutes(otpProperties.getExpirationMinutes()))
                .attempts(0)
                .resendCount(0)
                .status(VerificationStatus.PENDING)
                .build();

        // Persist a successful send timestamp only after the mail provider accepts the message.
        emailService.sendOtp(lockedUser.getEmail(), otp);
        verification.setLastSentAt(sentAt);
        emailVerificationRepository.save(verification);
    }

    @Transactional(noRollbackFor = AppException.class)
    public void verifyEmail(VerifyEmailRequest request) {
        String email = normalizeEmail(request.getEmail());
        User user = userRepository.findByEmailForUpdate(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        EmailVerification verification = findCurrentVerification(user, REGISTRATION);

        ensurePending(verification);

        LocalDateTime now = LocalDateTime.now();
        if (!verification.getExpiresAt().isAfter(now)) {
            verification.setStatus(VerificationStatus.EXPIRED);
            throw new AppException(ErrorCode.OTP_EXPIRED);
        }

        if (verification.getAttempts() >= otpProperties.getMaxAttempts()) {
            verification.setStatus(VerificationStatus.BLOCKED);
            throw new AppException(ErrorCode.OTP_BLOCKED);
        }

        if (!isWellFormed(request.getOtp())
                || !otpHasher.matches(request.getOtp(), verification.getOtpHash())) {
            int attempts = verification.getAttempts() + 1;
            verification.setAttempts(attempts);
            if (attempts >= otpProperties.getMaxAttempts()) {
                verification.setStatus(VerificationStatus.BLOCKED);
                throw new AppException(ErrorCode.OTP_BLOCKED);
            }
            throw new AppException(ErrorCode.OTP_INVALID);
        }

        verification.setStatus(VerificationStatus.VERIFIED);
        verification.setVerifiedAt(now);
        user.setStatus(UserStatus.ACTIVE);
    }

    @Transactional
    public void resendOtp(String rawEmail) {
        String email = normalizeEmail(rawEmail);
        User user = userRepository.findByEmailForUpdate(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        if (user.getStatus() == UserStatus.ACTIVE) {
            throw new AppException(ErrorCode.EMAIL_ALREADY_VERIFIED);
        }

        EmailVerification verification = emailVerificationRepository
                .findFirstByUser_IdAndTypeOrderByCreatedAtDesc(user.getId(), REGISTRATION)
                .orElse(null);

        if (verification == null) {
            createFirstOtpForPendingUser(user);
            return;
        }

        LocalDateTime now = LocalDateTime.now();
        if (verification.getResendCount() >= otpProperties.getMaxResends()) {
            throw new AppException(ErrorCode.OTP_RESEND_LIMIT_EXCEEDED);
        }
        if (verification.getLastSentAt() != null
                && verification.getLastSentAt().plusSeconds(otpProperties.getResendCooldownSeconds()).isAfter(now)) {
            throw new AppException(ErrorCode.OTP_RESEND_TOO_SOON);
        }

        String otp = generateOtp();
        String otpHash = otpHasher.hash(otp);

        // Keep the previous code and counters intact if delivery fails.
        emailService.sendOtp(user.getEmail(), otp);

        invalidateOtherPendingOtps(user, REGISTRATION, verification.getId());
        verification.setOtpHash(otpHash);
        verification.setExpiresAt(now.plusMinutes(otpProperties.getExpirationMinutes()));
        verification.setAttempts(0);
        verification.setResendCount(verification.getResendCount() + 1);
        verification.setLastSentAt(now);
        verification.setVerifiedAt(null);
        verification.setStatus(VerificationStatus.PENDING);
    }

    String generateOtp() {
        StringBuilder otp = new StringBuilder(otpProperties.getLength());
        for (int i = 0; i < otpProperties.getLength(); i++) {
            otp.append(RANDOM.nextInt(10));
        }
        return otp.toString();
    }

    private void createFirstOtpForPendingUser(User user) {
        String otp = generateOtp();
        LocalDateTime sentAt = LocalDateTime.now();
        EmailVerification verification = EmailVerification.builder()
                .user(user)
                .otpHash(otpHasher.hash(otp))
                .type(REGISTRATION)
                .expiresAt(sentAt.plusMinutes(otpProperties.getExpirationMinutes()))
                .attempts(0)
                .resendCount(0)
                .status(VerificationStatus.PENDING)
                .build();

        emailService.sendOtp(user.getEmail(), otp);
        verification.setLastSentAt(sentAt);
        emailVerificationRepository.save(verification);
    }

    private EmailVerification findCurrentVerification(User user, VerificationType type) {
        return emailVerificationRepository
                .findFirstByUser_IdAndTypeOrderByCreatedAtDesc(user.getId(), type)
                .orElseThrow(() -> new AppException(ErrorCode.OTP_INVALID));
    }

    private void ensurePending(EmailVerification verification) {
        switch (verification.getStatus()) {
            case VERIFIED -> throw new AppException(ErrorCode.OTP_ALREADY_VERIFIED);
            case EXPIRED -> throw new AppException(ErrorCode.OTP_EXPIRED);
            case BLOCKED -> throw new AppException(ErrorCode.OTP_BLOCKED);
            case PENDING -> {
                // Continue with expiry, attempt and hash checks.
            }
        }
    }

    private void invalidatePendingOtps(User user, VerificationType type) {
        emailVerificationRepository
                .findAllByUser_IdAndTypeAndStatus(user.getId(), type, VerificationStatus.PENDING)
                .forEach(otp -> otp.setStatus(VerificationStatus.EXPIRED));
    }

    private void invalidateOtherPendingOtps(User user, VerificationType type, String currentId) {
        emailVerificationRepository
                .findAllByUser_IdAndTypeAndStatus(user.getId(), type, VerificationStatus.PENDING)
                .stream()
                .filter(otp -> !Objects.equals(otp.getId(), currentId))
                .forEach(otp -> otp.setStatus(VerificationStatus.EXPIRED));
    }

    private boolean isWellFormed(String otp) {
        return otp != null
                && otp.length() == otpProperties.getLength()
                && otp.chars().allMatch(Character::isDigit);
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
