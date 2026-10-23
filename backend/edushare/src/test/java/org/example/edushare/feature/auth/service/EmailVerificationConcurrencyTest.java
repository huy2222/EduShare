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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

@DataJpaTest
@Import({EmailVerificationService.class, EmailVerificationConcurrencyTest.OtpTestConfiguration.class})
@Transactional(propagation = Propagation.NOT_SUPPORTED)
class EmailVerificationConcurrencyTest {

    @Autowired
    EmailVerificationService service;
    @Autowired
    EmailVerificationRepository emailVerificationRepository;
    @Autowired
    UserRepository userRepository;
    @Autowired
    OtpHasher otpHasher;

    @BeforeEach
    void cleanDatabase() {
        emailVerificationRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void twoConcurrentRequestsCannotVerifyTheSameOtpTwice() throws Exception {
        User user = userRepository.saveAndFlush(User.builder()
                .email("concurrent@example.com")
                .password("encoded-password")
                .status(UserStatus.PENDING_VERIFICATION)
                .build());
        EmailVerification verification = emailVerificationRepository.saveAndFlush(EmailVerification.builder()
                .user(user)
                .otpHash(otpHasher.hash("123456"))
                .type(VerificationType.REGISTER)
                .expiresAt(LocalDateTime.now().plusMinutes(5))
                .lastSentAt(LocalDateTime.now())
                .status(VerificationStatus.PENDING)
                .build());

        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);
        ExecutorService executor = Executors.newFixedThreadPool(2);
        try {
            java.util.concurrent.Callable<ErrorCode> request = () -> {
                ready.countDown();
                start.await();
                try {
                    service.verifyEmail(new VerifyEmailRequest("concurrent@example.com", "123456"));
                    return null;
                } catch (AppException exception) {
                    return exception.getErrorCode();
                }
            };

            Future<ErrorCode> first = executor.submit(request);
            Future<ErrorCode> second = executor.submit(request);
            assertEquals(true, ready.await(5, TimeUnit.SECONDS));
            start.countDown();

            List<ErrorCode> results = Arrays.asList(
                    first.get(10, TimeUnit.SECONDS),
                    second.get(10, TimeUnit.SECONDS));
            assertEquals(1, results.stream().filter(result -> result == null).count());
            assertEquals(1, results.stream()
                    .filter(result -> result == ErrorCode.OTP_ALREADY_VERIFIED)
                    .count());
        } finally {
            executor.shutdownNow();
        }

        EmailVerification stored = emailVerificationRepository.findById(verification.getId()).orElseThrow();
        assertEquals(VerificationStatus.VERIFIED, stored.getStatus());
        assertEquals(UserStatus.ACTIVE, userRepository.findById(user.getId()).orElseThrow().getStatus());
    }

    @Test
    void invalidAttemptIsCommittedEvenThoughServiceThrows() {
        User user = userRepository.saveAndFlush(User.builder()
                .email("attempt@example.com")
                .password("encoded-password")
                .status(UserStatus.PENDING_VERIFICATION)
                .build());
        EmailVerification verification = emailVerificationRepository.saveAndFlush(EmailVerification.builder()
                .user(user)
                .otpHash(otpHasher.hash("123456"))
                .type(VerificationType.REGISTER)
                .expiresAt(LocalDateTime.now().plusMinutes(5))
                .lastSentAt(LocalDateTime.now())
                .status(VerificationStatus.PENDING)
                .build());

        AppException exception = assertThrows(AppException.class,
                () -> service.verifyEmail(new VerifyEmailRequest("attempt@example.com", "000000")));

        assertEquals(ErrorCode.OTP_INVALID, exception.getErrorCode());
        EmailVerification stored = emailVerificationRepository.findById(verification.getId()).orElseThrow();
        assertEquals(1, stored.getAttempts());
        assertEquals(VerificationStatus.PENDING, stored.getStatus());
    }

    @TestConfiguration(proxyBeanMethods = false)
    static class OtpTestConfiguration {
        @Bean
        OtpProperties otpProperties() {
            OtpProperties properties = new OtpProperties();
            properties.setLength(6);
            properties.setExpirationMinutes(5);
            properties.setMaxAttempts(5);
            properties.setResendCooldownSeconds(60);
            properties.setMaxResends(5);
            properties.setHmacSecret("integration-test-otp-secret-at-least-thirty-two-bytes");
            return properties;
        }

        @Bean
        OtpHasher otpHasher(OtpProperties properties) {
            return new OtpHasher(properties);
        }

        @Bean
        EmailService emailService(OtpProperties properties) {
            return new EmailService(null, properties) {
                @Override
                public void sendOtp(String toEmail, String otp) {
                    // No mail delivery is needed for verification-only integration tests.
                }
            };
        }
    }
}
