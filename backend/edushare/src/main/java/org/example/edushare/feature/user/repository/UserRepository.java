package org.example.edushare.feature.user.repository;

import org.example.edushare.feature.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;

import java.util.Optional;
import java.util.List;

public interface UserRepository extends JpaRepository<User, String> {
    boolean existsByRoles_Id(String roleId);
    @Query("select new org.example.edushare.feature.admin.dto.AdminUserRow(u.id, u.email, p.fullName, u.status, u.createdAt) "
            + "from User u left join u.profile p where "
            + "(:search = '' or lower(u.email) like concat('%', :search, '%') or lower(p.fullName) like concat('%', :search, '%')) "
            + "and (:status is null or u.status = :status) "
            + "and (:role = '' or exists (select r from u.roles r where r.name = :role))")
    org.springframework.data.domain.Page<org.example.edushare.feature.admin.dto.AdminUserRow> searchAdminRows(
            @Param("search") String search, @Param("role") String role,
            @Param("status") org.example.edushare.feature.user.entity.UserStatus status, org.springframework.data.domain.Pageable pageable);

    @Query("select new org.example.edushare.feature.admin.dto.AdminUserRole(u.id, r.name) from User u join u.roles r where u.id in :ids")
    List<org.example.edushare.feature.admin.dto.AdminUserRole> findAdminRoles(@Param("ids") List<String> ids);
    boolean existsByProfileMajorId(String majorId);

    interface StatusCount {
        org.example.edushare.feature.user.entity.UserStatus getStatus();
        long getTotal();
    }

    @Query("select u.status as status, count(u) as total from User u group by u.status")
    List<StatusCount> countStatuses();

    @Query("select distinct u from User u left join fetch u.profile left join fetch u.roles r left join fetch r.permissions where u.email = :email")
    Optional<User> findForAuthorization(@Param("email") String email);

    @Query("select distinct u from User u left join fetch u.profile left join fetch u.roles r "
            + "left join fetch r.permissions left join InvalidatedToken t on t.id = :tokenId "
            + "where u.email = :email and t.id is null")
    Optional<User> findForTokenAuthorization(@Param("email") String email, @Param("tokenId") String tokenId);

    long countByStatus(org.example.edushare.feature.user.entity.UserStatus status);

    boolean existsByEmail(String email);

    Optional<User> findByEmail(String email);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select u from User u where u.id = :id")
    Optional<User> findByIdForUpdate(@Param("id") String id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select u from User u where u.email = :email")
    Optional<User> findByEmailForUpdate(@Param("email") String email);

    List<User> findAllByRoles_Id(String roleId);
}
