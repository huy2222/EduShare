package org.example.edushare.feature.user.service;

import lombok.RequiredArgsConstructor;
import org.example.edushare.common.exception.AppException;
import org.example.edushare.common.exception.ErrorCode;
import org.example.edushare.feature.academic.entity.Major;
import org.example.edushare.feature.academic.repository.MajorRepository;
import org.example.edushare.feature.user.dto.request.ProfileUpdateRequest;
import org.example.edushare.feature.user.dto.response.ProfileResponse;
import org.example.edushare.feature.user.entity.Profile;
import org.example.edushare.feature.user.entity.User;
import org.example.edushare.feature.user.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final UserRepository userRepository;
    private final MajorRepository majorRepository;

    @Transactional(readOnly = true)
    public ProfileResponse getMyProfile() {
        return toResponse(getAuthenticatedUser());
    }

    @Transactional
    public ProfileResponse updateMyProfile(ProfileUpdateRequest request) {
        User user = getAuthenticatedUser();
        Profile profile = user.getProfile();
        if (profile == null) {
            profile = Profile.builder().fullName(request.getFullName().trim()).build();
            user.attachProfile(profile);
        }

        profile.setFullName(request.getFullName().trim());
        profile.setPhone(trimToNull(request.getPhone()));
        profile.setBio(trimToNull(request.getBio()));
        profile.setGithubUrl(trimToNull(request.getGithubUrl()));
        profile.setLinkedinUrl(trimToNull(request.getLinkedinUrl()));
        profile.setMajor(resolveMajor(request.getFacultyId(), request.getMajorId()));

        userRepository.saveAndFlush(user);
        return toResponse(user);
    }

    private User getAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
    }

    private Major resolveMajor(String facultyId, String majorId) {
        boolean hasFaculty = StringUtils.hasText(facultyId);
        boolean hasMajor = StringUtils.hasText(majorId);
        if (!hasFaculty && !hasMajor) {
            return null;
        }
        if (!hasFaculty || !hasMajor) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
        return majorRepository.findByIdAndFacultyId(majorId.trim(), facultyId.trim())
                .orElseThrow(() -> new AppException(ErrorCode.MAJOR_NOT_FOUND));
    }

    private ProfileResponse toResponse(User user) {
        Profile profile = user.getProfile();
        Major major = profile == null ? null : profile.getMajor();

        return ProfileResponse.builder()
                .id(profile == null ? null : profile.getId())
                .fullName(profile == null ? null : profile.getFullName())
                .email(user.getEmail())
                .phone(profile == null ? null : profile.getPhone())
                .bio(profile == null ? null : profile.getBio())
                .facultyId(major == null ? null : major.getFaculty().getId())
                .facultyName(major == null ? null : major.getFaculty().getName())
                .majorId(major == null ? null : major.getId())
                .majorName(major == null ? null : major.getName())
                .githubUrl(profile == null ? null : profile.getGithubUrl())
                .linkedinUrl(profile == null ? null : profile.getLinkedinUrl())
                .createdAt(profile == null ? user.getCreatedAt() : profile.getCreatedAt())
                .updatedAt(profile == null ? user.getUpdatedAt() : profile.getUpdatedAt())
                .build();
    }

    private String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}
