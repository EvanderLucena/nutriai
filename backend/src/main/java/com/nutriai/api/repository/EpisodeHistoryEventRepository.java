package com.nutriai.api.repository;

import com.nutriai.api.model.EpisodeHistoryEvent;
import org.springframework.data.repository.RepositoryDefinition;

import java.util.List;
import java.util.UUID;

@RepositoryDefinition(domainClass = EpisodeHistoryEvent.class, idClass = UUID.class)
public interface EpisodeHistoryEventRepository {

    EpisodeHistoryEvent save(EpisodeHistoryEvent event);

    void deleteAll();

    List<EpisodeHistoryEvent> findByEpisodeIdAndNutritionistIdOrderByEventAtAsc(
            UUID episodeId,
            UUID nutritionistId);
}
