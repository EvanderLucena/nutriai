package com.nutriai.api.dto.food;

import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;
import java.util.List;

/**
 * DTO for creating a new food item in the catalog.
 */
public record CreateFoodRequest(
        @NotBlank(message = "Tipo é obrigatório")
        String type,

        @NotBlank(message = "Nome é obrigatório")
        String name,

        String category,

        // BASE-only fields: nutrition per 100g
        BigDecimal per100Kcal,
        BigDecimal per100Prot,
        BigDecimal per100Carb,
        BigDecimal per100Fat,
        BigDecimal per100Fiber,

        // PRESET-only fields: pre-calculated per serving
        BigDecimal presetGrams,
        BigDecimal presetKcal,
        BigDecimal presetProt,
        BigDecimal presetCarb,
        BigDecimal presetFat,
        String portionLabel,

        // Portions for BASE foods
        List<FoodPortionDto> portions
) {}