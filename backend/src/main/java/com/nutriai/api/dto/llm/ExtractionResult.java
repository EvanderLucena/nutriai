package com.nutriai.api.dto.llm;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

/**
 * Structured meal extraction result from LLM.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record ExtractionResult(
    String mealLabel,
    List<ExtractionItemResult> items,
    String extractionRaw
) {}
