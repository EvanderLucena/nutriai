package com.nutriai.api.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration for webhook security concerns.
 * Reads the HMAC shared secret from the environment.
 */
@Configuration
public class WebhookSecurityConfig {

    @Value("${NUTRIAI_WEBHOOK_SECRET:}")
    private String webhookSecret;

    @Bean
    String webhookHmacSecret() {
        return webhookSecret;
    }
}
