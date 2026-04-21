package com.nutriai.api.repository;

import com.nutriai.api.model.Episode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EpisodeRepository extends JpaRepository<Episode, UUID> {

    /**
     * Find all episodes for a patient, ordered by start date descending.
     */
    List<Episode> findByPatientIdOrderByStartDateDesc(UUID patientId);

    /**
     * Find the current active episode (no end date) for a patient.
     * Returns the most recent open episode.
     */
    Optional<Episode> findTopByPatientIdAndEndDateIsNullOrderByStartDateDesc(UUID patientId);
}