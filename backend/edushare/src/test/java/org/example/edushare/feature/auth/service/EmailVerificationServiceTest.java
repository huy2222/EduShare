package org.example.edushare.feature.auth.service;

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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EmailVerificationServiceTest {

    @Mock
    EmailVerificationRepository emailVerificationRepository;
    @Mock
    UserRepository userRepository;
    @Mock
    EmailService emailService;
    @Mock
    OtpHasher otpHasher;

    EmailVerificationService service;
    OtpProperties properties;

    @BeforeEach
    void setUp() {
        properties = new OtpProperties();
        properties.setLength(6);
        properties.setExpirationMinutes(5);
        properties.setMaxAttempts(5);
        properties.setResendCooldownSeconds(60);
        properties.setMaxResends(5);
        properties.setHmacSecret("test-secret-with-at-least-thirty-two-characters");
        service = new EmailVerificationService(
                emailVerificationRepository,
                userRepository,
                emailService,
                otpHasher,
                properties);
    }

    @Test
    void createOtpSuccessfullyHashesAndSendsSixDigitCode() {
        User user = pendingUser();
        when(userRepository.findByIdForUpdate(user.getId())).thenReturn(Optional.of(user));
        when(emailVerificationRepository.findAllByUser_IdAndTypeAndStatus(
                user.getId(), VerificationType.REGISTER, VerificationStatus.PENDING))
                .thenReturn(List.of());
        when(otpHasher.hash(anyString())).thenReturn("v1$salt$hash");

        service.createAndSendOtp(user);

        ArgumentCaptor<EmailVerification> verificationCaptor =
                ArgumentCaptor.forClass(EmailVerification.class);
        ArgumentCaptor<String> otpCaptor = ArgumentCaptor.forClass(String.class);
        verify(emailService).sendOtp(eq(user.getEmail()), otpCaptor.capture());
        verify(emailVerificationRepository).save(verificationCaptor.capture());

        EmailVerification saved = verificationCaptor.getValue();
        assertEquals("v1$salt$hash", saved.getOtpHash());
        assertEquals(VerificationType.REGISTER, saved.getType());
        assertEquals(VerificationStatus.PENDING, saved.getStatus());
        assertEquals(0, saved.getAttempts());
        assertEquals(0, saved.getResendCount());
        assertNotNull(saved.getLastSentAt());
        assertTrue(otpCaptor.getValue().matches("\\d{6}"));

        InOrder order = inOrder(emailService, emailVerificationRepository);
        order.verify(emailService).sendOtp(eq(user.getEmail()), anyString());
        order.verify(emailVerificationRepository).save(saved);
    }

    @Test
    void verifyCorrectOtpActivatesUserAndMarksOtpVerified() {
        User user = pendingUser();
        EmailVerification verification = pendingVerification(user);
        stubCurrent(user, verification);
        when(otpHasher.matches("123456", verification.getOtpHash())).thenReturn(true);

        service.verifyEmail(new VerifyEmailRequest("STUDENT@example.com", "123456"));

        assertEquals(UserStatus.ACTIVE, user.getStatus());
        assertEquals(VerificationStatus.VERIFIED, verification.getStatus());
        assertNotNull(verification.getVerifiedAt());
    }

    @Test
    void verifyWrongOtpIncrementsAttempts() {
        User user = pendingUser();
        EmailVerification verification = pendingVerification(user);
        stubCurrent(user, verification);
        when(otpHasher.matches("000000", verification.getOtpHash())).thenReturn(false);

        AppException exception = assertThrows(AppException.class,
                () -> service.verifyEmail(new VerifyEmailRequest(user.getEmail(), "000000")));

        assertEquals(ErrorCode.OTP_INVALID, exception.getErrorCode());
        assertEquals(1, verification.getAttempts());
        assertEquals(VerificationStatus.PENDING, verification.getStatus());
    }

    @Test
    void verifyExpiredOtpMarksItExpired() {
        User user = pendingUser();
        EmailVerification verification = pendingVerification(user);
        verification.setExpiresAt(LocalDateTime.now().minusSeconds(1));
        stubCurrent(user, verification);

        AppException exception = assertThrows(AppException.class,
                () -> service.verifyEmail(new VerifyEmailRequest(user.getEmail(), "123456")));

        assertEquals(ErrorCode.OTP_EXPIRED, exception.getErrorCode());
        assertEquals(VerificationStatus.EXPIRED, verification.getStatus());
        verify(otpHasher, never()).matches(anyString(), anyString());
    }

    @Test
    void fifthWrongAttemptBlocksOtp() {
        User user = pendingUser();
        EmailVerification verification = pendingVerification(user);
        verification.setAttempts(4);
        stubCurrent(user, verification);
        when(otpHasher.matches("000000", verification.getOtpHash())).thenReturn(false);

        AppException exception = assertThrows(AppException.class,
                () -> service.verifyEmail(new VerifyEmailRequest(user.getEmail(), "000000")));

        assertEquals(ErrorCode.OTP_BLOCKED, exception.getErrorCode());
        assertEquals(5, verification.getAttempts());
        assertEquals(VerificationStatus.BLOCKED, verification.getStatus());
    }

    @Test
    void verifiedOtpCannotBeReused() {
        User user = pendingUser();
        EmailVerification verification = pendingVerification(user);
        verification.setStatus(VerificationStatus.VERIFIED);
        verification.setVerifiedAt(LocalDateTime.now().minusSeconds(1));
        stubCurrent(user, verification);

        AppException exception = assertThrows(AppException.class,
                () -> service.verifyEmail(new VerifyEmailRequest(user.getEmail(), "123456")));

        assertEquals(ErrorCode.OTP_ALREADY_VERIFIED, exception.getErrorCode());
        verify(otpHasher, never()).matches(anyString(), anyString());
    }

    @Test
    void resendBeforeCooldownIsRejected() {
        User user = pendingUser();
        EmailVerification verification = pendingVerification(user);
        verification.setLastSentAt(LocalDateTime.now().minusSeconds(30));
        stubCurrent(user, verification);

        AppException exception = assertThrows(AppException.class,
                () -> service.resendOtp(user.getEmail()));

        assertEquals(ErrorCode.OTP_RESEND_TOO_SOON, exception.getErrorCode());
        verify(emailService, never()).sendOtp(anyString(), anyString());
    }

    @Test
    void validResendReplacesHashAndResetsAttemptState() {
        User user = pendingUser();
        EmailVerification verification = pendingVerification(user);
        verification.setAttempts(3);
        verification.setResendCount(2);
        verification.setLastSentAt(LocalDateTime.now().minusSeconds(61));
        stubCurrent(user, verification);
        when(otpHasher.hash(anyString())).thenReturn("v1$new-salt$new-hash");

        service.resendOtp(user.getEmail());

        assertEquals("v1$new-salt$new-hash", verification.getOtpHash());
        assertEquals(0, verification.getAttempts());
        assertEquals(3, verification.getResendCount());
        assertEquals(VerificationStatus.PENDING, verification.getStatus());
        assertNull(verification.getVerifiedAt());
        verify(emailService).sendOtp(eq(user.getEmail()), anyString());
        verify(emailVerificationRepository, never()).save(any(EmailVerification.class));
    }

    @Test
    void resendBeyondLimitIsRejected() {
        User user = pendingUser();
        EmailVerification verification = pendingVerification(user);
        verification.setResendCount(5);
        verification.setLastSentAt(LocalDateTime.now().minusMinutes(10));
        stubCurrent(user, verification);

        AppException exception = assertThrows(AppException.class,
                () -> service.resendOtp(user.getEmail()));

        assertEquals(ErrorCode.OTP_RESEND_LIMIT_EXCEEDED, exception.getErrorCode());
        verify(emailService, never()).sendOtp(anyString(), anyString());
    }

    @Test
    void oldOtpIsInvalidAfterResend() {
        User user = pendingUser();
        EmailVerification verification = pendingVerification(user);
        verification.setLastSentAt(LocalDateTime.now().minusMinutes(2));
        stubCurrent(user, verification);
        when(otpHasher.hash(anyString())).thenReturn("v1$new-salt$new-hash");
        when(otpHasher.matches("111111", "v1$new-salt$new-hash")).thenReturn(false);

        service.resendOtp(user.getEmail());
        AppException exception = assertThrows(AppException.class,
                () -> service.verifyEmail(new VerifyEmailRequest(user.getEmail(), "111111")));

        assertEquals(ErrorCode.OTP_INVALID, exception.getErrorCode());
        assertEquals(1, verification.getAttempts());
    }

    @Test
    void secondVerificationRequestCannotConsumeSameOtp() {
        User user = pendingUser();
        EmailVerification verification = pendingVerification(user);
        stubCurrent(user, verification);
        when(otpHasher.matches("123456", verification.getOtpHash())).thenReturn(true);

        service.verifyEmail(new VerifyEmailRequest(user.getEmail(), "123456"));
        AppException secondResult = assertThrows(AppException.class,
                () -> service.verifyEmail(new VerifyEmailRequest(user.getEmail(), "123456")));

        assertEquals(ErrorCode.OTP_ALREADY_VERIFIED, secondResult.getErrorCode());
        assertEquals(VerificationStatus.VERIFIED, verification.getStatus());
        verify(otpHasher).matches("123456", verification.getOtpHash());
    }

    @Test
    void resendLimitCannotBeBypassedByExpiredSession() {
        User user = pendingUser();
        EmailVerification verification = pendingVerification(user);
        verification.setStatus(VerificationStatus.EXPIRED);
        verification.setResendCount(5);
        verification.setLastSentAt(LocalDateTime.now().minusHours(1));
        stubCurrent(user, verification);

        AppException exception = assertThrows(AppException.class,
                () -> service.resendOtp(user.getEmail()));

        assertEquals(ErrorCode.OTP_RESEND_LIMIT_EXCEEDED, exception.getErrorCode());
        verify(emailVerificationRepository, never()).save(any(EmailVerification.class));
    }

    @Test
    void failedResendDeliveryDoesNotInvalidateExistingOtpOrIncrementCounter() {
        User user = pendingUser();
        EmailVerification verification = pendingVerification(user);
        verification.setAttempts(2);
        verification.setResendCount(1);
        verification.setLastSentAt(LocalDateTime.now().minusMinutes(2));
        String previousHash = verification.getOtpHash();
        stubCurrent(user, verification);
        when(otpHasher.hash(anyString())).thenReturn("v1$new-salt$new-hash");
        org.mockito.Mockito.doThrow(new AppException(ErrorCode.EMAIL_DELIVERY_FAILED))
                .when(emailService).sendOtp(eq(user.getEmail()), anyString());

        AppException exception = assertThrows(AppException.class,
                () -> service.resendOtp(user.getEmail()));

        assertEquals(ErrorCode.EMAIL_DELIVERY_FAILED, exception.getErrorCode());
        assertEquals(previousHash, verification.getOtpHash());
        assertEquals(2, verification.getAttempts());
        assertEquals(1, verification.getResendCount());
        assertEquals(VerificationStatus.PENDING, verification.getStatus());
    }

    private void stubCurrent(User user, EmailVerification verification) {
        when(userRepository.findByEmailForUpdate(user.getEmail())).thenReturn(Optional.of(user));
        when(emailVerificationRepository.findFirstByUser_IdAndTypeOrderByCreatedAtDesc(
                user.getId(), VerificationType.REGISTER)).thenReturn(Optional.of(verification));
    }

    private User pendingUser() {
        return User.builder()
                .id("user-id")
                .email("student@example.com")
                .password("encoded-password")
                .status(UserStatus.PENDING_VERIFICATION)
                .build();
    }

    private EmailVerification pendingVerification(User user) {
        return EmailVerification.builder()
                .id("verification-id")
                .user(user)
                .otpHash("v1$old-salt$old-hash")
                .type(VerificationType.REGISTER)
                .expiresAt(LocalDateTime.now().plusMinutes(5))
                .attempts(0)
                .resendCount(0)
                .lastSentAt(LocalDateTime.now().minusMinutes(2))
                .status(VerificationStatus.PENDING)
                .createdAt(LocalDateTime.now().minusMinutes(2))
                .build();
    }
}
