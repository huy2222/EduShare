package org.example.edushare.feature.academic.controller;

import jakarta.persistence.EntityManager;
import org.example.edushare.feature.academic.entity.*;
import org.example.edushare.feature.academic.repository.*;
import org.example.edushare.feature.document.entity.*;
import org.example.edushare.feature.document.repository.DocumentRepository;
import org.example.edushare.feature.user.entity.User;
import org.example.edushare.feature.user.repository.UserRepository;
import org.example.edushare.infrastructure.storage.R2StorageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.*;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.springframework.test.web.servlet.setup.MockMvcBuilders.webAppContextSetup;

@SpringBootTest(properties = "spring.datasource.url=jdbc:h2:mem:library-subjects;MODE=MySQL;DB_CLOSE_DELAY=-1")
@Transactional
class LibrarySubjectControllerTest {
    private static final String ROOT = "/api/v1/library";
    private static final String READER = "reader-subject@example.com";
    @Autowired private WebApplicationContext context;
    @Autowired private SubjectRepository subjects;
    @Autowired private FacultyRepository faculties;
    @Autowired private MajorRepository majors;
    @Autowired private DocumentRepository documents;
    @Autowired private UserRepository users;
    @Autowired private EntityManager entityManager;
    @MockitoBean private R2StorageService storage;
    @MockitoBean private org.example.edushare.config.AcademicDataInitializer academicInitializer;
    private MockMvc mvc;
    private User uploader;
    private Faculty faculty;
    private Major major;
    private Subject java;
    private Subject sql;

    @BeforeEach
    void setUp() {
        mvc = webAppContextSetup(context).apply(springSecurity()).build();
        uploader = users.save(User.builder().email("author-subject@example.com").build());
        users.save(User.builder().email(READER).build());
        faculty = faculties.save(Faculty.builder().code("CNTT").name("Công nghệ thông tin").build());
        major = majors.save(Major.builder().code("SE").name("Kỹ thuật phần mềm").faculty(faculty).build());
        java = subject("JAVA101", "Lập trình Java", true);
        sql = subject("DB101", "Cơ sở dữ liệu", true);
        major.addSubject(java);
        major.addSubject(sql);
        majors.saveAndFlush(major);
    }

