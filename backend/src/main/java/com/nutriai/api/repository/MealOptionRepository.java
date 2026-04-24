package com.nutriai.api.repository;

import com.nutriai.api.model.MealOption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MealOptionRepository extends JpaRepository<MealOption, UUID> {

    List<MealOption> findByMealSlotIdOrderBySortOrder(UUID mealSlotId);

    void deleteAllByMealSlotId(UUID mealSlotId);

    @Query("SELECT o FROM MealOption o WHERE o.mealSlotId IN :slotIds ORDER BY o.mealSlotId, o.sortOrder")
    List<MealOption> findAllByMealSlotIds(@Param("slotIds") List<UUID> slotIds);
}