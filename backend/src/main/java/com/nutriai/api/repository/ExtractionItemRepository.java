package com.nutriai.api.repository;

import com.nutriai.api.model.ExtractionItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ExtractionItemRepository extends JpaRepository<ExtractionItem, UUID> {

    /**
     * Find all items for a given extraction.
     */
    List<ExtractionItem> findByExtractionIdOrderBySortOrder(UUID extractionId);

    /**
     * Delete all items for a given extraction (used when correcting an extraction).
     */
    void deleteAllByExtractionId(UUID extractionId);
}