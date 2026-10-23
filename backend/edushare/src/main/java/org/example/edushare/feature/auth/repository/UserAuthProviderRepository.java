package org.example.edushare.feature.auth.repository;

import jakarta.persistence.LockModeType;
import org.example.edushare.feature.auth.entity.AuthProvider;
import org.example.edushare.feature.auth.entity.UserAuthProvider;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserAuthProviderRepository extends JpaRepository<UserAuthProvider, String> {

    Optional<UserAuthProvider> findByProviderAndProviderId(AuthProvider provider, String providerId);

    boolean existsByUser_IdAndProvider(String userId, AuthProvider provider);

    Optional<UserAuthProvider> findByUser_IdAndProvider(String userId, AuthProvider provider);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select provider
            from UserAuthProvider provider
            join fetch provider.user
            where provider.provider = :provider and provider.providerId = :providerId
            """)
    Optional<UserAuthProvider> findByProviderAndProviderIdForUpdate(
            @Param("provider") AuthProvider provider,
            @Param("providerId") String providerId);
}
