package org.example.edushare.feature.admin.service;

import lombok.RequiredArgsConstructor;
import org.example.edushare.feature.admin.dto.*;
import org.example.edushare.feature.academic.entity.*;
import org.example.edushare.feature.academic.repository.*;
import org.example.edushare.feature.auth.entity.Role;
import org.example.edushare.feature.auth.repository.RoleRepository;
import org.example.edushare.feature.document.repository.DocumentRepository;
import org.example.edushare.feature.user.entity.*;
import org.example.edushare.feature.user.dto.response.UserResponse;
import org.example.edushare.feature.user.repository.UserRepository;
import org.springframework.data.domain.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@PreAuthorize("hasRole('ADMIN')")
public class AdminService {
    private final UserRepository users;
    private final RoleRepository roles;
    private final FacultyRepository faculties;
    private final SubjectRepository subjects;
    private final MajorRepository majors;
    private final DocumentRepository documents;

    public Map<String, Long> overview() {
        var counts = users.countStatuses().stream().collect(Collectors.toMap(UserRepository.StatusCount::getStatus, UserRepository.StatusCount::getTotal));
        return Map.of("users", counts.values().stream().mapToLong(Long::longValue).sum(), "activeUsers", counts.getOrDefault(UserStatus.ACTIVE, 0L),
                "lockedUsers", counts.getOrDefault(UserStatus.BANNED, 0L) + counts.getOrDefault(UserStatus.INACTIVE, 0L),
                "faculties", faculties.count(), "subjects", subjects.count(), "documents", documents.count());
    }

    public Page<UserResponse> users(String search, String role, UserStatus status, int page) {
        var result = users.searchAdmin(search.trim().toLowerCase(Locale.ROOT), role, status,
                PageRequest.of(Math.max(0, page), 10, Sort.by("createdAt").descending().and(Sort.by("id"))));
        if (result.isEmpty()) return result.map(this::userResponse);
        var details = users.findAdminDetails(result.getContent().stream().map(User::getId).toList()).stream()
                .collect(Collectors.toMap(User::getId, this::userResponse));
        return result.map(user -> details.get(user.getId()));
    }

    public List<String> roles() { return roles.findAll().stream().map(Role::getName).sorted().toList(); }

    @Transactional
    public UserResponse updateUser(String id, UserAccessRequest request) {
        User user = users.findByIdForUpdate(id).orElseThrow(() -> missing("Người dùng"));
        if (user.getEmail().equals(SecurityContextHolder.getContext().getAuthentication().getName())) {
            throw conflict("Không thể thay đổi quyền hoặc khoá tài khoản đang sử dụng.");
        }
        if (user.getStatus() == UserStatus.PENDING_VERIFICATION && request.status() != UserStatus.PENDING_VERIFICATION
                || user.getStatus() != UserStatus.PENDING_VERIFICATION && request.status() == UserStatus.PENDING_VERIFICATION) {
            throw conflict("Không thể thay đổi trạng thái xác thực email từ trang quản trị.");
        }
        Set<Role> selected = request.roles().stream().map(name -> roles.findByName(name)
                .orElseThrow(() -> conflict("Vai trò không hợp lệ."))).collect(Collectors.toSet());
        user.setRoles(selected);
        user.setStatus(request.status());
        return userResponse(user);
    }

    private UserResponse userResponse(User user) {
        return UserResponse.builder().id(user.getId()).email(user.getEmail())
                .fullName(user.getProfile() == null ? null : user.getProfile().getFullName())
                .roles(user.getRoles().stream().map(Role::getName).collect(Collectors.toSet()))
                .status(user.getStatus()).createdAt(user.getCreatedAt()).build();
    }

