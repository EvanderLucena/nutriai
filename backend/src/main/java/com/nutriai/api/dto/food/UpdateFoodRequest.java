package com.nutriai.api.dto.food;

import java.math.BigDecimal;

public record UpdateFoodRequest(
        String name,
        String category,
        String unit,
        BigDecimal referenceAmount,
        BigDecimal kcal,
        BigDecimal prot,
        BigDecimal carb,
        BigDecimal fat,
        BigDecimal fiber,
        String prep,
        String portionLabel
) {}