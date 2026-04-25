package com.nutriai.api.repository;

import com.nutriai.api.model.Episode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EpisodeRepository extends JpaRepository<Episode, UUID> {

    @Query("SELECT e FROM Episode e JOIN Patient p ON p.id = e.patientId " +
            "WHERE e.id = :id AND p.id = :patientId AND p.nutritionistId = :nutritionistId")
    Optional<Episode> findByIdAndPatientIdAndNutritionistId(
            @Param("id") UUID id,
            @Param("patientId") UUID patientId,
            @Param("nutritionistId") UUID nutritionistId);

    @Query("SELECT e FROM Episode e JOIN Patient p ON p.id = e.patientId " +
            "WHERE p.id = :patientId AND p.nutritionistId = :nutritionistId AND e.endDate IS null " +
            "ORDER BY e.startDate DESC LIMIT 1")
    Optional<Episode> findTopByPatientIdAndNutritionistIdAndEndDateIsNullOrderByStartDateDesc(
            @Param("patientId") UUID patientId, @Param("nutritionistId") UUID nutritionistId);

    @Query("SELECT e FROM Episode e JOIN Patient p ON p.id = e.patientId " +
            "WHERE e.patientId IN :patientIds AND p.nutritionistId = :nutritionistId AND e.endDate IS null " +
            "ORDER BY e.patientId ASC, e.startDate DESC")
    List<Episode> findActiveByPatientIdsAndNutritionistId(
            @Param("patientIds") List<UUID> patientIds,
            @Param("nutritionistId") UUID nutritionistId);

    @Query("SELECT e FROM Episode e JOIN Patient p ON p.id = e.patientId " +
            "WHERE p.id = :patientId AND p.nutritionistId = :nutritionistId " +
            "ORDER BY e.startDate DESC")
    List<Episode> findByPatientIdAndNutritionistIdOrderByStartDateDesc(
            @Param("patientId") UUID patientId, @Param("nutritionistId") UUID nutritionistId);
}
