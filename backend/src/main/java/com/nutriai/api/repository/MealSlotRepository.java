package com.nutriai.api.repository;

import com.nutriai.api.model.MealSlot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MealSlotRepository extends JpaRepository<MealSlot, UUID> {

    /**
     * Find meal slots for a plan, ordered by sort order.
     */
    List<MealSlot> findByPlanIdOrderBySortOrder(UUID planId);

    /**
     * Delete all meal slots for a given plan (service-layer cascade).
     */
    void deleteAllByPlanId(UUID planId);
}