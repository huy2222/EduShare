package org.example.edushare.feature.document.controller;

import com.jayway.jsonpath.JsonPath;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
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
import org.example.edushare.feature.user.entity.Profile;
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

import java.time.LocalDateTime;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import javax.imageio.ImageIO;
import java.util.ArrayList;
import java.util.UUID;

import static org.mockito.Mockito.when;
import static org.assertj.core.api.Assertions.assertThat;
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
    void guestCanReadPublishedDetailsAndAnImageExcerptButCannotReadFullFilesOrDownload() throws Exception {
        Document visible = createDocument(DocumentStatus.APPROVED, ScanStatus.CLEAN);
        Document pending = createDocument(DocumentStatus.PENDING, ScanStatus.CLEAN);
        Document unscanned = createDocument(DocumentStatus.APPROVED, ScanStatus.PENDING);
        String visiblePath = LIBRARY + "/documents/" + visible.getId();
        byte[] file = previewPdf();
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
                .andExpect(jsonPath("$.result.document.views").value(1))
                .andExpect(jsonPath("$.result.uploader.name").value("Thành viên EduShare"))
                .andExpect(jsonPath("$.result.uploader.publishedDocuments").value(1))
                .andExpect(jsonPath("$.result.relatedDocuments").isEmpty());
        byte[] sample = mvc.perform(get(visiblePath + "/preview").param("full", "true"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.IMAGE_PNG))
                .andExpect(header().string("Cache-Control", "no-store"))
                .andReturn().getResponse().getContentAsByteArray();
        var image = ImageIO.read(new ByteArrayInputStream(sample));
        assertThat(image.getWidth()).isEqualTo(300);
        assertThat(image.getHeight()).isEqualTo(270);
        mvc.perform(get(visiblePath + "/download"))
                .andExpect(status().isUnauthorized());
        mvc.perform(get(LIBRARY + "/me/documents/" + visible.getId() + "/preview"))
                .andExpect(status().isUnauthorized());
        assertThat(documents.findById(visible.getId()).orElseThrow().getDownloadCount()).isZero();

        mvc.perform(get(LIBRARY + "/me/documents/" + visible.getId() + "/preview").with(user(READER)))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_PDF))
                .andExpect(header().string("Cache-Control", "no-store"))
                .andExpect(content().bytes(file));
        mvc.perform(get(visiblePath + "/download").with(user(READER)))
                .andExpect(status().isOk()).andExpect(content().bytes(file));
        mvc.perform(get(LIBRARY + "/documents/" + pending.getId() + "/preview"))
                .andExpect(status().isNotFound());
        mvc.perform(get(LIBRARY + "/documents/" + unscanned.getId()))
                .andExpect(status().isNotFound());
        mvc.perform(get(LIBRARY + "/me/documents/" + pending.getId() + "/preview").with(user(READER)))
                .andExpect(status().isNotFound());
        mvc.perform(get(LIBRARY + "/documents/" + unscanned.getId() + "/download").with(user(READER)))
                .andExpect(status().isNotFound());
        mvc.perform(get(LIBRARY + "/me/favorites")).andExpect(status().isUnauthorized());
        mvc.perform(post(LIBRARY + "/me/documents/" + visible.getId() + "/comments").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content("{\"body\":\"Guest\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void officeDocumentsUseTheConvertedPdfForGuestExcerptsAndOnlySignedInReadersCanDownloadTheOriginal() throws Exception {
        Document document = createDocument(DocumentStatus.APPROVED, ScanStatus.CLEAN);
        document.setFileType(FileType.XLSX);
        document.setFileName("java.xlsx");
        document.setPreviewStatus(org.example.edushare.feature.document.entity.PreviewStatus.AVAILABLE);
        document.setPreviewFileUrl("previews/java.pdf");
        documents.saveAndFlush(document);
        byte[] pdf = previewPdf();
        when(storage.getObjectBytes(document.getPreviewFileUrl()))
                .thenReturn(ResponseBytes.fromByteArray(GetObjectResponse.builder().build(), pdf));
        byte[] original = {1, 2, 3};
        when(storage.getObjectBytes(document.getFileUrl()))
                .thenReturn(ResponseBytes.fromByteArray(GetObjectResponse.builder().build(), original));
        String path = LIBRARY + "/documents/" + document.getId();
        mvc.perform(get(path + "/preview"))
                .andExpect(status().isOk()).andExpect(content().contentType(MediaType.IMAGE_PNG));
        mvc.perform(get(path + "/download"))
                .andExpect(status().isUnauthorized());
        mvc.perform(get(path + "/download").with(user(READER)))
                .andExpect(status().isOk()).andExpect(content().bytes(original));
    }

    @Test
    void invalidGuestPreviewNeverFallsBackToTheFullSource() throws Exception {
        Document document = createDocument(DocumentStatus.APPROVED, ScanStatus.CLEAN);
        when(storage.getObjectBytes(document.getFileUrl()))
                .thenReturn(ResponseBytes.fromByteArray(GetObjectResponse.builder().build(), new byte[]{1, 2, 3}));
        mvc.perform(get(LIBRARY + "/documents/" + document.getId() + "/preview"))
                .andExpect(status().isServiceUnavailable());
    }

    @Test
    void detailIncludesPublicUploaderInformationAndOnlyThreeNewestPublishedDocumentsInTheSameSubject() throws Exception {
        uploader.attachProfile(Profile.builder().fullName("Nguyễn Văn A").bio("Chia sẻ kiến thức Java.")
                .phone("0901234567").build());
        users.saveAndFlush(uploader);
        Document current = createDocument(DocumentStatus.APPROVED, ScanStatus.CLEAN);
        var relatedIds = new ArrayList<UUID>();
        for (int index = 0; index < 4; index++) {
            Document related = createDocument(DocumentStatus.APPROVED, ScanStatus.CLEAN);
            relatedIds.add(related.getId());
            entityManager.createQuery("update Document d set d.createdAt = :createdAt where d.id = :id")
                    .setParameter("createdAt", LocalDateTime.of(2026, 11, 1, 10, 0).plusDays(index))
                    .setParameter("id", related.getId()).executeUpdate();
        }
        createDocument(DocumentStatus.PENDING, ScanStatus.CLEAN);
        createDocument(DocumentStatus.REJECTED, ScanStatus.CLEAN);
        createDocument(DocumentStatus.APPROVED, ScanStatus.PENDING);
        createDocument(DocumentStatus.APPROVED, ScanStatus.INFECTED);
        Subject otherSubject = subjects.save(Subject.builder().code("DB101").name("Cơ sở dữ liệu").credits(3).build());
        Document unrelated = createDocument(DocumentStatus.APPROVED, ScanStatus.CLEAN);
        unrelated.setSubject(otherSubject);
        documents.saveAndFlush(unrelated);
        entityManager.clear();

        mvc.perform(get(LIBRARY + "/documents/" + current.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.uploader.name").value("Nguyễn Văn A"))
                .andExpect(jsonPath("$.result.uploader.bio").value("Chia sẻ kiến thức Java."))
                .andExpect(jsonPath("$.result.uploader.publishedDocuments").value(6))
                .andExpect(jsonPath("$.result.uploader.joinedAt").isNotEmpty())
                .andExpect(jsonPath("$.result.uploader.email").doesNotExist())
                .andExpect(jsonPath("$.result.uploader.phone").doesNotExist())
                .andExpect(jsonPath("$.result.relatedDocuments.length()").value(3))
                .andExpect(jsonPath("$.result.relatedDocuments[0].id").value(relatedIds.get(3).toString()))
                .andExpect(jsonPath("$.result.relatedDocuments[1].id").value(relatedIds.get(2).toString()))
                .andExpect(jsonPath("$.result.relatedDocuments[2].id").value(relatedIds.get(1).toString()))
                .andExpect(jsonPath("$.result.relatedDocuments[0].objectKey").doesNotExist());
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

    private byte[] previewPdf() throws Exception {
        try (var document = new PDDocument(); var output = new ByteArrayOutputStream()) {
            document.addPage(new PDPage(new PDRectangle(200, 300)));
            document.addPage(new PDPage(new PDRectangle(200, 300)));
            document.save(output);
            return output.toByteArray();
        }
    }

    private Document createDocument(DocumentStatus status, ScanStatus scanStatus) {
        return documents.saveAndFlush(Document.builder().title("Ôn tập Java")
                .fileName("java.pdf").fileUrl("documents/java.pdf").fileType(FileType.PDF)
                .fileSize(3L).documentType(DocumentType.EXAM).uploader(uploader).subject(subject)
                .status(status).scanStatus(scanStatus).build());
    }
}
