package com.nutriai.api.dto.plan;

import java.math.BigDecimal;

public record UpdateFoodItemRequest(
        BigDecimal referenceAmount,
        String prep,
        BigDecimal kcal,
        BigDecimal prot,
        BigDecimal carb,
        BigDecimal fat
) {}