package com.nutriai.api.dto.plan;

import java.math.BigDecimal;

/**
 * DTO for updating an off-plan extra.
 */
public record UpdateExtraRequest(
        String name,
        String quantity,
        BigDecimal kcal,
        BigDecimal prot,
        BigDecimal carb,
        BigDecimal fat
) {}