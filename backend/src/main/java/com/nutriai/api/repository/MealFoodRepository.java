package com.nutriai.api.repository;

import com.nutriai.api.model.MealFood;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MealFoodRepository extends JpaRepository<MealFood, UUID> {

    /**
     * Find food items for an option, ordered by sort order.
     */
    List<MealFood> findByOptionIdOrderBySortOrder(UUID optionId);

    /**
     * Delete all food items for a given option (service-layer cascade).
     */
    void deleteAllByOptionId(UUID optionId);
}