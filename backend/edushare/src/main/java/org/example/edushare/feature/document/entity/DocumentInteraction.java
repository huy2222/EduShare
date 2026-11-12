package org.example.edushare.feature.document.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.example.edushare.feature.user.entity.User;
import org.hibernate.annotations.Check;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Check(constraints = "rating between 0 and 5")
@Table(name = "document_interactions",
        uniqueConstraints = @UniqueConstraint(columnNames = {"document_id", "user_id"}),
        indexes = @Index(columnList = "user_id, favorited_at"))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class DocumentInteraction {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private Document document;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private User user;

    @Setter
    private Integer rating;

    @Column(nullable = false)
    private boolean favorite;

    private LocalDateTime favoritedAt;

    public DocumentInteraction(Document document, User user) {
        this.document = document;
        this.user = user;
    }

    public void setFavorite(boolean favorite) {
        this.favorite = favorite;
        if (!favorite) {
            favoritedAt = null;
        } else if (favoritedAt == null) {
            favoritedAt = LocalDateTime.now();
        }
    }
}
