package com.nutriai.api.dto.food;

import com.nutriai.api.model.Food;
import com.nutriai.api.model.FoodPortion;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * DTO for food catalog responses.
 */
public record FoodResponse(
        UUID id,
        String type,
        String name,
        String category,
        // BASE-only
        BigDecimal per100Kcal,
        BigDecimal per100Prot,
        BigDecimal per100Carb,
        BigDecimal per100Fat,
        BigDecimal per100Fiber,
        // PRESET-only
        BigDecimal presetGrams,
        BigDecimal presetKcal,
        BigDecimal presetProt,
        BigDecimal presetCarb,
        BigDecimal presetFat,
        String portionLabel,
        List<FoodPortionDto> portions,
        Integer usedCount,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static FoodResponse from(Food food, List<FoodPortion> portions) {
        return new FoodResponse(
                food.getId(),
                food.getType(),
                food.getName(),
                food.getCategory(),
                food.getPer100Kcal(),
                food.getPer100Prot(),
                food.getPer100Carb(),
                food.getPer100Fat(),
                food.getPer100Fiber(),
                food.getPresetGrams(),
                food.getPresetKcal(),
                food.getPresetProt(),
                food.getPresetCarb(),
                food.getPresetFat(),
                food.getPortionLabel(),
                portions.stream()
                        .map(p -> new FoodPortionDto(p.getId(), p.getName(), p.getGrams()))
                        .toList(),
                food.getUsedCount(),
                food.getCreatedAt(),
                food.getUpdatedAt()
        );
    }
}