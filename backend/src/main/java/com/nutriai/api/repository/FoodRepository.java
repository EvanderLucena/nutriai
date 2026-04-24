package com.nutriai.api.repository;

import com.nutriai.api.model.Food;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface FoodRepository extends JpaRepository<Food, UUID> {

    /**
     * Paginated list of foods for a nutritionist (D-08).
     */
    Page<Food> findByNutritionistId(UUID nutritionistId, Pageable pageable);

    /**
     * Data isolation: scope by nutritionistId.
     */
    Optional<Food> findByIdAndNutritionistId(UUID id, UUID nutritionistId);

    /**
     * Combined filter query with name search (case-insensitive LIKE) + category (D-08).
     */
    @Query("SELECT f FROM Food f WHERE f.nutritionistId = :nutritionistId " +
           "AND (:search IS NULL OR LOWER(f.name) LIKE LOWER(CONCAT('%', :search, '%')) ESCAPE '!') " +
           "AND (:category IS NULL OR f.category = :category)")
    Page<Food> findByNutritionistIdWithFilters(
            @Param("nutritionistId") UUID nutritionistId,
            @Param("search") String search,
            @Param("category") String category,
            Pageable pageable
    );

    @Modifying
    @Transactional
    @Query("UPDATE Food f SET f.usedCount = f.usedCount + 1 WHERE f.id = :foodId")
    void incrementUsedCount(@Param("foodId") UUID foodId);
}