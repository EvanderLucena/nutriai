package com.nutriai.api.service;

import com.nutriai.api.dto.llm.ExtractionItemResult;
import com.nutriai.api.dto.llm.ExtractionResult;
import com.nutriai.api.model.EpisodeHistoryEvent;
import com.nutriai.api.model.ExtractionItem;
import com.nutriai.api.model.MealExtraction;
import com.nutriai.api.repository.EpisodeHistoryEventRepository;
import com.nutriai.api.repository.ExtractionItemRepository;
import com.nutriai.api.repository.MealExtractionRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Persists extracted meal data and emits timeline events per D-11, D-13.
 * Extractions are authoritative — saved directly as confirmed (D-11).
 */
@Service
public class ExtractionService {

    private static final Logger log = LoggerFactory.getLogger(ExtractionService.class);

    private final MealExtractionRepository mealExtractionRepository;
    private final ExtractionItemRepository extractionItemRepository;
    private final EpisodeHistoryEventRepository episodeHistoryEventRepository;
    private final ObjectMapper objectMapper;

    public ExtractionService(
            MealExtractionRepository mealExtractionRepository,
            ExtractionItemRepository extractionItemRepository,
            EpisodeHistoryEventRepository episodeHistoryEventRepository) {
        this.mealExtractionRepository = mealExtractionRepository;
        this.extractionItemRepository = extractionItemRepository;
        this.episodeHistoryEventRepository = episodeHistoryEventRepository;
        this.objectMapper = new ObjectMapper();
    }

    /**
     * Extract meal data from LLM response, persist all items, and emit EpisodeHistoryEvent.
     *
     * @param messageId        the WhatsAppMessage ID
     * @param patientId        the patient ID
     * @param nutritionistId   the nutritionist ID
     * @param episodeId        the active episode ID
     * @param extractionResult the structured extraction from LLM
     * @return the saved MealExtraction
     */
    @Transactional
    public MealExtraction extractAndSave(
            UUID messageId,
            UUID patientId,
            UUID nutritionistId,
            UUID episodeId,
            ExtractionResult extractionResult) {

        // 1. Calculate total macros from items
        BigDecimal totalKcal = BigDecimal.ZERO;
        BigDecimal totalProt = BigDecimal.ZERO;
        BigDecimal totalCarb = BigDecimal.ZERO;
        BigDecimal totalFat = BigDecimal.ZERO;

        List<ExtractionItemResult> items = extractionResult.items();
        if (items != null) {
            for (ExtractionItemResult item : items) {
                totalKcal = totalKcal.add(BigDecimal.valueOf(item.kcal()));
                totalProt = totalProt.add(BigDecimal.valueOf(item.prot()));
                totalCarb = totalCarb.add(BigDecimal.valueOf(item.carb()));
                totalFat = totalFat.add(BigDecimal.valueOf(item.fat()));
            }
        }

        // 2. Create and persist MealExtraction
        MealExtraction extraction = MealExtraction.builder()
                .messageId(messageId)
                .nutritionistId(nutritionistId)
                .patientId(patientId)
                .episodeId(episodeId)
                .extractionRaw(extractionResult.extractionRaw())
                .mealLabel(extractionResult.mealLabel())
                .totalKcal(totalKcal)
                .totalProt(totalProt)
                .totalCarb(totalCarb)
                .totalFat(totalFat)
                .extractedAt(LocalDateTime.now())
                .build();

        MealExtraction saved = mealExtractionRepository.save(extraction);
        log.info("Saved MealExtraction id={}, patientId={}, mealLabel={}, totalKcal={}",
                saved.getId(), patientId, extractionResult.mealLabel(), totalKcal);

        // 3. Persist ExtractionItems
        if (items != null) {
            for (int i = 0; i < items.size(); i++) {
                ExtractionItemResult itemResult = items.get(i);
                ExtractionItem item = ExtractionItem.builder()
                        .extractionId(saved.getId())
                        .name(itemResult.name())
                        .kcal(BigDecimal.valueOf(itemResult.kcal()))
                        .prot(BigDecimal.valueOf(itemResult.prot()))
                        .carb(BigDecimal.valueOf(itemResult.carb()))
                        .fat(BigDecimal.valueOf(itemResult.fat()))
                        .grams(itemResult.grams() != null ? BigDecimal.valueOf(itemResult.grams()) : null)
                        .sortOrder(i)
                        .build();
                extractionItemRepository.save(item);
            }
        }

        // 4. Emit EpisodeHistoryEvent per D-13
        emitHistoryEvent(saved, extractionResult, nutritionistId, episodeId);

        return saved;
    }

    /**
     * Emit a MEAL_EXTRACTION EpisodeHistoryEvent for the timeline.
     */
    private void emitHistoryEvent(
            MealExtraction extraction,
            ExtractionResult extractionResult,
            UUID nutritionistId,
            UUID episodeId) {

        String mealLabel = extractionResult.mealLabel() != null ? extractionResult.mealLabel() : "Refeição";
        String capitalizedLabel = mealLabel.substring(0, 1).toUpperCase() + mealLabel.substring(1);

        String title = capitalizedLabel + " extraído via WhatsApp";

        // Build description: "4 itens: arroz, feijão, frango, salada"
        String description = buildDescription(extractionResult);

        // Build metadata JSON
        String metadataJson = buildMetadataJson(extractionResult, extraction);

        EpisodeHistoryEvent event = EpisodeHistoryEvent.builder()
                .episodeId(episodeId)
                .nutritionistId(nutritionistId)
                .eventType("MEAL_EXTRACTION")
                .eventAt(extraction.getExtractedAt())
                .title(title)
                .description(description)
                .sourceRef(extraction.getId().toString())
                .metadataJson(metadataJson)
                .build();

        episodeHistoryEventRepository.save(event);
        log.info("Emitted MEAL_EXTRACTION event for extraction {}", extraction.getId());
    }

    private String buildDescription(ExtractionResult extractionResult) {
        if (extractionResult.items() == null || extractionResult.items().isEmpty()) {
            return "0 itens";
        }
        int count = extractionResult.items().size();
        String itemNames = extractionResult.items().stream()
                .map(ExtractionItemResult::name)
                .reduce((a, b) -> a + ", " + b)
                .orElse("");
        return count + " itens: " + itemNames;
    }

    private String buildMetadataJson(ExtractionResult extractionResult, MealExtraction extraction) {
        try {
            var metadata = new java.util.LinkedHashMap<String, Object>();
            metadata.put("mealLabel", extractionResult.mealLabel());
            metadata.put("items", extractionResult.items());
            metadata.put("totals", java.util.Map.of(
                    "kcal", extraction.getTotalKcal(),
                    "prot", extraction.getTotalProt(),
                    "carb", extraction.getTotalCarb(),
                    "fat", extraction.getTotalFat()
            ));
            return objectMapper.writeValueAsString(metadata);
        } catch (JsonProcessingException e) {
            log.warn("Failed to serialize extraction metadata: {}", e.getMessage());
            return "{}";
        }
    }
}