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
@lombok.extern.slf4j.Slf4j
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

    private Map<String, Long> overviewCache;
    private long overviewExpiresAt;

    private void invalidateOverviewAfterCommit() {
        if (org.springframework.transaction.support.TransactionSynchronizationManager.isSynchronizationActive()) {
            org.springframework.transaction.support.TransactionSynchronizationManager.registerSynchronization(
                new org.springframework.transaction.support.TransactionSynchronization() {
                    @Override public void afterCommit() { clearOverview(); }
                });
        } else clearOverview();
    }

    private synchronized void clearOverview() { overviewCache = null; }

    @PreAuthorize("hasRole('ADMIN') or hasAuthority('OVERVIEW_VIEW')")
    public synchronized Map<String, Long> overview() {
        if (overviewCache != null && System.nanoTime() < overviewExpiresAt) return overviewCache;
        var counts = users.countStatuses().stream().collect(Collectors.toMap(UserRepository.StatusCount::getStatus, UserRepository.StatusCount::getTotal));
        overviewCache = Map.of("users", counts.values().stream().mapToLong(Long::longValue).sum(), "activeUsers", counts.getOrDefault(UserStatus.ACTIVE, 0L),
                "lockedUsers", counts.getOrDefault(UserStatus.BANNED, 0L) + counts.getOrDefault(UserStatus.INACTIVE, 0L),
                "faculties", faculties.count(), "subjects", subjects.count(), "documents", documents.count());
        overviewExpiresAt = System.nanoTime() + java.util.concurrent.TimeUnit.SECONDS.toNanos(30);
        return overviewCache;
    }

    @PreAuthorize("hasRole('ADMIN') or hasAuthority('USER_VIEW')")
    public Page<UserResponse> users(String search, String role, UserStatus status, int page) {
        var result = users.searchAdminRows(search.trim().toLowerCase(Locale.ROOT), role, status,
                PageRequest.of(Math.max(0, page), 10, Sort.by("createdAt").descending().and(Sort.by("id"))));
        if (result.isEmpty()) return result.map(row -> (UserResponse) null);
        var userRoles = users.findAdminRoles(result.getContent().stream().map(AdminUserRow::id).toList()).stream()
                .collect(Collectors.groupingBy(AdminUserRole::userId, Collectors.mapping(AdminUserRole::role, Collectors.toSet())));
        return result.map(row -> UserResponse.builder().id(row.id()).email(row.email()).fullName(row.fullName())
                .status(row.status()).createdAt(row.createdAt()).roles(userRoles.getOrDefault(row.id(), Set.of())).build());
    }

    @PreAuthorize("hasRole('ADMIN') or hasAuthority('USER_VIEW')")
    public List<String> roles() { return roles.findActiveRoleNames(); }

    @Transactional
    @PreAuthorize("hasRole('ADMIN') or hasAnyAuthority('USER_ROLE_ASSIGN', 'USER_BAN')")
    public UserResponse updateUser(String id, UserAccessRequest request) {
        invalidateOverviewAfterCommit();
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
        var auth = SecurityContextHolder.getContext().getAuthentication();
        var granted = auth.getAuthorities().stream().map(a -> a.getAuthority()).collect(Collectors.toSet());
        boolean admin = granted.contains("ROLE_ADMIN");
        var existing = user.getRoles().stream().map(Role::getName).collect(Collectors.toSet());
        if (!existing.equals(request.roles()) && !admin && !granted.contains("USER_ROLE_ASSIGN"))
            throw new org.springframework.security.access.AccessDeniedException("Thiếu quyền gán vai trò");
        if (request.status() != user.getStatus() && !admin && !granted.contains("USER_BAN"))
            throw new org.springframework.security.access.AccessDeniedException("Thiếu quyền khoá tài khoản");
        if (!admin && (existing.contains("ADMIN") || request.roles().contains("ADMIN")))
            throw new org.springframework.security.access.AccessDeniedException("Chỉ ADMIN được thay đổi tài khoản quản trị");
        if (selected.stream().anyMatch(r -> !r.isActive() && !existing.contains(r.getName())))
            throw conflict("Không thể gán vai trò đã ngừng hoạt động.");
        user.setRoles(selected);
        user.setStatus(request.status());
        log.info("Authorization change: action=ASSIGN_USER_ACCESS, actor={}, userId={}, roles={}, status={}",
                auth.getName(), user.getId(), request.roles(), request.status());
        return userResponse(user);
    }

    private UserResponse userResponse(User user) {
        return UserResponse.builder().id(user.getId()).email(user.getEmail())
                .fullName(user.getProfile() == null ? null : user.getProfile().getFullName())
                .roles(user.getRoles().stream().map(Role::getName).collect(Collectors.toSet()))
                .status(user.getStatus()).createdAt(user.getCreatedAt()).build();
    }

    @Transactional
    @PreAuthorize("@adminAuthorization.has('CATALOG_MANAGE', #id == null ? 'FACULTY_CREATE' : 'FACULTY_UPDATE')")
    public void saveFaculty(String id, CatalogRequest request) {
        invalidateOverviewAfterCommit();
        String code = request.code().trim().toUpperCase(Locale.ROOT);
        faculties.findByCode(code).filter(f -> !f.getId().equals(id)).ifPresent(f -> { throw conflict("Mã khoa đã tồn tại."); });
        Faculty faculty = id == null ? new Faculty() : faculties.findById(id).orElseThrow(() -> missing("Khoa"));
        faculty.setCode(code); faculty.setName(request.name().trim()); faculty.setDescription(request.description());
        faculties.saveAndFlush(faculty);
    }

    @Transactional
    @PreAuthorize("@adminAuthorization.has('CATALOG_MANAGE', 'FACULTY_DELETE')")
    public void deleteFaculty(String id) {
        invalidateOverviewAfterCommit();
        Faculty faculty = faculties.findById(id).orElseThrow(() -> missing("Khoa"));
        if (!faculty.getMajors().isEmpty() || subjects.existsByFacultyId(id)) {
            throw conflict("Khoa còn ngành hoặc môn học. Hãy chuyển hoặc xoá các dữ liệu liên quan trước.");
        }
        faculties.delete(faculty);
        faculties.flush();
    }

    @Transactional
    @PreAuthorize("@adminAuthorization.has('CATALOG_MANAGE', #id == null ? 'SUBJECT_CREATE' : 'SUBJECT_UPDATE')")
    public void saveSubject(String id, CatalogRequest request) {
        invalidateOverviewAfterCommit();
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
    @PreAuthorize("@adminAuthorization.has('CATALOG_MANAGE', 'SUBJECT_DELETE')")
    public void deleteSubject(String id) {
        invalidateOverviewAfterCommit();
        Subject subject = subjects.findById(id).orElseThrow(() -> missing("Môn học"));
        if (documents.existsBySubjectId(id)) throw conflict("Môn học đã có tài liệu, không thể xoá.");
        for (Major major : new HashSet<>(subject.getMajors())) major.getSubjects().remove(subject);
        subject.getMajors().clear();
        subjects.delete(subject);
        subjects.flush();
    }

    @Transactional
    @PreAuthorize("@adminAuthorization.has('CATALOG_MANAGE', #id == null ? 'MAJOR_CREATE' : 'MAJOR_UPDATE')")
    public void saveMajor(String id, CatalogRequest request) {
        invalidateOverviewAfterCommit();
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
    @PreAuthorize("@adminAuthorization.has('CATALOG_MANAGE', 'MAJOR_DELETE')")
    public void deleteMajor(String id) {
        invalidateOverviewAfterCommit();
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
