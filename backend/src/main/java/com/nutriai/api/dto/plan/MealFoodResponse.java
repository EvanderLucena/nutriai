package com.nutriai.api.dto.plan;

import com.nutriai.api.model.MealFood;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * DTO for a food item within a meal option.
 */
public record MealFoodResponse(
        UUID id,
        UUID foodId,
        String foodName,
        String qty,
        BigDecimal grams,
        String prep,
        BigDecimal kcal,
        BigDecimal prot,
        BigDecimal carb,
        BigDecimal fat
) {
    public static MealFoodResponse from(MealFood item) {
        return new MealFoodResponse(
                item.getId(),
                item.getFoodId(),
                item.getFoodName(),
                item.getQty(),
                item.getGrams(),
                item.getPrep(),
                item.getKcal(),
                item.getProt(),
                item.getCarb(),
                item.getFat()
        );
    }
}