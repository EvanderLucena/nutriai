package com.nutriai.api.repository;

import com.nutriai.api.model.MealOption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MealOptionRepository extends JpaRepository<MealOption, UUID> {

    /**
     * Find options for a meal slot, ordered by sort order.
     */
    List<MealOption> findByMealSlotIdOrderBySortOrder(UUID mealSlotId);

    /**
     * Delete all options for a given meal slot (service-layer cascade).
     */
    void deleteAllByMealSlotId(UUID mealSlotId);
}