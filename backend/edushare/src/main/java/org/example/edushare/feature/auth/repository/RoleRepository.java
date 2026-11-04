package org.example.edushare.feature.auth.repository;

import org.example.edushare.feature.auth.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoleRepository extends JpaRepository<Role, String> {
    @org.springframework.data.jpa.repository.Query("select new org.example.edushare.feature.admin.dto.ManagedRoleRow("
            + "r.id, r.name, r.displayName, r.description, r.active, "
            + "(select count(u) from User u join u.roles ur where ur.id = r.id), "
            + "(select count(p) from Role rr join rr.permissions p where rr.id = r.id)) "
            + "from Role r where lower(r.name) like :search or lower(r.displayName) like :search order by r.name")
    org.springframework.data.domain.Page<org.example.edushare.feature.admin.dto.ManagedRoleRow> searchManaged(
            @org.springframework.data.repository.query.Param("search") String search, org.springframework.data.domain.Pageable pageable);

    @org.springframework.data.jpa.repository.Query("select r.name from Role r where r.active = true order by r.name")
    List<String> findActiveRoleNames();

    @org.springframework.data.jpa.repository.Query("select distinct r from Role r left join fetch r.permissions where r.id = :id")
    Optional<Role> findWithPermissions(@org.springframework.data.repository.query.Param("id") String id);
    @org.springframework.data.jpa.repository.Query("select r.name from Role r order by r.name")
    List<String> findRoleNames();
    Optional<Role> findByName(String name);

    boolean existsByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndIdNot(String name, String id);

    List<Role> findAllByPermissions_Id(String permissionId);
}
