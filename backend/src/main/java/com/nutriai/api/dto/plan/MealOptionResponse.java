package com.nutriai.api.dto.plan;

import com.nutriai.api.model.MealFood;
import com.nutriai.api.model.MealOption;

import java.util.List;
import java.util.UUID;

/**
 * DTO for a meal option within a slot.
 */
public record MealOptionResponse(
        UUID id,
        String name,
        List<MealFoodResponse> items
) {
    public static MealOptionResponse from(MealOption option, List<MealFood> allItems) {
        List<MealFoodResponse> itemResponses = allItems.stream()
                .filter(i -> i.getOptionId().equals(option.getId()))
                .map(MealFoodResponse::from)
                .toList();
        return new MealOptionResponse(option.getId(), option.getName(), itemResponses);
    }
}