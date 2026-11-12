package org.example.edushare.feature.document.controller;

import com.jayway.jsonpath.JsonPath;
import jakarta.persistence.EntityManager;
import org.example.edushare.feature.academic.entity.Subject;
import org.example.edushare.feature.academic.repository.SubjectRepository;
import org.example.edushare.feature.document.entity.Document;
import org.example.edushare.feature.document.entity.DocumentStatus;
import org.example.edushare.feature.document.entity.DocumentType;
import org.example.edushare.feature.document.entity.FileType;
import org.example.edushare.feature.document.entity.ScanStatus;
import org.example.edushare.feature.document.repository.DocumentRepository;
import org.example.edushare.feature.user.entity.User;
import org.example.edushare.feature.user.repository.UserRepository;
import org.example.edushare.infrastructure.storage.R2StorageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;
import software.amazon.awssdk.core.ResponseBytes;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;

import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.springframework.test.web.servlet.setup.MockMvcBuilders.webAppContextSetup;

@SpringBootTest(properties = "spring.datasource.url=jdbc:h2:mem:published-documents;MODE=MySQL;DB_CLOSE_DELAY=-1")
@Transactional
class PublishedDocumentControllerTest {
    private static final String LIBRARY = "/api/v1/library";
    private static final String READER = "reader@example.com";

    @Autowired private WebApplicationContext context;
    @Autowired private DocumentRepository documents;
    @Autowired private SubjectRepository subjects;
    @Autowired private UserRepository users;
    @Autowired private EntityManager entityManager;
    @MockitoBean private R2StorageService storage;

    private MockMvc mvc;
    private User uploader;
    private Subject subject;

    @BeforeEach
    void setUp() {
        mvc = webAppContextSetup(context).apply(springSecurity()).build();
        uploader = users.save(User.builder().email("uploader@example.com").build());
        users.save(User.builder().email(READER).build());
        subject = subjects.save(Subject.builder().code("JAVA101").name("Lập trình Java").credits(3).build());
    }

