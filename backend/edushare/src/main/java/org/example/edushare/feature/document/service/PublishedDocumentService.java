package org.example.edushare.feature.document.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.edushare.common.exception.AppException;
import org.example.edushare.common.exception.ErrorCode;
import org.example.edushare.feature.document.dto.response.PublishedDocumentResponse;
import org.example.edushare.feature.document.entity.Document;
import org.example.edushare.feature.document.entity.DocumentComment;
import org.example.edushare.feature.document.entity.DocumentCommentLike;
import org.example.edushare.feature.document.entity.DocumentInteraction;
import org.example.edushare.feature.document.entity.DocumentStatus;
import org.example.edushare.feature.document.entity.ScanStatus;
import org.example.edushare.feature.document.repository.DocumentCommentRepository;
import org.example.edushare.feature.document.repository.DocumentCommentLikeRepository;
import org.example.edushare.feature.document.repository.DocumentInteractionRepository;
import org.example.edushare.feature.document.repository.DocumentRepository;
import org.example.edushare.feature.user.entity.User;
import org.example.edushare.feature.user.repository.UserRepository;
import org.example.edushare.infrastructure.storage.R2StorageService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import software.amazon.awssdk.core.exception.SdkException;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PublishedDocumentService {
    private static final Sort NEWEST = Sort.by(Sort.Direction.DESC, "createdAt", "id");

    private final DocumentRepository documents;
    private final DocumentCommentRepository comments;
    private final DocumentCommentLikeRepository commentLikes;
    private final DocumentInteractionRepository interactions;
    private final UserRepository users;
    private final DocumentPreviewService previewService;
    private final R2StorageService storageService;

    public record Results<T>(List<T> items, long total, boolean hasNext) {
        static <T> Results<T> from(Page<T> page) {
            return new Results<>(page.getContent(), page.getTotalElements(), page.hasNext());
        }
    }

    public record RatingSummary(double average, long total, long[] counts) {}
    public record Detail(PublishedDocumentResponse document, boolean previewAvailable, RatingSummary ratings) {}
    public record Viewer(boolean favorite, Integer rating) {}
    public record Comment(UUID id, String author, String body, LocalDateTime createdAt,
                          long likeCount, boolean liked, long replyCount) {
        static Comment from(DocumentComment comment, LikeState likes, long replyCount) {
            return new Comment(comment.getId(), PublishedDocumentResponse.displayName(comment.getAuthor()),
                    comment.getBody(), comment.getCreatedAt(), likes.likeCount(), likes.liked(), replyCount);
        }
    }
    public record LikeState(long likeCount, boolean liked) {}
    private static final LikeState NO_LIKES = new LikeState(0, false);
    public record FileContent(String name, byte[] bytes) {}

    public Results<PublishedDocumentResponse> list(String query, int page) {
        String search = query.strip().toLowerCase(Locale.ROOT);
        return Results.from(documents.searchPublished(DocumentStatus.APPROVED, ScanStatus.CLEAN,
                search, page(page, 12, NEWEST)).map(PublishedDocumentResponse::from));
    }

    @Transactional
    public Detail detail(UUID id) {
        if (documents.incrementPublishedViewCount(id, DocumentStatus.APPROVED, ScanStatus.CLEAN) == 0) {
            throw new AppException(ErrorCode.DOCUMENT_NOT_FOUND);
        }
        Document document = findPublished(id);
        return new Detail(PublishedDocumentResponse.from(document),
                previewService.resolvePreviewObjectKey(document) != null, ratings(id));
    }

    public byte[] preview(UUID id) {
        Document document = findPublished(id);
        String key = previewService.resolvePreviewObjectKey(document);
        if (key == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Tài liệu chưa có bản xem trước.");
        }
        return readFile(id, key);
    }

    @Transactional
    public FileContent download(UUID id) {
        Document document = findPublished(id);
        byte[] content = readFile(id, document.getFileUrl());
        if (documents.incrementPublishedDownloadCount(id, DocumentStatus.APPROVED, ScanStatus.CLEAN) == 0) {
            throw new AppException(ErrorCode.DOCUMENT_NOT_FOUND);
        }
        return new FileContent(document.getFileName(), content);
    }

    public Results<Comment> comments(UUID id, UUID parentId, int page, String email) {
        requirePublished(id);
        var pageable = page(page, 20, NEWEST);
        if (parentId != null) {
            findThread(id, parentId);
        }
        var rows = parentId == null ? comments.findByDocumentIdAndParentIsNull(id, pageable)
                : comments.findByDocumentIdAndParentId(id, parentId, pageable);
        if (rows.isEmpty()) {
            return new Results<>(List.of(), rows.getTotalElements(), rows.hasNext());
        }

        var ids = rows.getContent().stream().map(DocumentComment::getId).toList();
        var likes = new HashMap<UUID, LikeState>();
        var replies = new HashMap<UUID, Long>();
        String viewerId = email == null ? null : currentUser(email).getId();
        commentLikes.summarize(ids, viewerId).forEach(row ->
                likes.put(row.getCommentId(), new LikeState(row.getTotal(), row.getViewerLikes() > 0)));
        if (parentId == null) {
            comments.countReplies(ids).forEach(row -> replies.put(row.getParentId(), row.getTotal()));
        }
        return Results.from(rows.map(comment -> Comment.from(comment, likes.getOrDefault(comment.getId(), NO_LIKES),
                replies.getOrDefault(comment.getId(), 0L))));
    }

    @Transactional
    public Comment addComment(UUID id, String email, String body, UUID parentId) {
        Document document = lockPublished(id);
        DocumentComment parent = parentId == null ? null : findThread(id, parentId);
        DocumentComment comment = comments.save(new DocumentComment(document, currentUser(email), body.strip(), parent));
        return Comment.from(comment, NO_LIKES, 0);
    }

    @Transactional
    public LikeState likeComment(UUID documentId, UUID commentId, String email, boolean liked) {
        lockPublished(documentId);
        DocumentComment comment = findComment(documentId, commentId);
        User user = currentUser(email);
        var existing = commentLikes.findByCommentIdAndUserId(commentId, user.getId());
        if (liked && existing.isEmpty()) {
            commentLikes.save(new DocumentCommentLike(comment, user));
        }
        if (!liked) {
            existing.ifPresent(commentLikes::delete);
        }
        return new LikeState(commentLikes.countByCommentId(commentId), liked);
    }

    private DocumentComment findThread(UUID documentId, UUID parentId) {
        DocumentComment parent = findComment(documentId, parentId);
        if (parent.getParent() != null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Hãy trả lời trong bình luận gốc.");
        }
        return parent;
    }

    private DocumentComment findComment(UUID documentId, UUID commentId) {
        return comments.findByIdAndDocumentId(commentId, documentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Bình luận không tồn tại."));
    }

    public Viewer viewer(UUID id, String email) {
        requirePublished(id);
        return interactions.findByDocumentIdAndUserId(id, currentUser(email).getId())
                .map(i -> new Viewer(i.isFavorite(), i.getRating()))
                .orElse(new Viewer(false, null));
    }

    @Transactional
    public RatingSummary rate(UUID id, String email, int stars) {
        DocumentInteraction interaction = getInteraction(lockPublished(id), currentUser(email));
        interaction.setRating(stars);
        interactions.saveAndFlush(interaction);
        RatingSummary summary = ratings(id);
        documents.updateAverageRating(id, summary.average());
        return summary;
    }

    @Transactional
    public void favorite(UUID id, String email, boolean favorite) {
        Document document = lockPublished(id);
        User user = currentUser(email);
        var existing = interactions.findByDocumentIdAndUserId(id, user.getId());
        if (!favorite && existing.isEmpty()) {
            return;
        }
        DocumentInteraction interaction = existing.orElseGet(() -> new DocumentInteraction(document, user));
        interaction.setFavorite(favorite);
        if (!favorite && interaction.getRating() == null) {
            interactions.delete(interaction);
        } else {
            interactions.save(interaction);
        }
    }

    public Results<PublishedDocumentResponse> favorites(String email, String query, int page) {
        return Results.from(interactions.searchFavorites(currentUser(email).getId(),
                DocumentStatus.APPROVED, ScanStatus.CLEAN, query.strip().toLowerCase(Locale.ROOT),
                page(page, 12, Sort.by(Sort.Direction.DESC, "favoritedAt", "id")))
                .map(interaction -> PublishedDocumentResponse.from(interaction.getDocument())));
    }

    private RatingSummary ratings(UUID id) {
        long[] counts = new long[6];
        long sum = 0;
        for (var row : interactions.countRatings(id)) {
            counts[row.getStars()] = row.getTotal();
            sum += row.getStars() * row.getTotal();
        }
        long total = Arrays.stream(counts).sum();
        return new RatingSummary(total == 0 ? 0 : (double) sum / total, total, counts);
    }

    private DocumentInteraction getInteraction(Document document, User user) {
        return interactions.findByDocumentIdAndUserId(document.getId(), user.getId())
                .orElseGet(() -> new DocumentInteraction(document, user));
    }

    private Document findPublished(UUID id) {
        return documents.findDetailedById(id).filter(this::isPublished)
                .orElseThrow(() -> new AppException(ErrorCode.DOCUMENT_NOT_FOUND));
    }

    private void requirePublished(UUID id) {
        if (!documents.existsByIdAndStatusAndScanStatus(id, DocumentStatus.APPROVED, ScanStatus.CLEAN)) {
            throw new AppException(ErrorCode.DOCUMENT_NOT_FOUND);
        }
    }

    private byte[] readFile(UUID id, String key) {
        try {
            return storageService.getObjectBytes(key).asByteArray();
        } catch (SdkException | IllegalArgumentException exception) {
            log.warn("Unable to read published document {}", id, exception);
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Tệp hiện chưa tải được.");
        }
    }

    private Document lockPublished(UUID id) {
        return documents.findForInteraction(id).filter(this::isPublished)
                .orElseThrow(() -> new AppException(ErrorCode.DOCUMENT_NOT_FOUND));
    }

    private boolean isPublished(Document document) {
        return document.getStatus() == DocumentStatus.APPROVED && document.getScanStatus() == ScanStatus.CLEAN;
    }

    private User currentUser(String email) {
        return users.findByEmail(email).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
    }

    private PageRequest page(int page, int size, Sort sort) {
        if (page < 0 || page > Integer.MAX_VALUE / size) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số trang không hợp lệ.");
        }
        return PageRequest.of(page, size, sort);
    }
}
