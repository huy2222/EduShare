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
import org.example.edushare.feature.document.entity.PreviewStatus;
import org.example.edushare.feature.document.repository.DocumentRepository;
import org.example.edushare.feature.user.entity.User;
import org.example.edushare.feature.user.repository.UserRepository;
import org.example.edushare.infrastructure.storage.R2StorageService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
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
    @PreAuthorize("@adminAuthorization.has('DOCUMENT_UPLOAD')")
    public Document create(@Valid DocumentCreateRequest request, MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new AppException(ErrorCode.DOCUMENT_FILE_EMPTY);
        }

        String fileName = StringUtils.getFilename(file.getOriginalFilename());
        FileType fileType = resolveFileType(fileName);
        User uploader = getCurrentUser();
        Subject subject = resolveSubject(request);
        String quarantineKey = storageService.uploadToQuarantine(file);
        Document document = Document.builder()
                .title(request.getTitle().trim())
                .description(trimToNull(request.getDescription()))
                .fileUrl(quarantineKey)
                .fileName(fileName)
                .fileSize(file.getSize())
                .fileType(fileType)
                .documentType(request.getDocumentType())
                .semester(request.getSemester())
                .academicYear(trimToNull(request.getAcademicYear()))
                .uploader(uploader)
                .subject(subject)
                .scanStatus(ScanStatus.PENDING)
                .previewStatus(requiresPdfPreview(fileType) ? PreviewStatus.PENDING : PreviewStatus.NOT_REQUIRED)
                .build();

        try {
            return documentRepository.save(document);
        } catch (RuntimeException exception) {
            try {
                storageService.delete(quarantineKey);
            } catch (RuntimeException cleanupException) {
                exception.addSuppressed(cleanupException);
            }
            throw exception;
        }
    }

    @Transactional(readOnly = true)
    @org.springframework.security.access.prepost.PreAuthorize("@adminAuthorization.has('DOCUMENT_VIEW')")
    public Document getById(UUID documentId) {
        return findDocument(documentId);
    }

    @Transactional(readOnly = true)
    @org.springframework.security.access.prepost.PreAuthorize("@adminAuthorization.has('DOCUMENT_VIEW')")
    public Page<Document> getApproved(Pageable pageable) {
        return documentRepository.findAllByStatus(DocumentStatus.APPROVED, pageable);
    }

    @Transactional(readOnly = true)
    @org.springframework.security.access.prepost.PreAuthorize("@adminAuthorization.has('DOCUMENT_VIEW')")
    public List<Document> getCurrentUserDocuments() {
        return documentRepository.findAllByUploaderIdOrderByCreatedAtDesc(getCurrentUser().getId());
    }

    @Transactional(readOnly = true)
    @PreAuthorize("@adminAuthorization.has('DOCUMENT_UPLOAD')")
    public Document getCurrentUserDocument(UUID documentId) {
        Document document = findDocument(documentId);
        if (!document.getUploader().getId().equals(getCurrentUser().getId())) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        return document;
    }

    @Transactional
    @org.springframework.security.access.prepost.PreAuthorize("@adminAuthorization.has('DOCUMENT_VIEW')")
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
                .anyMatch(authority -> ("ROLE_ADMIN".equals(authority.getAuthority()) || "DOCUMENT_DELETE_ANY".equals(authority.getAuthority())));

        boolean canDeleteOwn = SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream()
                .anyMatch(a -> "DOCUMENT_DELETE_OWN".equals(a.getAuthority()));
        if (!administrator && (!owner || !canDeleteOwn)) {
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

    private boolean requiresPdfPreview(FileType fileType) {
        return fileType == FileType.DOC || fileType == FileType.DOCX;
    }
}
