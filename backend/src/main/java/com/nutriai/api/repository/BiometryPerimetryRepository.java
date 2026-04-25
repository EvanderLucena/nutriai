package com.nutriai.api.repository;

import com.nutriai.api.model.BiometryPerimetry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BiometryPerimetryRepository extends JpaRepository<BiometryPerimetry, UUID> {

    List<BiometryPerimetry> findByAssessmentIdOrderBySortOrder(UUID assessmentId);

    void deleteAllByAssessmentId(UUID assessmentId);
}