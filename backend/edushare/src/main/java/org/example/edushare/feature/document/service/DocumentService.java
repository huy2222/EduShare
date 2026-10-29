package org.example.edushare.feature.document.service;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.edushare.common.exception.AppException;
import org.example.edushare.common.exception.ErrorCode;
import org.example.edushare.feature.academic.entity.Subject;
import org.example.edushare.feature.academic.repository.FacultyRepository;
import org.example.edushare.feature.academic.repository.MajorRepository;
import org.example.edushare.feature.academic.repository.SubjectRepository;
import org.example.edushare.feature.document.dto.request.DocumentCreateRequest;
import org.example.edushare.feature.document.entity.Document;
import org.example.edushare.feature.document.entity.DocumentStatus;
import org.example.edushare.feature.document.entity.FileType;
import org.example.edushare.feature.document.entity.ScanStatus;
import org.example.edushare.feature.document.repository.DocumentRepository;
import org.example.edushare.feature.user.entity.User;
import org.example.edushare.feature.user.repository.UserRepository;
import org.example.edushare.infrastructure.storage.R2StorageService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@Service
@Validated
@RequiredArgsConstructor
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final UserRepository userRepository;
    private final R2StorageService storageService;
    private final FacultyRepository facultyRepository;
    private final MajorRepository majorRepository;
    private final SubjectRepository subjectRepository;

    @Transactional
    public Document create(@Valid DocumentCreateRequest request, MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new AppException(ErrorCode.DOCUMENT_FILE_EMPTY);
        }

        String fileName = StringUtils.getFilename(file.getOriginalFilename());
        FileType fileType = resolveFileType(fileName);
        User uploader = getCurrentUser();
        Subject subject = resolveSubject(request);
        String objectKey = storageService.upload(file);

        Document document = Document.builder()
                .title(request.getTitle().trim())
                .description(trimToNull(request.getDescription()))
                .fileUrl(objectKey)
                .fileName(fileName)
                .fileSize(file.getSize())
                .fileType(fileType)
                .documentType(request.getDocumentType())
                .semester(request.getSemester())
                .academicYear(trimToNull(request.getAcademicYear()))
                .uploader(uploader)
                .subject(subject)
                .build();

        try {
            return documentRepository.save(document);
        } catch (RuntimeException exception) {
            try {
                storageService.delete(objectKey);
            } catch (RuntimeException cleanupException) {
                exception.addSuppressed(cleanupException);
            }
            throw exception;
        }
    }

    @Transactional(readOnly = true)
    public Document getById(UUID documentId) {
        return findDocument(documentId);
    }

    @Transactional(readOnly = true)
    public Page<Document> getApproved(Pageable pageable) {
        return documentRepository.findAllByStatus(DocumentStatus.APPROVED, pageable);
    }

    @Transactional(readOnly = true)
    public List<Document> getCurrentUserDocuments() {
        return documentRepository.findAllByUploaderIdOrderByCreatedAtDesc(getCurrentUser().getId());
    }

    @Transactional
    public void incrementViewCount(UUID documentId) {
        if (documentRepository.incrementViewCount(documentId) == 0) {
            throw new AppException(ErrorCode.DOCUMENT_NOT_FOUND);
        }
    }

    @Transactional
    public void incrementDownloadCount(UUID documentId) {
        if (documentRepository.incrementDownloadCount(documentId) == 0) {
            throw new AppException(ErrorCode.DOCUMENT_NOT_FOUND);
        }
    }

    @Transactional
    public Document updateScanStatus(UUID documentId, ScanStatus scanStatus) {
        Document document = findDocument(documentId);
        document.setScanStatus(scanStatus);
        return document;
    }

    @Transactional
    public void delete(UUID documentId) {
        Document document = findDocument(documentId);
        User currentUser = getCurrentUser();
        boolean owner = document.getUploader().getId().equals(currentUser.getId());
        boolean administrator = SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream()
                .anyMatch(authority -> "ROLE_ADMIN".equals(authority.getAuthority()));

        if (!owner && !administrator) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        document.setStatus(DocumentStatus.DELETED);
    }

    private Document findDocument(UUID documentId) {
        return documentRepository.findById(documentId)
                .orElseThrow(() -> new AppException(ErrorCode.DOCUMENT_NOT_FOUND));
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
    }

    private FileType resolveFileType(String fileName) {
        try {
            return FileType.fromFileName(fileName);
        } catch (IllegalArgumentException exception) {
            throw new AppException(ErrorCode.DOCUMENT_FILE_TYPE_UNSUPPORTED);
        }
    }

    private Subject resolveSubject(DocumentCreateRequest request) {
        if (!facultyRepository.existsById(request.getFacultyId())) {
            throw new AppException(ErrorCode.FACULTY_NOT_FOUND);
        }

        majorRepository.findByIdAndFacultyId(request.getMajorId(), request.getFacultyId())
                .orElseThrow(() -> new AppException(ErrorCode.MAJOR_NOT_FOUND));

        return subjectRepository.findByIdAndMajorId(request.getSubjectId(), request.getMajorId())
                .orElseThrow(() -> new AppException(ErrorCode.SUBJECT_NOT_FOUND));
    }

    private String trimToNull(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim();
    }
}
