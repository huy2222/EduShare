package org.example.edushare.feature.document.controller;

import org.example.edushare.feature.document.entity.Document;
import org.example.edushare.feature.document.entity.DocumentStatus;
import org.example.edushare.feature.document.entity.ScanStatus;
import org.example.edushare.feature.document.service.DocumentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.setup.MockMvcBuilders.standaloneSetup;

@ExtendWith(MockitoExtension.class)
class DocumentControllerTest {

    @Mock
    private DocumentService documentService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = standaloneSetup(new DocumentController(documentService)).build();
    }

    @Test
    void uploadAcceptsJsonMetadataAndFileParts() throws Exception {
        UUID documentId = UUID.randomUUID();
        MockMultipartFile metadata = new MockMultipartFile(
                "metadata",
                "metadata.json",
                MediaType.APPLICATION_JSON_VALUE,
                """
                        {
                          "title": "Slide Cấu trúc dữ liệu",
                          "description": "Chương 1",
                          "documentType": "LECTURE_NOTE",
                          "semester": "FIRST",
                          "academicYear": "2026-2027",
                          "facultyId": "faculty-id",
                          "majorId": "major-id",
                          "subjectId": "subject-id"
                        }
                        """.getBytes()
        );
        MockMultipartFile file = new MockMultipartFile(
                "file", "lecture.pdf", MediaType.APPLICATION_PDF_VALUE, "content".getBytes()
        );
        Document document = Document.builder()
                .id(documentId)
                .title("Slide Cấu trúc dữ liệu")
                .fileName("lecture.pdf")
                .fileUrl("documents/generated.pdf")
                .status(DocumentStatus.PENDING)
                .scanStatus(ScanStatus.PENDING)
                .createdAt(LocalDateTime.of(2026, 10, 28, 14, 0))
                .build();

        when(documentService.create(any(), any())).thenReturn(document);

        mockMvc.perform(multipart("/api/v1/documents/upload")
                        .file(metadata)
                        .file(file))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.id").value(documentId.toString()))
                .andExpect(jsonPath("$.result.objectKey").value("documents/generated.pdf"))
                .andExpect(jsonPath("$.result.status").value("PENDING"));
    }
}
