package com.nutriai.api.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration for webhook security concerns.
 * Exposes both the optional HMAC shared secret (for custom integrations)
 * and the Evolution API apikey (used to authenticate inbound webhooks
 * from the Evolution API gateway when HMAC is not configured).
 */
@Configuration
public class WebhookSecurityConfig {

    @Value("${NUTRIAI_WEBHOOK_SECRET:}")
    private String webhookSecret;

    @Value("${nutriai.evolution.api-key:}")
    private String evolutionApiKey;

    @Bean
    String webhookHmacSecret() {
        return webhookSecret;
    }

    @Bean("evolutionWebhookApiKey")
    String evolutionWebhookApiKey() {
        return evolutionApiKey;
    }
}
