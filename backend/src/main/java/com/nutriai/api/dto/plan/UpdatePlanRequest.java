package com.nutriai.api.dto.plan;

import java.math.BigDecimal;

/**
 * DTO for updating plan-level fields (title, targets, notes).
 */
public record UpdatePlanRequest(
        String title,
        String notes,
        BigDecimal kcalTarget,
        BigDecimal protTarget,
        BigDecimal carbTarget,
        BigDecimal fatTarget
) {}