package org.example.edushare.feature.document.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;
import org.example.edushare.feature.user.entity.User;

import java.util.UUID;

@Entity
@Table(name = "document_discussion_likes",
        uniqueConstraints = @UniqueConstraint(name = "uk_discussion_like_comment_user",
                columnNames = {"comment_id", "user_id"}))
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class DocumentCommentLike {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "comment_id", nullable = false)
    private DocumentComment comment;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    public DocumentCommentLike(DocumentComment comment, User user) {
        this.comment = comment;
        this.user = user;
    }
}