    @Test
    void guestCanReadOnlyApprovedCleanDocumentsAndTheirFiles() throws Exception {
        Document visible = createDocument(DocumentStatus.APPROVED, ScanStatus.CLEAN);
        Document pending = createDocument(DocumentStatus.PENDING, ScanStatus.CLEAN);
        Document unscanned = createDocument(DocumentStatus.APPROVED, ScanStatus.PENDING);
        String visiblePath = LIBRARY + "/documents/" + visible.getId();
        byte[] file = {1, 2, 3};
        when(storage.getObjectBytes(visible.getFileUrl()))
                .thenReturn(ResponseBytes.fromByteArray(GetObjectResponse.builder().build(), file));

        mvc.perform(get(LIBRARY + "/documents").param("query", "JAVA101"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.total").value(1))
                .andExpect(jsonPath("$.result.items[0].id").value(visible.getId().toString()))
                .andExpect(jsonPath("$.result.items[0].objectKey").doesNotExist())
                .andExpect(jsonPath("$.result.items[0].uploaderEmail").doesNotExist());
        mvc.perform(get(visiblePath))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.previewAvailable").value(true))
                .andExpect(jsonPath("$.result.document.views").value(1));
        mvc.perform(get(visiblePath + "/preview"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_PDF))
                .andExpect(content().bytes(file));
        mvc.perform(get(visiblePath + "/download"))
                .andExpect(status().isOk()).andExpect(content().bytes(file));
        mvc.perform(get(LIBRARY + "/documents/" + pending.getId() + "/preview"))
                .andExpect(status().isNotFound());
        mvc.perform(get(LIBRARY + "/documents/" + unscanned.getId()))
                .andExpect(status().isNotFound());
        mvc.perform(get(LIBRARY + "/me/favorites")).andExpect(status().isUnauthorized());
        mvc.perform(post(LIBRARY + "/me/documents/" + visible.getId() + "/comments").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content("{\"body\":\"Guest\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void zeroStarRatingCommentsAndFavoritesPersistPerAccount() throws Exception {
        Document visible = createDocument(DocumentStatus.APPROVED, ScanStatus.CLEAN);
        String publicPath = LIBRARY + "/documents/" + visible.getId();
        String interaction = LIBRARY + "/me/documents/" + visible.getId();

        mvc.perform(put(interaction + "/rating").with(user(READER)).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content("{\"stars\":0}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.total").value(1))
                .andExpect(jsonPath("$.result.counts[0]").value(1));
        mvc.perform(put(interaction + "/rating").with(user(READER)).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content("{\"stars\":5}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.total").value(1))
                .andExpect(jsonPath("$.result.average").value(5));
        mvc.perform(put(interaction + "/rating").with(user(READER)).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content("{\"stars\":2.5}"))
                .andExpect(status().isBadRequest());

        mvc.perform(put(interaction + "/favorite").with(user(READER)).with(csrf()))
                .andExpect(status().isOk());
        entityManager.flush();
        entityManager.createNativeQuery("update document_interactions set favorited_at = null")
                .executeUpdate();
        entityManager.clear();
        mvc.perform(get(interaction).with(user(READER)))
                .andExpect(jsonPath("$.result.favorite").value(true));
        mvc.perform(get(LIBRARY + "/me/favorites").with(user(READER)).param("query", "JAVA101"))
                .andExpect(jsonPath("$.result.items[0].id").value(visible.getId().toString()));
        mvc.perform(get(LIBRARY + "/me/favorites").with(user(READER)).param("query", "unmatched"))
                .andExpect(jsonPath("$.result.total").value(0));
        mvc.perform(get(LIBRARY + "/me/favorites").with(user(uploader.getEmail())))
                .andExpect(jsonPath("$.result.total").value(0));
        mvc.perform(delete(interaction + "/favorite").with(user(READER)).with(csrf()))
                .andExpect(status().isOk());
        mvc.perform(get(interaction).with(user(READER)))
                .andExpect(jsonPath("$.result.favorite").value(false))
                .andExpect(jsonPath("$.result.rating").value(5));

        mvc.perform(post(interaction + "/comments").with(user(READER)).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content("{\"body\":\"  Hay!  \"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.body").value("Hay!"));
        entityManager.flush();
        entityManager.createNativeQuery("update document_discussion_comments set content = 'Bình luận cũ'")
                .executeUpdate();
        entityManager.clear();
        mvc.perform(get(publicPath + "/comments"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.items[0].body").value("Bình luận cũ"))
                .andExpect(jsonPath("$.result.items[0].author").value("Thành viên EduShare"));
    }

    @Test
    void threadsAndLikesAreScopedToThePublishedDocumentAndSignedInAccount() throws Exception {
        Document document = createDocument(DocumentStatus.APPROVED, ScanStatus.CLEAN);
        Document other = createDocument(DocumentStatus.APPROVED, ScanStatus.CLEAN);
        String publicComments = LIBRARY + "/documents/" + document.getId() + "/comments";
        String privateComments = LIBRARY + "/me/documents/" + document.getId() + "/comments";
        String otherComments = LIBRARY + "/me/documents/" + other.getId() + "/comments";

        String root = createComment(privateComments, "{\"body\":\"Question\"}");
        String replyBody = "{\"body\":\"Answer\",\"parentId\":\"" + root + "\"}";
        String reply = createComment(privateComments, replyBody);
        String like = privateComments + "/" + reply + "/like";

        mvc.perform(post(otherComments).with(user(READER)).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content(replyBody))
                .andExpect(status().isNotFound());
        mvc.perform(put(like).with(csrf())).andExpect(status().isUnauthorized());
        mvc.perform(put(like).with(user(READER)).with(csrf()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.result.likeCount").value(1));
        mvc.perform(put(like).with(user(READER)).with(csrf()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.result.likeCount").value(1));

        mvc.perform(get(publicComments))
                .andExpect(jsonPath("$.result.total").value(1))
                .andExpect(jsonPath("$.result.items[0].id").value(root))
                .andExpect(jsonPath("$.result.items[0].replyCount").value(1));
        mvc.perform(get(publicComments).param("parentId", root))
                .andExpect(jsonPath("$.result.items[0].id").value(reply))
                .andExpect(jsonPath("$.result.items[0].likeCount").value(1))
                .andExpect(jsonPath("$.result.items[0].liked").value(false));
        mvc.perform(get(privateComments).param("parentId", root).with(user(READER)))
                .andExpect(jsonPath("$.result.items[0].liked").value(true));
        mvc.perform(get(privateComments).param("parentId", root).with(user(uploader.getEmail())))
                .andExpect(jsonPath("$.result.items[0].liked").value(false));
        mvc.perform(delete(like).with(user(READER)).with(csrf()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.result.likeCount").value(0));
    }

    private String createComment(String path, String body) throws Exception {
        var response = mvc.perform(post(path).with(user(READER)).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk()).andReturn().getResponse();
        return JsonPath.read(response.getContentAsString(), "$.result.id");
    }

    private Document createDocument(DocumentStatus status, ScanStatus scanStatus) {
        return documents.saveAndFlush(Document.builder().title("Ôn tập Java")
                .fileName("java.pdf").fileUrl("documents/java.pdf").fileType(FileType.PDF)
                .fileSize(3L).documentType(DocumentType.EXAM).uploader(uploader).subject(subject)
                .status(status).scanStatus(scanStatus).build());
    }
}
