package org.example.edushare.feature.user.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.edushare.common.response.ApiResponse;
import org.example.edushare.feature.user.dto.request.ProfileUpdateRequest;
import org.example.edushare.feature.user.dto.response.ProfileResponse;
import org.example.edushare.feature.user.dto.response.UserResponse;
import org.example.edushare.feature.user.service.ProfileService;
import org.example.edushare.feature.user.service.UserService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({"/users", "/api/v1/users"})
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;
    private final ProfileService profileService;

    @GetMapping("/me")
    public ApiResponse<UserResponse> me() {
        return ApiResponse.<UserResponse>builder()
                .result(userService.getMyInfo())
                .build();
    }

    @GetMapping("/me/profile")
    public ApiResponse<ProfileResponse> getMyProfile() {
        return ApiResponse.<ProfileResponse>builder()
                .result(profileService.getMyProfile())
                .build();
    }

    @PutMapping("/me/profile")
    public ApiResponse<ProfileResponse> updateMyProfile(
            @Valid @RequestBody ProfileUpdateRequest request) {
        return ApiResponse.<ProfileResponse>builder()
                .result(profileService.updateMyProfile(request))
                .build();
    }
}
