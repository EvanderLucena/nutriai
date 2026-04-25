package com.nutriai.api.repository;

import com.nutriai.api.model.BiometryAssessment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BiometryAssessmentRepository extends JpaRepository<BiometryAssessment, UUID> {

    List<BiometryAssessment> findByEpisodeIdOrderByAssessmentDateAsc(UUID episodeId);

    List<BiometryAssessment> findByEpisodeIdOrderByAssessmentDateDesc(UUID episodeId);

    Optional<BiometryAssessment> findByIdAndNutritionistId(UUID id, UUID nutritionistId);

    Optional<BiometryAssessment> findTopByEpisodeIdOrderByAssessmentDateDesc(UUID episodeId);
}