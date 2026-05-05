package com.nutriai.api.dto.whatsapp;

import java.math.BigDecimal;
import java.util.List;

/**
 * Request body for PATCH extraction correction.
 */
public record PatchExtractionRequest(
    List<PatchExtractionItem> items
) {
    public PatchExtractionRequest {
        items = items != null ? List.copyOf(items) : List.of();
    }

    /**
     * Individual item in a correction request.
     */
    public record PatchExtractionItem(
        String name,
        BigDecimal kcal,
        BigDecimal prot,
        BigDecimal carb,
        BigDecimal fat,
        BigDecimal grams
    ) {}
}
