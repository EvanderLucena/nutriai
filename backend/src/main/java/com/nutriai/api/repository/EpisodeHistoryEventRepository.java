package com.nutriai.api.repository;

import com.nutriai.api.model.EpisodeHistoryEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EpisodeHistoryEventRepository extends JpaRepository<EpisodeHistoryEvent, UUID> {

    List<EpisodeHistoryEvent> findByEpisodeIdAndNutritionistIdOrderByEventAtAsc(
            UUID episodeId,
            UUID nutritionistId);
}
