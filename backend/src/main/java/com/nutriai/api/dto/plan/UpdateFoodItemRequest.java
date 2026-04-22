package com.nutriai.api.dto.plan;

import java.math.BigDecimal;

/**
 * DTO for updating a food item (grams triggers macro recalculation).
 */
public record UpdateFoodItemRequest(
        BigDecimal grams,
        String qty,
        String prep
) {}