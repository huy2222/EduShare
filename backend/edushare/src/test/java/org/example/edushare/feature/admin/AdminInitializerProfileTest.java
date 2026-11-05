package org.example.edushare.feature.admin;

import org.example.edushare.config.DevelopmentAdminInitializer;
import org.example.edushare.feature.auth.repository.RoleRepository;
import org.example.edushare.feature.auth.repository.UserAuthProviderRepository;
import org.example.edushare.feature.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

class AdminInitializerProfileTest {
    private final ApplicationContextRunner context = new ApplicationContextRunner()
            .withUserConfiguration(DevelopmentAdminInitializer.class)
            .withBean(UserRepository.class, () -> mock(UserRepository.class))
            .withBean(RoleRepository.class, () -> mock(RoleRepository.class))
            .withBean(UserAuthProviderRepository.class, () -> mock(UserAuthProviderRepository.class))
            .withBean(PasswordEncoder.class, () -> mock(PasswordEncoder.class));

    @Test
    void registersInitializerWhenRunningFromIdeWithoutProfile() {
        context.run(application -> assertThat(application).hasSingleBean(DevelopmentAdminInitializer.class));
    }

    @Test
    void registersInitializerForDevelopment() {
        context.withPropertyValues("spring.profiles.active=dev")
                .run(application -> assertThat(application).hasSingleBean(DevelopmentAdminInitializer.class));
    }

    @Test
    void doesNotRegisterSampleAccountInitializerForProduction() {
        context.withPropertyValues("spring.profiles.active=prod")
                .run(application -> assertThat(application).doesNotHaveBean(DevelopmentAdminInitializer.class));
    }
}
