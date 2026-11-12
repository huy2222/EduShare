package org.example.edushare.feature.document.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.example.edushare.feature.user.entity.User;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "document_discussion_comments",
        indexes = {
                @Index(name = "idx_discussion_document", columnList = "document_id"),
                @Index(name = "idx_discussion_parent", columnList = "parent_id")
        })
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class DocumentComment {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "document_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_discussion_document"))
    private Document document;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_discussion_user"))
    private User author;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id", foreignKey = @ForeignKey(name = "fk_discussion_parent"))
    private DocumentComment parent;

    @Column(name = "content", nullable = false, length = 2000)
    private String body;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public DocumentComment(Document document, User author, String body, DocumentComment parent) {
        this.document = document;
        this.author = author;
        this.body = body;
        this.parent = parent;
        this.createdAt = LocalDateTime.now();
    }
}
