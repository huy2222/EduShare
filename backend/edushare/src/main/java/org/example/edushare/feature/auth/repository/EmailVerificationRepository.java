package org.example.edushare.feature.auth.repository;

import org.example.edushare.feature.auth.entity.EmailVerification;
import org.example.edushare.feature.auth.entity.VerificationStatus;
import org.example.edushare.feature.auth.entity.VerificationType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import jakarta.persistence.LockModeType;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmailVerificationRepository extends JpaRepository<EmailVerification, String> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<EmailVerification> findFirstByUser_IdAndTypeOrderByCreatedAtDesc(
            String userId, VerificationType type);

    List<EmailVerification> findAllByUser_IdAndTypeAndStatus(
            String userId, VerificationType type, VerificationStatus status);
}
