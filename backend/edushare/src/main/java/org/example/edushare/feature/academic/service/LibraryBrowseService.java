package org.example.edushare.feature.academic.service;

import lombok.RequiredArgsConstructor;
import org.example.edushare.common.exception.AppException;
import org.example.edushare.common.exception.ErrorCode;
import org.example.edushare.feature.academic.entity.Subject;
import org.example.edushare.feature.academic.entity.SubjectFollow;
import org.example.edushare.feature.academic.repository.SubjectFollowRepository;
import org.example.edushare.feature.academic.repository.SubjectRepository;
import org.example.edushare.feature.document.dto.response.PublishedDocumentResponse;
import org.example.edushare.feature.document.entity.*;
import org.example.edushare.feature.document.repository.DocumentRepository;
import org.example.edushare.feature.document.service.PublishedDocumentService.Results;
import org.example.edushare.feature.user.entity.User;
import org.example.edushare.feature.user.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LibraryBrowseService {
    private final SubjectRepository subjects;
    private final SubjectFollowRepository follows;
    private final DocumentRepository documents;
    private final UserRepository users;

    public record SubjectSummary(String id, String code, String name, String description, String facultyId,
                                 String facultyName, int credits, long documentCount, long followerCount) {}
    public record SubjectDetail(SubjectSummary subject, Map<DocumentType, Long> documentTypes) {}
    public record FollowState(boolean followed, long followerCount) {}

    public Results<SubjectSummary> subjects(String query, String facultyId, String majorId, int page, int size, String email) {
        var rows = subjects.browse(search(query), blankToNull(facultyId), blankToNull(majorId),
                email == null ? null : user(email).getId(), DocumentStatus.APPROVED, ScanStatus.CLEAN, page(page, size));
        if (rows.isEmpty()) return new Results<>(List.of(), rows.getTotalElements(), rows.hasNext());
        var ids = rows.getContent().stream().map(Subject::getId).toList();
        var documentCounts = documents.countPublishedForSubjects(ids, DocumentStatus.APPROVED, ScanStatus.CLEAN).stream()
                .collect(Collectors.toMap(DocumentRepository.SubjectCount::getSubjectId, DocumentRepository.SubjectCount::getTotal));
        var followerCounts = follows.countForSubjects(ids).stream()
                .collect(Collectors.toMap(SubjectFollowRepository.SubjectCount::getSubjectId, SubjectFollowRepository.SubjectCount::getTotal));
        return new Results<>(rows.getContent().stream().map(subject -> summary(subject,
                documentCounts.getOrDefault(subject.getId(), 0L), followerCounts.getOrDefault(subject.getId(), 0L))).toList(),
                rows.getTotalElements(), rows.hasNext());
    }

    public SubjectDetail subject(String id) {
        Subject subject = findSubject(id);
        Map<DocumentType, Long> counts = new EnumMap<>(DocumentType.class);
        documents.countPublishedTypes(id, DocumentStatus.APPROVED, ScanStatus.CLEAN)
                .forEach(row -> counts.put(row.getDocumentType(), row.getTotal()));
        long total = counts.values().stream().mapToLong(Long::longValue).sum();
        return new SubjectDetail(summary(subject, total, follows.countBySubjectId(id)), counts);
    }

    public Results<PublishedDocumentResponse> documents(String query, String facultyId, String majorId, String subjectId,
                                                        DocumentType type, FileType fileType, String sort, int page, int size) {
        Sort order = switch (sort) {
            case "newest" -> Sort.by(Sort.Direction.DESC, "createdAt", "id");
            case "popular" -> Sort.by(Sort.Direction.DESC, "downloadCount", "viewCount", "createdAt", "id");
            case "rating" -> Sort.by(Sort.Direction.DESC, "averageRating", "downloadCount", "createdAt", "id");
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cách sắp xếp không hợp lệ.");
        };
        var rows = documents.browsePublished(search(query), blankToNull(subjectId), blankToNull(facultyId), blankToNull(majorId),
                type, fileType, DocumentStatus.APPROVED, ScanStatus.CLEAN, page(page, size).withSort(order));
        return new Results<>(rows.getContent().stream().map(PublishedDocumentResponse::from).toList(), rows.getTotalElements(), rows.hasNext());
    }

    public List<String> followedIds(String email) {
        return follows.findActiveSubjectIds(user(email).getId());
    }

    @Transactional
    public FollowState follow(String subjectId, String email, boolean followed) {
        Subject subject = subjects.findForFollow(subjectId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Môn học không tồn tại hoặc đã ngừng hiển thị."));
        User user = user(email);
        var existing = follows.findBySubjectIdAndUserId(subjectId, user.getId());
        if (followed && existing.isEmpty()) follows.saveAndFlush(new SubjectFollow(subject, user));
        if (!followed && existing.isPresent()) { follows.delete(existing.get()); follows.flush(); }
        return new FollowState(followed, follows.countBySubjectId(subjectId));
    }

    private Subject findSubject(String id) {
        return subjects.findByIdAndActiveTrue(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Môn học không tồn tại hoặc đã ngừng hiển thị."));
    }

    private SubjectSummary summary(Subject subject, long documents, long followers) {
        var faculty = subject.getFaculty();
        return new SubjectSummary(subject.getId(), subject.getCode(), subject.getName(), subject.getDescription(),
                faculty == null ? null : faculty.getId(), faculty == null ? null : faculty.getName(),
                subject.getCredits(), documents, followers);
    }

    private User user(String email) {
        return users.findByEmail(email).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
    }

    private PageRequest page(int page, int size) {
        if (size < 1 || size > 24 || page < 0 || page > Integer.MAX_VALUE / size)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Phân trang không hợp lệ.");
        return PageRequest.of(page, size);
    }

    private String search(String query) {
        if (query.length() > 200) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Từ khóa tối đa 200 ký tự.");
        return query.strip().toLowerCase(Locale.ROOT);
    }

    private String blankToNull(String value) { return value == null || value.isBlank() ? null : value; }
}
