package org.example.edushare.feature.auth.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "invalidated_tokens", indexes = {
        @Index(name = "idx_invalidated_token_expiry", columnList = "expiry_time")
})
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvalidatedToken {
    @Id
    @Column(nullable = false, length = 36)
    private String id;

    @Column(name = "expiry_time", nullable = false)
    private Instant expiryTime;

    @Column(name = "revoked_at", nullable = false)
    private Instant revokedAt;
}
