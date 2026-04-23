package com.nutriai.api.dto.food;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record CreateFoodRequest(
        @NotBlank(message = "Nome é obrigatório")
        String name,

        String category,

        @NotBlank(message = "Unidade é obrigatória")
        String unit,

        @NotNull(message = "Quantidade de referência é obrigatória")
        BigDecimal referenceAmount,

        @NotNull(message = "Kcal é obrigatório")
        BigDecimal kcal,

        @NotNull(message = "Proteína é obrigatória")
        BigDecimal prot,

        @NotNull(message = "Carboidrato é obrigatório")
        BigDecimal carb,

        @NotNull(message = "Gordura é obrigatório")
        BigDecimal fat,

        BigDecimal fiber,

        String prep,
        String portionLabel
) {}