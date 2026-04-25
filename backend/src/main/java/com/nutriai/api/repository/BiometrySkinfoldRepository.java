package com.nutriai.api.repository;

import com.nutriai.api.model.BiometrySkinfold;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BiometrySkinfoldRepository extends JpaRepository<BiometrySkinfold, UUID> {

    List<BiometrySkinfold> findByAssessmentIdAndNutritionistIdOrderBySortOrder(UUID assessmentId, UUID nutritionistId);

    void deleteAllByAssessmentIdAndNutritionistId(UUID assessmentId, UUID nutritionistId);
}