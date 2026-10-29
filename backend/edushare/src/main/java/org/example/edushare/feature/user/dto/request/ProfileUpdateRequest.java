package org.example.edushare.feature.user.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProfileUpdateRequest {

    private static final String OPTIONAL_HTTP_URL = "^$|https?://[^\\s]+$";

    @NotBlank(message = "Họ và tên không được để trống.")
    @Size(max = 100, message = "Họ và tên không được vượt quá 100 ký tự.")
    private String fullName;

    @Size(max = 20, message = "Số điện thoại không được vượt quá 20 ký tự.")
    private String phone;

    @Size(max = 1000, message = "Giới thiệu bản thân không được vượt quá 1000 ký tự.")
    private String bio;

    private String facultyId;
    private String majorId;

    @Size(max = 500, message = "Liên kết GitHub không được vượt quá 500 ký tự.")
    @Pattern(regexp = OPTIONAL_HTTP_URL, message = "Liên kết GitHub không hợp lệ.")
    private String githubUrl;

    @Size(max = 500, message = "Liên kết LinkedIn không được vượt quá 500 ký tự.")
    @Pattern(regexp = OPTIONAL_HTTP_URL, message = "Liên kết LinkedIn không hợp lệ.")
    private String linkedinUrl;
}
