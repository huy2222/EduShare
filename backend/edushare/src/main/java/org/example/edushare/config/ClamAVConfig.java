package org.example.edushare.config;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

@Configuration
@EnableAsync
public class ClamAVConfig {

    @Value("${clamav.core-pool-size:2}")
    private int corePoolSize;

    @Value("${clamav.max-pool-size:2}")
    private int maxPoolSize;

    @Value("${clamav.queue-capacity:50}")
    private int queueCapacity;

    @Bean(name = "scanExecutor")
    public Executor scanExecutor() {

        ThreadPoolTaskExecutor executor =
                new ThreadPoolTaskExecutor();

        executor.setCorePoolSize(corePoolSize);
        executor.setMaxPoolSize(maxPoolSize);
        executor.setQueueCapacity(queueCapacity);
        executor.setThreadNamePrefix("virus-scan-");

        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(30);

        executor.initialize();

        return executor;
    }
}