    public List<Map<String, Object>> faculties() {
        return faculties.findAdminCatalog().stream().map(f -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", f.getId()); row.put("code", f.getCode()); row.put("name", f.getName());
            row.put("description", f.getDescription());
            row.put("majors", f.getMajors().stream().map(m -> Map.of("id", m.getId(), "name", m.getName())).toList());
            return row;
        }).toList();
    }

    public List<Map<String, Object>> subjects() {
        return subjects.findAdminCatalog().stream().map(s -> {
            Map<String, Object> row = new LinkedHashMap<>();
            Faculty faculty = s.getFaculty();
            if (faculty == null && !s.getMajors().isEmpty()) faculty = s.getMajors().iterator().next().getFaculty();
            row.put("id", s.getId()); row.put("code", s.getCode()); row.put("name", s.getName());
            row.put("description", s.getDescription()); row.put("credits", s.getCredits());
            row.put("facultyId", faculty == null ? "" : faculty.getId());
            row.put("facultyName", faculty == null ? "Chưa phân khoa" : faculty.getName());
            row.put("majorIds", s.getMajors().stream().map(Major::getId).toList());
            return row;
        }).toList();
    }

    @Transactional
    public void saveFaculty(String id, CatalogRequest request) {
        String code = request.code().trim().toUpperCase(Locale.ROOT);
        faculties.findByCode(code).filter(f -> !f.getId().equals(id)).ifPresent(f -> { throw conflict("Mã khoa đã tồn tại."); });
        Faculty faculty = id == null ? new Faculty() : faculties.findById(id).orElseThrow(() -> missing("Khoa"));
        faculty.setCode(code); faculty.setName(request.name().trim()); faculty.setDescription(request.description());
        faculties.saveAndFlush(faculty);
    }

    @Transactional
    public void deleteFaculty(String id) {
        Faculty faculty = faculties.findById(id).orElseThrow(() -> missing("Khoa"));
        if (!faculty.getMajors().isEmpty() || subjects.existsByFacultyId(id)) {
            throw conflict("Khoa còn ngành hoặc môn học. Hãy chuyển hoặc xoá các dữ liệu liên quan trước.");
        }
        faculties.delete(faculty);
        faculties.flush();
    }

    @Transactional
    public void saveSubject(String id, CatalogRequest request) {
        if (request.facultyId() == null || request.credits() == null) throw conflict("Vui lòng chọn khoa và số tín chỉ.");
        Faculty faculty = faculties.findById(request.facultyId()).orElseThrow(() -> missing("Khoa"));
        String code = request.code().trim().toUpperCase(Locale.ROOT);
        subjects.findByCode(code).filter(s -> !s.getId().equals(id)).ifPresent(s -> { throw conflict("Mã môn học đã tồn tại."); });
        Subject subject = id == null ? new Subject() : subjects.findById(id).orElseThrow(() -> missing("Môn học"));
        Set<Major> selected = new HashSet<>();
        for (String majorId : request.majorIds() == null ? Set.<String>of() : request.majorIds()) {
            selected.add(majors.findById(majorId).orElseThrow(() -> missing("Ngành")));
        }
        subject.setCode(code); subject.setName(request.name().trim()); subject.setDescription(request.description());
        subject.setFaculty(faculty); subject.setCredits(request.credits());
        for (Major major : new HashSet<>(subject.getMajors())) major.getSubjects().remove(subject);
        subject.getMajors().clear();
        subjects.save(subject);
        for (Major major : selected) major.addSubject(subject);
        subjects.flush();
    }

    @Transactional
    public void deleteSubject(String id) {
        Subject subject = subjects.findById(id).orElseThrow(() -> missing("Môn học"));
        if (documents.existsBySubjectId(id)) throw conflict("Môn học đã có tài liệu, không thể xoá.");
        for (Major major : new HashSet<>(subject.getMajors())) major.getSubjects().remove(subject);
        subject.getMajors().clear();
        subjects.delete(subject);
        subjects.flush();
    }

    public List<Map<String, Object>> majors() {
        return majors.findAdminCatalog().stream().map(m -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", m.getId());
            row.put("code", m.getCode());
            row.put("name", m.getName());
            row.put("description", m.getDescription());
            row.put("facultyId", m.getFaculty().getId());
            row.put("facultyName", m.getFaculty().getName());
            return row;
        }).toList();
    }

    @Transactional
    public void saveMajor(String id, CatalogRequest request) {
        if (request.facultyId() == null) throw conflict("Vui lòng chọn khoa quản lý ngành.");
        Faculty faculty = faculties.findById(request.facultyId()).orElseThrow(() -> missing("Khoa"));
        String code = request.code().trim().toUpperCase(Locale.ROOT);
        majors.findByCode(code).filter(m -> !m.getId().equals(id)).ifPresent(m -> { throw conflict("Mã ngành đã tồn tại."); });
        Major major = id == null ? new Major() : majors.findById(id).orElseThrow(() -> missing("Ngành"));
        major.setCode(code);
        major.setName(request.name().trim());
        major.setDescription(request.description());
        major.setFaculty(faculty);
        majors.saveAndFlush(major);
    }

    @Transactional
    public void deleteMajor(String id) {
        Major major = majors.findById(id).orElseThrow(() -> missing("Ngành"));
        if (!major.getSubjects().isEmpty() || users.existsByProfileMajorId(id)) {
            throw conflict("Ngành còn môn học hoặc người dùng. Hãy chuyển dữ liệu liên quan trước khi xoá.");
        }
        majors.delete(major);
        majors.flush();
    }

    private ResponseStatusException missing(String type) { return new ResponseStatusException(HttpStatus.NOT_FOUND, type + " không tồn tại."); }
    private ResponseStatusException conflict(String message) { return new ResponseStatusException(HttpStatus.CONFLICT, message); }
}
