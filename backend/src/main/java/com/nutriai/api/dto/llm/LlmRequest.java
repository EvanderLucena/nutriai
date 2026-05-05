package com.nutriai.api.dto.llm;

/**
 * DTO for LLM chat requests.
 */
public record LlmRequest(
    String systemPrompt,
    String userMessage,
    double temperature,
    int maxTokens
) {
    public LlmRequest {
        if (temperature < 0) temperature = 0.3;
        if (maxTokens <= 0) maxTokens = 1000;
    }

    public LlmRequest(String systemPrompt, String userMessage) {
        this(systemPrompt, userMessage, 0.3, 1000);
    }
}
