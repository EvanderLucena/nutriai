package com.nutriai.api.repository;

import com.nutriai.api.model.FoodPortion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface FoodPortionRepository extends JpaRepository<FoodPortion, UUID> {

    /**
     * Find portions for a food, ordered by sort order.
     */
    List<FoodPortion> findByFoodIdOrderBySortOrder(UUID foodId);

    /**
     * Delete all portions for a given food (service-layer cascade).
     */
    void deleteAllByFoodId(UUID foodId);
}