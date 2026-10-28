package org.example.edushare.feature.document.service;

import org.example.edushare.common.exception.AppException;
import org.example.edushare.common.exception.ErrorCode;
import org.example.edushare.feature.academic.entity.Major;
import org.example.edushare.feature.academic.entity.Subject;
import org.example.edushare.feature.academic.repository.FacultyRepository;
import org.example.edushare.feature.academic.repository.MajorRepository;
import org.example.edushare.feature.academic.repository.SubjectRepository;
import org.example.edushare.feature.document.dto.request.DocumentCreateRequest;
import org.example.edushare.feature.document.entity.Document;
import org.example.edushare.feature.document.entity.DocumentType;
import org.example.edushare.feature.document.entity.FileType;
import org.example.edushare.feature.document.entity.Semester;
import org.example.edushare.feature.document.repository.DocumentRepository;
import org.example.edushare.feature.user.entity.User;
import org.example.edushare.feature.user.repository.UserRepository;
import org.example.edushare.infrastructure.storage.R2StorageService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DocumentServiceTest {

    @Mock
    private DocumentRepository documentRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private R2StorageService storageService;
    @Mock
    private FacultyRepository facultyRepository;
    @Mock
    private MajorRepository majorRepository;
    @Mock
    private SubjectRepository subjectRepository;

    private DocumentService documentService;

    @BeforeEach
    void setUp() {
        documentService = new DocumentService(
                documentRepository,
                userRepository,
                storageService,
                facultyRepository,
                majorRepository,
                subjectRepository
        );
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("student@example.com", "", List.of())
        );
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void createUploadsFileAndPersistsDocumentMetadata() throws IOException {
        User uploader = User.builder().id("user-id").email("student@example.com").build();
        Major major = Major.builder().id("major-id").build();
        Subject subject = Subject.builder()
                .id("subject-id").code("INT1301").name("Data Structures").credits(3).build();
        MockMultipartFile file = new MockMultipartFile(
                "file", "lecture.PDF", "application/pdf", "content".getBytes()
        );
        DocumentCreateRequest request = DocumentCreateRequest.builder()
                .title("Lecture 1")
                .description("Introduction")
                .documentType(DocumentType.LECTURE_NOTE)
                .semester(Semester.FIRST)
                .academicYear("2026-2027")
                .facultyId("faculty-id")
                .majorId("major-id")
                .subjectId("subject-id")
                .build();

        when(userRepository.findByEmail("student@example.com")).thenReturn(Optional.of(uploader));
        when(facultyRepository.existsById("faculty-id")).thenReturn(true);
        when(majorRepository.findByIdAndFacultyId("major-id", "faculty-id"))
                .thenReturn(Optional.of(major));
        when(subjectRepository.findByIdAndMajorId("subject-id", "major-id"))
                .thenReturn(Optional.of(subject));
        when(storageService.upload(file)).thenReturn("documents/generated.pdf");
        when(documentRepository.save(any(Document.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Document result = documentService.create(request, file);

        assertEquals("Lecture 1", result.getTitle());
        assertEquals("documents/generated.pdf", result.getFileUrl());
        assertEquals("lecture.PDF", result.getFileName());
        assertEquals(FileType.PDF, result.getFileType());
        assertEquals(DocumentType.LECTURE_NOTE, result.getDocumentType());
        assertEquals(uploader, result.getUploader());
        assertEquals(subject, result.getSubject());
    }

    @Test
    void createRejectsUnsupportedFileBeforeUploading() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
                "file", "archive.zip", "application/zip", "content".getBytes()
        );
        DocumentCreateRequest request = DocumentCreateRequest.builder()
                .title("Archive")
                .documentType(DocumentType.OTHER)
                .facultyId("faculty-id")
                .majorId("major-id")
                .subjectId("subject-id")
                .build();

        AppException exception = assertThrows(
                AppException.class,
                () -> documentService.create(request, file)
        );

        assertEquals(ErrorCode.DOCUMENT_FILE_TYPE_UNSUPPORTED, exception.getErrorCode());
        verify(storageService, never()).upload(any());
        verify(documentRepository, never()).save(any());
    }

    @Test
    void createRejectsMajorOutsideSelectedFacultyBeforeUploading() throws IOException {
        User uploader = User.builder().id("user-id").email("student@example.com").build();
        MockMultipartFile file = new MockMultipartFile(
                "file", "lecture.pdf", "application/pdf", "content".getBytes()
        );
        DocumentCreateRequest request = DocumentCreateRequest.builder()
                .title("Lecture")
                .documentType(DocumentType.LECTURE_NOTE)
                .facultyId("faculty-id")
                .majorId("major-id")
                .subjectId("subject-id")
                .build();

        when(userRepository.findByEmail("student@example.com")).thenReturn(Optional.of(uploader));
        when(facultyRepository.existsById("faculty-id")).thenReturn(true);
        when(majorRepository.findByIdAndFacultyId("major-id", "faculty-id"))
                .thenReturn(Optional.empty());

        AppException exception = assertThrows(
                AppException.class,
                () -> documentService.create(request, file)
        );

        assertEquals(ErrorCode.MAJOR_NOT_FOUND, exception.getErrorCode());
        verify(storageService, never()).upload(any());
        verify(documentRepository, never()).save(any());
    }
}
