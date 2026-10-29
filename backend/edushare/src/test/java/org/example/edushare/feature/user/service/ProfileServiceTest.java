package org.example.edushare.feature.user.service;

import org.example.edushare.common.exception.AppException;
import org.example.edushare.common.exception.ErrorCode;
import org.example.edushare.feature.academic.entity.Faculty;
import org.example.edushare.feature.academic.entity.Major;
import org.example.edushare.feature.academic.repository.FacultyRepository;
import org.example.edushare.feature.academic.repository.MajorRepository;
import org.example.edushare.feature.user.dto.request.ProfileUpdateRequest;
import org.example.edushare.feature.user.dto.response.ProfileResponse;
import org.example.edushare.feature.user.entity.Profile;
import org.example.edushare.feature.user.entity.User;
import org.example.edushare.feature.user.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DataJpaTest
@Import(ProfileService.class)
class ProfileServiceTest {

    @Autowired
    private ProfileService profileService;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private FacultyRepository facultyRepository;
    @Autowired
    private MajorRepository majorRepository;

    private User user;
    private Faculty faculty;
    private Major major;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.getContext().setAuthentication(
                new TestingAuthenticationToken("student@example.com", null, "USER"));

        faculty = facultyRepository.save(Faculty.builder()
                .code("FIT")
                .name("Công nghệ Thông tin")
                .build());
        major = majorRepository.save(Major.builder()
                .code("SE")
                .name("Kỹ thuật Phần mềm")
                .faculty(faculty)
                .build());
        Profile profile = Profile.builder()
                .fullName("Nguyễn Văn A")
                .phone("0900000000")
                .bio("Bio cũ")
                .major(major)
                .githubUrl("https://github.com/old")
                .build();
        user = User.builder()
                .email("student@example.com")
                .createdAt(LocalDateTime.of(2024, 9, 1, 8, 0))
                .updatedAt(LocalDateTime.of(2024, 9, 1, 8, 0))
                .build();
        user.attachProfile(profile);
        user = userRepository.saveAndFlush(user);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void returnsTheCurrentProfileWithAcademicAndSocialInformation() {
        ProfileResponse response = profileService.getMyProfile();

        assertThat(response.getEmail()).isEqualTo("student@example.com");
        assertThat(response.getFacultyName()).isEqualTo("Công nghệ Thông tin");
        assertThat(response.getMajorName()).isEqualTo("Kỹ thuật Phần mềm");
        assertThat(response.getGithubUrl()).isEqualTo("https://github.com/old");
    }

    @Test
    void updatesEditableProfileFieldsAndNormalizesBlankValues() {
        ProfileUpdateRequest request = new ProfileUpdateRequest(
                "  Nguyễn Văn B  ",
                " 0912345678 ",
                " Giới thiệu mới ",
                faculty.getId(),
                major.getId(),
                " https://github.com/new ",
                " https://linkedin.com/in/new ");

        ProfileResponse response = profileService.updateMyProfile(request);

        assertThat(response.getFullName()).isEqualTo("Nguyễn Văn B");
        assertThat(response.getPhone()).isEqualTo("0912345678");
        assertThat(response.getBio()).isEqualTo("Giới thiệu mới");
        assertThat(response.getGithubUrl()).isEqualTo("https://github.com/new");
        assertThat(response.getLinkedinUrl()).isEqualTo("https://linkedin.com/in/new");
        assertThat(userRepository.findById(user.getId()).orElseThrow().getProfile().getFullName())
                .isEqualTo("Nguyễn Văn B");
    }

    @Test
    void rejectsAMajorThatDoesNotBelongToTheSelectedFaculty() {
        ProfileUpdateRequest request = new ProfileUpdateRequest(
                "Nguyễn Văn A", null, null, "wrong-faculty", major.getId(), null, null);

        assertThatThrownBy(() -> profileService.updateMyProfile(request))
                .isInstanceOfSatisfying(AppException.class,
                        exception -> assertThat(exception.getErrorCode()).isEqualTo(ErrorCode.MAJOR_NOT_FOUND));
    }
}
