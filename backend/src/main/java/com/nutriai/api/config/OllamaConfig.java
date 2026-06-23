package com.nutriai.api.config;

import com.nutriai.api.service.EvolutionApiService;
import com.nutriai.api.service.LlmService;
import com.nutriai.api.service.OllamaCloudLlmService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration for LLM and Evolution API services.
 * Provider swap requires only config changes (D-02).
 */
@Configuration
public class OllamaConfig {

    @Value("${nutriai.llm.base-url:https://api.ollama.com/v1}")
    private String llmBaseUrl;

    @Value("${nutriai.llm.model:glm4}")
    private String llmModel;

    @Value("${nutriai.llm.api-key:}")
    private String llmApiKey;

    @Value("${nutriai.llm.timeout-seconds:30}")
    private int llmTimeoutSeconds;

    @Value("${nutriai.evolution.api-url:http://localhost:8081}")
    private String evolutionApiUrl;

    @Value("${nutriai.evolution.api-key:}")
    private String evolutionApiKey;

    @Value("${nutriai.evolution.send-delay-ms:0}")
    private int evolutionSendDelayMs;

    @Bean
    LlmService ollamaCloudLlmService() {
        return new OllamaCloudLlmService(llmBaseUrl, llmModel, llmApiKey, llmTimeoutSeconds);
    }

    @Bean
    EvolutionApiService evolutionApiService() {
        return new EvolutionApiService(evolutionApiUrl, evolutionApiKey, evolutionSendDelayMs);
    }
}
