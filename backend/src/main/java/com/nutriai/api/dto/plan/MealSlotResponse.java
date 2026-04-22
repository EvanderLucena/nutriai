package com.nutriai.api.dto.plan;

import com.nutriai.api.model.MealFood;
import com.nutriai.api.model.MealOption;
import com.nutriai.api.model.MealSlot;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * DTO for a meal slot within a plan.
 */
public record MealSlotResponse(
        UUID id,
        String label,
        String time,
        List<MealOptionResponse> options
) {
    public static MealSlotResponse from(MealSlot slot, List<MealOption> allOptions, List<MealFood> allItems) {
        List<MealOptionResponse> optionResponses = allOptions.stream()
                .filter(o -> o.getMealSlotId().equals(slot.getId()))
                .map(o -> MealOptionResponse.from(o, allItems))
                .toList();
        return new MealSlotResponse(slot.getId(), slot.getLabel(), slot.getTime(), optionResponses);
    }
}