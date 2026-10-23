package org.example.edushare.feature.notification.service;

import lombok.RequiredArgsConstructor;
import org.example.edushare.common.exception.AppException;
import org.example.edushare.common.exception.ErrorCode;
import org.example.edushare.feature.auth.config.OtpProperties;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;
    private final OtpProperties otpProperties;

    @Value("${app.mail.from:${spring.mail.username:}}")
    private String fromEmail;

    public void sendOtp(String toEmail, String otp) {
        SimpleMailMessage message = new SimpleMailMessage();

        message.setFrom(fromEmail);
        message.setTo(toEmail);
        message.setSubject("EduShare - Xác thực tài khoản");

        message.setText(
                "Mã xác thực tài khoản EduShare của bạn là: "
                        + otp
                        + "\n\nMã có hiệu lực trong " + otpProperties.getExpirationMinutes() + " phút."
                        + "\nKhông chia sẻ mã này với bất kỳ ai."
        );

        try {
            mailSender.send(message);
        } catch (MailException | IllegalArgumentException exception) {
            throw new AppException(ErrorCode.EMAIL_DELIVERY_FAILED);
        }
    }
}
