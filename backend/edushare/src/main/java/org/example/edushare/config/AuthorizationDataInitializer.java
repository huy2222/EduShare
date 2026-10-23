package org.example.edushare.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.edushare.feature.auth.entity.Role;
import org.example.edushare.feature.auth.repository.RoleRepository;
import org.example.edushare.feature.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.HashSet;
import java.util.Locale;

@Component
@RequiredArgsConstructor
@Slf4j
public class AuthorizationDataInitializer implements ApplicationRunner {
    private final RoleRepository roleRepository;
    private final UserRepository userRepository;

    @Value("${app.security.admin-email:}")
    private String adminEmail;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        Role adminRole = roleRepository.findByName("ADMIN")
                .orElseGet(() -> roleRepository.save(Role.builder()
                        .name("ADMIN")
                        .description("System administrator")
                        .permissions(new HashSet<>())
                        .build()));

        if (!StringUtils.hasText(adminEmail)) {
            return;
        }

        String normalizedEmail = adminEmail.trim().toLowerCase(Locale.ROOT);
        userRepository.findByEmail(normalizedEmail).ifPresentOrElse(user -> {
            if (user.getRoles() == null) {
                user.setRoles(new HashSet<>());
            }
            user.getRoles().add(adminRole);
            log.info("ADMIN role assigned to configured admin account");
        }, () -> log.warn("Configured admin account does not exist yet: {}", normalizedEmail));
    }
}
