package com.nutriai.api.repository;

import com.nutriai.api.model.MealExtraction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MealExtractionRepository extends JpaRepository<MealExtraction, UUID> {

    /**
     * Find extractions by patient scoped by nutritionist within date range (tenant isolation, D-14).
     */
    List<MealExtraction> findByPatientIdAndNutritionistIdAndExtractedAtBetween(
            UUID patientId,
            UUID nutritionistId,
            LocalDateTime start,
            LocalDateTime end);

    /**
     * Find extraction by ID scoped to patient (for correction PATCH, D-12).
     */
    Optional<MealExtraction> findByIdAndPatientId(UUID id, UUID patientId);
}