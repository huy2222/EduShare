package org.example.edushare.feature.auth.repository;

import org.example.edushare.feature.auth.entity.EmailVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmailVerificationRepository extends JpaRepository<EmailVerification, String> {
    Optional<EmailVerification> findFirstByUser_EmailAndUsedFalseOrderByCreatedAtDesc(String email);

    List<EmailVerification> findAllByUser_IdAndUsedFalse(String userId);
}
