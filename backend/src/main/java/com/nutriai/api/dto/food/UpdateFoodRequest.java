package com.nutriai.api.dto.food;

import java.math.BigDecimal;
import java.util.List;

/**
 * DTO for updating an existing food item.
 */
public record UpdateFoodRequest(
        String name,
        String category,

        // BASE-only fields
        BigDecimal per100Kcal,
        BigDecimal per100Prot,
        BigDecimal per100Carb,
        BigDecimal per100Fat,
        BigDecimal per100Fiber,

        // PRESET-only fields
        BigDecimal presetGrams,
        BigDecimal presetKcal,
        BigDecimal presetProt,
        BigDecimal presetCarb,
        BigDecimal presetFat,
        String portionLabel,

        String basedOn,

        // Replaces all portions if provided
        List<FoodPortionDto> portions
) {}