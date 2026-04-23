package com.nutriai.api.dto.plan;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record AddFoodItemRequest(
        @NotNull(message = "foodId é obrigatório")
        UUID foodId,

        @NotNull(message = "referenceAmount é obrigatório")
        BigDecimal referenceAmount
) {}