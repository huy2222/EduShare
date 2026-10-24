package org.example.edushare.feature.auth.repository;

import org.example.edushare.feature.auth.entity.InvalidatedToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;

public interface InvalidatedTokenRepository extends JpaRepository<InvalidatedToken, String> {
    @Modifying
    @Query(value = """
            INSERT INTO invalidated_tokens (id, expiry_time, revoked_at)
            VALUES (:id, :expiryTime, :revokedAt)
            ON DUPLICATE KEY UPDATE id = id
            """, nativeQuery = true)
    int insertIfAbsent(
            @Param("id") String id,
            @Param("expiryTime") Instant expiryTime,
            @Param("revokedAt") Instant revokedAt);

    @Modifying
    @Query("delete from InvalidatedToken token where token.expiryTime < :now")
    int deleteExpiredBefore(@Param("now") Instant now);
}
