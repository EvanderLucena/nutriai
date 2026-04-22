package com.nutriai.api.dto.plan;

import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;

/**
 * DTO for adding an off-plan extra authorization.
 */
public record AddExtraRequest(
        @NotBlank(message = "name é obrigatório")
        String name,
        String quantity,
        BigDecimal kcal,
        BigDecimal prot,
        BigDecimal carb,
        BigDecimal fat
) {}