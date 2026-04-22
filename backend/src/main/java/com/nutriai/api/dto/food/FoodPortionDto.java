package com.nutriai.api.dto.food;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * DTO for a food portion (BASE foods only).
 */
public record FoodPortionDto(
        UUID id,
        String name,
        BigDecimal grams
) {}