    @Test
    void publicSubjectSearchFiltersAndPaginationUseRealPublishedCountsWithoutDuplicatingSharedSubjects() throws Exception {
        document("Đề Java", java, DocumentType.EXAM, 10, 4);
        Document hidden = document("Chờ duyệt", java, DocumentType.EXAM, 0, 0);
        hidden.setStatus(DocumentStatus.PENDING);
        documents.saveAndFlush(hidden);
        Subject inactive = subject("OLD101", "Môn đã ẩn", false);
        Major otherMajor = majors.save(Major.builder().code("CS").name("Khoa học máy tính").faculty(faculty).build());
        otherMajor.addSubject(java);
        majors.saveAndFlush(otherMajor);

        mvc.perform(get(ROOT + "/subjects").param("size", "1"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.result.total").value(2))
                .andExpect(jsonPath("$.result.hasNext").value(true))
                .andExpect(jsonPath("$.result.items[0].id").value(java.getId()))
                .andExpect(jsonPath("$.result.items[0].documentCount").value(1));
        mvc.perform(get(ROOT + "/subjects").param("size", "1").param("page", "1"))
                .andExpect(jsonPath("$.result.items[0].id").value(sql.getId()))
                .andExpect(jsonPath("$.result.hasNext").value(false));
        mvc.perform(get(ROOT + "/subjects").param("query", " java101 ").param("facultyId", faculty.getId()).param("majorId", major.getId()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.result.total").value(1))
                .andExpect(jsonPath("$.result.items[0].name").value("Lập trình Java"));
        mvc.perform(get(ROOT + "/subjects").param("facultyId", "missing"))
                .andExpect(jsonPath("$.result.total").value(0));
        mvc.perform(get(ROOT + "/subjects/" + inactive.getId())).andExpect(status().isNotFound());
        mvc.perform(get(ROOT + "/subjects/missing")).andExpect(status().isNotFound());
    }

    @Test
    void subjectDetailCountsOnlyApprovedCleanDocumentsAndGroupsTheirTypes() throws Exception {
        document("Đề thi", java, DocumentType.EXAM, 10, 4);
        document("Bài giảng", java, DocumentType.LECTURE_NOTE, 20, 5);
        Document unsafe = document("Chưa quét", java, DocumentType.EXAM, 100, 5);
        unsafe.setScanStatus(ScanStatus.PENDING);
        documents.saveAndFlush(unsafe);
        document("Môn khác", sql, DocumentType.EXAM, 100, 5);
        mvc.perform(get(ROOT + "/subjects/" + java.getId()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.result.subject.documentCount").value(2))
                .andExpect(jsonPath("$.result.documentTypes.EXAM").value(1))
                .andExpect(jsonPath("$.result.documentTypes.LECTURE_NOTE").value(1))
                .andExpect(jsonPath("$.result.subject.followerCount").value(0));
    }

    @Test
    void documentFiltersCombineCorrectlyAndSupportSortingAndPaginationWithoutLeakingUnpublishedFiles() throws Exception {
        Document exam = document("Java đề thi", java, DocumentType.EXAM, 50, 4);
        document("Java bài giảng", java, DocumentType.LECTURE_NOTE, 5, 5);
        document("Java SQL", sql, DocumentType.EXAM, 100, 5);
        Document pending = document("Java bí mật", java, DocumentType.EXAM, 1000, 5);
        pending.setStatus(DocumentStatus.PENDING);
        documents.saveAndFlush(pending);

        mvc.perform(get(ROOT + "/documents").param("query", "Java").param("subjectId", java.getId())
                        .param("facultyId", faculty.getId()).param("majorId", major.getId())
                        .param("documentType", "EXAM").param("fileType", "PDF"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.result.total").value(1))
                .andExpect(jsonPath("$.result.items[0].id").value(exam.getId().toString()))
                .andExpect(jsonPath("$.result.items[0].subjectId").value(java.getId()))
                .andExpect(jsonPath("$.result.items[0].objectKey").doesNotExist());
        mvc.perform(get(ROOT + "/documents").param("subjectId", java.getId()).param("sort", "popular").param("size", "1"))
                .andExpect(jsonPath("$.result.total").value(2)).andExpect(jsonPath("$.result.hasNext").value(true))
                .andExpect(jsonPath("$.result.items[0].id").value(exam.getId().toString()));
        mvc.perform(get(ROOT + "/documents").param("subjectId", java.getId()).param("sort", "rating").param("size", "1"))
                .andExpect(jsonPath("$.result.items[0].documentType").value("LECTURE_NOTE"));
        mvc.perform(get(ROOT + "/documents").param("subjectId", java.getId()).param("sort", "popular").param("size", "1").param("page", "1"))
                .andExpect(jsonPath("$.result.items[0].documentType").value("LECTURE_NOTE"))
                .andExpect(jsonPath("$.result.hasNext").value(false));
        mvc.perform(get(ROOT + "/documents").param("subjectId", java.getId()).param("majorId", "missing"))
                .andExpect(jsonPath("$.result.total").value(0));
    }

    @Test
    void followsAreIdempotentPersistPerAccountAndRestrictTheFollowedSubjectList() throws Exception {
        String follow = ROOT + "/me/subjects/" + java.getId() + "/follow";
        mvc.perform(put(follow).with(csrf())).andExpect(status().isUnauthorized());
        mvc.perform(get(ROOT + "/me/subjects")).andExpect(status().isUnauthorized());
        mvc.perform(get(ROOT + "/me/subject-follows")).andExpect(status().isUnauthorized());
        mvc.perform(put(follow).with(user(READER)).with(csrf()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.result.followed").value(true))
                .andExpect(jsonPath("$.result.followerCount").value(1));
        mvc.perform(put(follow).with(user(READER)).with(csrf())).andExpect(jsonPath("$.result.followerCount").value(1));
        entityManager.clear();
        mvc.perform(get(ROOT + "/me/subject-follows").with(user(READER)))
                .andExpect(jsonPath("$.result[0]").value(java.getId()));
        mvc.perform(get(ROOT + "/me/subjects").with(user(READER)))
                .andExpect(jsonPath("$.result.total").value(1)).andExpect(jsonPath("$.result.items[0].id").value(java.getId()));
        mvc.perform(get(ROOT + "/me/subjects").with(user(uploader.getEmail())))
                .andExpect(jsonPath("$.result.total").value(0));
        mvc.perform(get(ROOT + "/me/subjects").with(user(READER)).param("query", "DB101"))
                .andExpect(jsonPath("$.result.total").value(0));
        mvc.perform(delete(follow).with(user(READER)).with(csrf()))
                .andExpect(jsonPath("$.result.followed").value(false)).andExpect(jsonPath("$.result.followerCount").value(0));
        mvc.perform(delete(follow).with(user(READER)).with(csrf())).andExpect(jsonPath("$.result.followerCount").value(0));
        mvc.perform(get(ROOT + "/me/subjects").with(user(READER))).andExpect(jsonPath("$.result.total").value(0));
    }

    @Test
    void rejectsInvalidFiltersAndDoesNotFollowMissingOrInactiveSubjects() throws Exception {
        mvc.perform(get(ROOT + "/subjects").param("page", "-1")).andExpect(status().isBadRequest());
        mvc.perform(get(ROOT + "/subjects").param("size", "0")).andExpect(status().isBadRequest());
        mvc.perform(get(ROOT + "/documents").param("sort", "unsafe-field")).andExpect(status().isBadRequest());
        mvc.perform(get(ROOT + "/documents").param("documentType", "INVALID")).andExpect(status().isBadRequest());
        Subject inactive = subject("OLD101", "Môn đã ẩn", false);
        mvc.perform(put(ROOT + "/me/subjects/" + inactive.getId() + "/follow").with(user(READER)).with(csrf()))
                .andExpect(status().isNotFound());
        mvc.perform(put(ROOT + "/me/subjects/missing/follow").with(user(READER)).with(csrf()))
                .andExpect(status().isNotFound());
    }

    private Subject subject(String code, String name, boolean active) {
        return subjects.saveAndFlush(Subject.builder().code(code).name(name).description("Nội dung môn " + name)
                .faculty(faculty).credits(3).active(active).build());
    }

    private Document document(String title, Subject subject, DocumentType type, long downloads, double rating) {
        return documents.saveAndFlush(Document.builder().title(title).fileName("test.pdf").fileUrl("private/test.pdf")
                .fileSize(1024L).fileType(FileType.PDF).documentType(type).uploader(uploader).subject(subject)
                .status(DocumentStatus.APPROVED).scanStatus(ScanStatus.CLEAN).downloadCount(downloads).averageRating(rating).build());
    }
}
