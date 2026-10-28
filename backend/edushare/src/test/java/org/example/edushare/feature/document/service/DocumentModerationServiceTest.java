package org.example.edushare.feature.document.service;

import org.example.edushare.feature.document.dto.request.DocumentModerationRequest;
import org.example.edushare.feature.document.entity.Document;
import org.example.edushare.feature.document.entity.DocumentModeration;
import org.example.edushare.feature.document.entity.DocumentStatus;
import org.example.edushare.feature.document.entity.ModerationAction;
import org.example.edushare.feature.document.repository.DocumentModerationRepository;
import org.example.edushare.feature.document.repository.DocumentRepository;
import org.example.edushare.feature.user.entity.User;
import org.example.edushare.feature.user.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DocumentModerationServiceTest {

    @Mock
    private DocumentRepository documentRepository;
    @Mock
    private DocumentModerationRepository moderationRepository;
    @Mock
    private UserRepository userRepository;

    private DocumentModerationService moderationService;

    @BeforeEach
    void setUp() {
        moderationService = new DocumentModerationService(
                documentRepository, moderationRepository, userRepository
        );
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        "moderator@example.com",
                        "",
                        List.of(new SimpleGrantedAuthority("ROLE_MODERATOR"))
                )
        );
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void rejectUpdatesDocumentAndStoresModerationHistory() {
        UUID documentId = UUID.randomUUID();
        Document document = Document.builder().id(documentId).status(DocumentStatus.PENDING).build();
        User moderator = User.builder().id("moderator-id").email("moderator@example.com").build();

        when(documentRepository.findById(documentId)).thenReturn(Optional.of(document));
        when(userRepository.findByEmail("moderator@example.com")).thenReturn(Optional.of(moderator));
        when(moderationRepository.save(any(DocumentModeration.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        DocumentModeration result = moderationService.moderate(
                documentId,
                new DocumentModerationRequest(ModerationAction.REJECTED, "Copyright violation")
        );

        assertEquals(DocumentStatus.REJECTED, document.getStatus());
        assertEquals(ModerationAction.REJECTED, result.getAction());
        assertEquals("Copyright violation", result.getReason());
        assertEquals(moderator, result.getModerator());
    }
}
