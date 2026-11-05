package org.example.edushare.config;

import lombok.RequiredArgsConstructor;
import org.example.edushare.feature.auth.entity.*;
import org.example.edushare.feature.auth.repository.*;
import org.example.edushare.feature.user.entity.User;
import org.example.edushare.feature.user.entity.UserStatus;
import org.example.edushare.feature.user.repository.UserRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import java.util.HashSet;
import java.util.Set;

@Component
@Profile({"default", "dev"})
@RequiredArgsConstructor
public class DevelopmentAdminInitializer implements ApplicationRunner {
    private final UserRepository users;
    private final RoleRepository roles;
    private final UserAuthProviderRepository providers;
    private final PasswordEncoder encoder;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (users.existsByEmail("admin")) return;
        Role role = roles.findByName("ADMIN").orElseGet(() -> roles.save(Role.builder()
                .name("ADMIN").description("System administrator").permissions(new HashSet<>()).build()));
        User user = User.builder().email("admin").password(encoder.encode("admin123"))
                .status(UserStatus.ACTIVE).roles(new HashSet<>(Set.of(role))).build();
        user.attachProfile(org.example.edushare.feature.user.entity.Profile.builder().fullName("Quản trị viên").build());
        users.saveAndFlush(user);
        providers.save(UserAuthProvider.builder().user(user).provider(AuthProvider.LOCAL).build());
    }
}
