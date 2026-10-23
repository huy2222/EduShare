package org.example.edushare.common.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

@Getter
public enum ErrorCode {
    UNCATEGORIED_EXCEPTION(9999, "Uncategorized error", HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_KEY(1000, "Invalid message key", HttpStatus.BAD_REQUEST),
    INVALID_REQUEST(1001, "Invalid request", HttpStatus.BAD_REQUEST),
    USER_EXISTED(1002, "User already exists", HttpStatus.BAD_REQUEST),
    USERNAME_INVALID(1003, "USERNAME must be at least {min} characters", HttpStatus.BAD_REQUEST),
    PASSWORD_INVALID(1004, "PASSWORD must be at least {min} characters", HttpStatus.BAD_REQUEST),
    USER_NOT_EXISTED(1005, "User not exists", HttpStatus.NOT_FOUND),
    UNAUTHENTICATED(1006, "Unauthenticated", HttpStatus.UNAUTHORIZED),
    UNAUTHORIZED(1007, "You do not have permission", HttpStatus.FORBIDDEN),
    INVALID_DOB(1008, "Invalid date of birth. User must be at least {min} years old.", HttpStatus.BAD_REQUEST),
    EMAIL_DELIVERY_FAILED(1009, "Unable to send verification email", HttpStatus.SERVICE_UNAVAILABLE),
    OTP_INVALID(1010, "Invalid verification code", HttpStatus.BAD_REQUEST),
    OTP_EXPIRED(1011, "Verification code has expired", HttpStatus.BAD_REQUEST),
    OTP_BLOCKED(1012, "Verification code is blocked", HttpStatus.TOO_MANY_REQUESTS),
    EMAIL_ALREADY_VERIFIED(1013, "Email is already verified", HttpStatus.CONFLICT),
    OTP_RESEND_TOO_SOON(1014, "Please wait before requesting another verification code", HttpStatus.TOO_MANY_REQUESTS),
    EMAIL_NOT_VERIFIED(1015, "Email has not been verified", HttpStatus.FORBIDDEN),
    ACCOUNT_DISABLED(1016, "Account is inactive or banned", HttpStatus.FORBIDDEN),
    PERMISSION_NOT_FOUND(1017, "Permission not found", HttpStatus.NOT_FOUND),
    PERMISSION_EXISTED(1018, "Permission already exists", HttpStatus.CONFLICT),
    ROLE_NOT_FOUND(1019, "Role not found", HttpStatus.NOT_FOUND),
    ROLE_EXISTED(1020, "Role already exists", HttpStatus.CONFLICT),
    OTP_ALREADY_VERIFIED(1021, "Verification code has already been used", HttpStatus.CONFLICT),
    OTP_RESEND_LIMIT_EXCEEDED(1022, "Verification code resend limit exceeded", HttpStatus.TOO_MANY_REQUESTS),
    ACCOUNT_LINK_REQUIRED(1023, "Vui lòng xác nhận mật khẩu để liên kết tài khoản Google.", HttpStatus.OK),
    GOOGLE_TOKEN_INVALID(1024, "Google ID token is invalid", HttpStatus.UNAUTHORIZED),
    GOOGLE_TOKEN_EXPIRED(1025, "Google ID token has expired", HttpStatus.UNAUTHORIZED),
    GOOGLE_TOKEN_AUDIENCE_INVALID(1026, "Google ID token audience is invalid", HttpStatus.UNAUTHORIZED),
    GOOGLE_EMAIL_NOT_VERIFIED(1027, "Google email has not been verified", HttpStatus.FORBIDDEN),
    GOOGLE_AUTH_NOT_CONFIGURED(1028, "Google authentication is not configured", HttpStatus.SERVICE_UNAVAILABLE),
    LINK_TOKEN_INVALID(1029, "Account link token is invalid", HttpStatus.UNAUTHORIZED),
    LINK_TOKEN_EXPIRED(1030, "Account link token has expired", HttpStatus.UNAUTHORIZED),
    INVALID_PASSWORD(1031, "Mật khẩu không chính xác.", HttpStatus.UNAUTHORIZED),
    GOOGLE_PROVIDER_ALREADY_LINKED(1032, "Google account is already linked", HttpStatus.CONFLICT),
    LOCAL_CREDENTIALS_REQUIRED(1033, "This account does not have a local password", HttpStatus.CONFLICT),
    GOOGLE_VERIFICATION_UNAVAILABLE(1034, "Google token verification is temporarily unavailable", HttpStatus.SERVICE_UNAVAILABLE),

    @Deprecated
    INVALID_OTP(1010, "Invalid verification code", HttpStatus.BAD_REQUEST),
    @Deprecated
    OTP_ATTEMPTS_EXCEEDED(1012, "Too many invalid verification attempts", HttpStatus.TOO_MANY_REQUESTS);
    private int code;
    private String message;
    private HttpStatusCode statusCode;

    ErrorCode(int code, String message, HttpStatusCode statusCode) {
        this.code = code;
        this.message = message;
        this.statusCode = statusCode;
    }
}
