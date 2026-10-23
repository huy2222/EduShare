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
    INVALID_OTP(1010, "Invalid verification code", HttpStatus.BAD_REQUEST),
    OTP_EXPIRED(1011, "Verification code has expired", HttpStatus.BAD_REQUEST),
    OTP_ATTEMPTS_EXCEEDED(1012, "Too many invalid verification attempts", HttpStatus.TOO_MANY_REQUESTS),
    EMAIL_ALREADY_VERIFIED(1013, "Email is already verified", HttpStatus.CONFLICT),
    OTP_RESEND_TOO_SOON(1014, "Please wait before requesting another verification code", HttpStatus.TOO_MANY_REQUESTS),
    EMAIL_NOT_VERIFIED(1015, "Email has not been verified", HttpStatus.FORBIDDEN),
    ACCOUNT_DISABLED(1016, "Account is inactive or banned", HttpStatus.FORBIDDEN),
    PERMISSION_NOT_FOUND(1017, "Permission not found", HttpStatus.NOT_FOUND),
    PERMISSION_EXISTED(1018, "Permission already exists", HttpStatus.CONFLICT),
    ROLE_NOT_FOUND(1019, "Role not found", HttpStatus.NOT_FOUND),
    ROLE_EXISTED(1020, "Role already exists", HttpStatus.CONFLICT);
    private int code;
    private String message;
    private HttpStatusCode statusCode;

    ErrorCode(int code, String message, HttpStatusCode statusCode) {
        this.code = code;
        this.message = message;
        this.statusCode = statusCode;
    }
}
