package org.example.edushare.feature.document.service;

import org.example.edushare.feature.document.dto.request.DocumentModerationRequest;
import org.example.edushare.feature.document.entity.Document;
import org.example.edushare.feature.document.entity.DocumentModeration;
import org.example.edushare.feature.document.entity.DocumentStatus;
import org.example.edushare.feature.document.entity.ModerationAction;
import org.example.edushare.feature.document.entity.FileType;
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
import java.time.LocalDateTime;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.verify;

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

    @Test
    void statsUseRepositoryCountsInsteadOfCurrentPageSize() {
        when(documentRepository.countByStatus(DocumentStatus.PENDING)).thenReturn(12L);
        when(documentRepository.countByStatus(DocumentStatus.APPROVED)).thenReturn(1980L);
        when(documentRepository.countByStatus(DocumentStatus.REJECTED)).thenReturn(150L);
        when(documentRepository.count()).thenReturn(4820L);
        when(moderationRepository.countByActionAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(
                eq(ModerationAction.APPROVED), any(), any())).thenReturn(38L);
        when(moderationRepository.countByActionAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(
                eq(ModerationAction.REJECTED), any(), any())).thenReturn(3L);

        var stats = moderationService.stats();

        assertEquals(12L, stats.getPending());
        assertEquals(1980L, stats.getApproved());
        assertEquals(150L, stats.getRejected());
        assertEquals(38L, stats.getApprovedToday());
        assertEquals(3L, stats.getRejectedToday());
        assertEquals(4820L, stats.getTotal());
    }

    @Test
    void listPassesAdminFiltersToRepository() {
        LocalDateTime createdFrom = LocalDateTime.of(2026, 11, 1, 0, 0);
        PageRequest pageable = PageRequest.of(0, 10);
        when(documentRepository.searchForAdministration(
                "cloud", DocumentStatus.APPROVED, FileType.PDF, "subject-1", createdFrom, pageable))
                .thenReturn(Page.empty(pageable));

        var result = moderationService.list(
                " cloud ", DocumentStatus.APPROVED, FileType.PDF, "subject-1", createdFrom, pageable);

        assertEquals(0, result.getTotalElements());
        verify(documentRepository).searchForAdministration(
                "cloud", DocumentStatus.APPROVED, FileType.PDF, "subject-1", createdFrom, pageable);
    }
}
