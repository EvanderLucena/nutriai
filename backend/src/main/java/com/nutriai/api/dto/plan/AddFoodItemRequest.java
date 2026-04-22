package com.nutriai.api.dto.plan;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * DTO for adding a food item to a meal option.
 */
public record AddFoodItemRequest(
        @NotNull(message = "foodId é obrigatório")
        UUID foodId,

        @NotNull(message = "grams é obrigatório")
        BigDecimal grams,

        String qty
) {}