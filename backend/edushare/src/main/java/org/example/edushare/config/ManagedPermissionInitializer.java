package org.example.edushare.config;

import lombok.RequiredArgsConstructor;
import org.example.edushare.feature.admin.service.PermissionCatalog;
import org.example.edushare.feature.auth.entity.Permission;
import org.example.edushare.feature.auth.repository.PermissionRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class ManagedPermissionInitializer implements ApplicationRunner {
    private final PermissionRepository permissions;
    private final org.example.edushare.feature.auth.repository.RoleRepository roles;
    @Override @Transactional
    public void run(ApplicationArguments args) {
        for (var item : PermissionCatalog.ITEMS) {
            if (!item.available()) continue;
            if (!permissions.existsByNameIgnoreCase(item.code())) {
                var permission = permissions.save(Permission.builder()
                        .name(item.code()).description(item.description()).build());
                if (item.code().equals("APPROVE_DOCUMENT")) roles.findByName("MODERATOR").ifPresent(role -> role.getPermissions().add(permission));
                if (java.util.Set.of("DOCUMENT_VIEW", "DOCUMENT_UPLOAD", "DOCUMENT_DELETE_OWN", "PROFILE_VIEW_OWN", "PROFILE_UPDATE_OWN").contains(item.code())) {
                    roles.findByName("USER").ifPresent(role -> role.getPermissions().add(permission));
                }
            }
        }
    }
}
