package com.nutriai.api.service;

import com.nutriai.api.dto.llm.ExtractionItemResult;
import com.nutriai.api.dto.llm.ExtractionResult;
import com.nutriai.api.model.EpisodeHistoryEvent;
import com.nutriai.api.model.ExtractionItem;
import com.nutriai.api.model.MealExtraction;
import com.nutriai.api.repository.EpisodeHistoryEventRepository;
import com.nutriai.api.repository.ExtractionItemRepository;
import com.nutriai.api.repository.MealExtractionRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ExtractionServiceTest {

    @Mock MealExtractionRepository mealExtractionRepository;
    @Mock ExtractionItemRepository extractionItemRepository;
    @Mock EpisodeHistoryEventRepository episodeHistoryEventRepository;

    @InjectMocks
    ExtractionService extractionService;

    private UUID messageId;
    private UUID patientId;
    private UUID nutritionistId;
    private UUID episodeId;

    @BeforeEach
    void setup() {
        messageId = UUID.randomUUID();
        patientId = UUID.randomUUID();
        nutritionistId = UUID.randomUUID();
        episodeId = UUID.randomUUID();
    }

    @Test
    void extractAndSave_validExtraction_persistsMealExtractionAndItems() {
        ExtractionResult extractionResult = new ExtractionResult(
                "almoço",
                List.of(
                        new ExtractionItemResult("arroz integral", 150.0, 170, 3.2, 35, 1.5),
                        new ExtractionItemResult("frango grelhado", 120.0, 198, 25, 0, 10.5)
                ),
                "Comi arroz e frango no almoço"
        );

        MealExtraction savedExtraction = MealExtraction.builder()
                .id(UUID.randomUUID())
                .messageId(messageId)
                .nutritionistId(nutritionistId)
                .patientId(patientId)
                .episodeId(episodeId)
                .extractionRaw("Comi arroz e frango no almoço")
                .mealLabel("almoço")
                .totalKcal(new BigDecimal("368.0"))
                .totalProt(new BigDecimal("28.2"))
                .totalCarb(new BigDecimal("35.0"))
                .totalFat(new BigDecimal("12.0"))
                .build();

        when(mealExtractionRepository.save(any(MealExtraction.class))).thenReturn(savedExtraction);
        when(extractionItemRepository.save(any(ExtractionItem.class))).thenAnswer(i -> i.getArgument(0));
        when(episodeHistoryEventRepository.save(any(EpisodeHistoryEvent.class))).thenAnswer(i -> i.getArgument(0));

        MealExtraction result = extractionService.extractAndSave(
                messageId, patientId, nutritionistId, episodeId, extractionResult);

        assertNotNull(result);
        assertEquals("almoço", result.getMealLabel());

        // Verify MealExtraction was saved with correct totals
        ArgumentCaptor<MealExtraction> extractionCaptor = ArgumentCaptor.forClass(MealExtraction.class);
        verify(mealExtractionRepository).save(extractionCaptor.capture());
        MealExtraction captured = extractionCaptor.getValue();
        assertEquals(messageId, captured.getMessageId());
        assertEquals(patientId, captured.getPatientId());
        assertEquals(nutritionistId, captured.getNutritionistId());
        assertEquals(episodeId, captured.getEpisodeId());
        assertEquals("Comi arroz e frango no almoço", captured.getExtractionRaw());
        assertEquals(0, captured.getTotalKcal().compareTo(new BigDecimal("368")));
        assertEquals(0, captured.getTotalProt().compareTo(new BigDecimal("28.2")));

        // Verify ExtractionItems were saved
        verify(extractionItemRepository, times(2)).save(any(ExtractionItem.class));
    }

    @Test
    void extractAndSave_emitsEpisodeHistoryEvent() {
        ExtractionResult extractionResult = new ExtractionResult(
                "jantar",
                List.of(
                        new ExtractionItemResult("sopa de legumes", 250.0, 120, 5, 18, 3),
                        new ExtractionItemResult("pão integral", 30.0, 70, 2.5, 13, 1)
                ),
                "Jantei sopa e pão"
        );

        MealExtraction savedExtraction = MealExtraction.builder()
                .id(UUID.randomUUID())
                .messageId(messageId)
                .nutritionistId(nutritionistId)
                .patientId(patientId)
                .episodeId(episodeId)
                .extractionRaw("Jantei sopa e pão")
                .mealLabel("jantar")
                .totalKcal(new BigDecimal("190"))
                .totalProt(new BigDecimal("7.5"))
                .totalCarb(new BigDecimal("31"))
                .totalFat(new BigDecimal("4"))
                .build();

        when(mealExtractionRepository.save(any(MealExtraction.class))).thenReturn(savedExtraction);
        when(extractionItemRepository.save(any(ExtractionItem.class))).thenAnswer(i -> i.getArgument(0));
        when(episodeHistoryEventRepository.save(any(EpisodeHistoryEvent.class))).thenAnswer(i -> i.getArgument(0));

        extractionService.extractAndSave(messageId, patientId, nutritionistId, episodeId, extractionResult);

        // Verify EpisodeHistoryEvent was emitted
        ArgumentCaptor<EpisodeHistoryEvent> eventCaptor = ArgumentCaptor.forClass(EpisodeHistoryEvent.class);
        verify(episodeHistoryEventRepository).save(eventCaptor.capture());
        EpisodeHistoryEvent event = eventCaptor.getValue();

        assertEquals("MEAL_EXTRACTION", event.getEventType());
        assertEquals(episodeId, event.getEpisodeId());
        assertEquals(nutritionistId, event.getNutritionistId());
        assertNotNull(event.getSourceRef());
        assertEquals(savedExtraction.getId().toString(), event.getSourceRef());
        assertNotNull(event.getTitle());
        assertTrue(event.getTitle().contains("Jantar"));
        assertTrue(event.getTitle().contains("WhatsApp"));
        assertTrue(event.getDescription().contains("2 itens"));
        assertTrue(event.getDescription().contains("sopa de legumes"));
        assertNotNull(event.getMetadataJson());
        assertTrue(event.getMetadataJson().contains("jantar"));
    }

    @Test
    void extractAndSave_emptyItems_stillPersistsExtractionAndEvent() {
        ExtractionResult extractionResult = new ExtractionResult(
                "lanche",
                List.of(),
                "Tomei um café"
        );

        MealExtraction savedExtraction = MealExtraction.builder()
                .id(UUID.randomUUID())
                .messageId(messageId)
                .nutritionistId(nutritionistId)
                .patientId(patientId)
                .episodeId(episodeId)
                .extractionRaw("Tomei um café")
                .mealLabel("lanche")
                .totalKcal(BigDecimal.ZERO)
                .totalProt(BigDecimal.ZERO)
                .totalCarb(BigDecimal.ZERO)
                .totalFat(BigDecimal.ZERO)
                .build();

        when(mealExtractionRepository.save(any(MealExtraction.class))).thenReturn(savedExtraction);
        when(episodeHistoryEventRepository.save(any(EpisodeHistoryEvent.class))).thenAnswer(i -> i.getArgument(0));

        MealExtraction result = extractionService.extractAndSave(
                messageId, patientId, nutritionistId, episodeId, extractionResult);

        assertNotNull(result);
        assertEquals(0, result.getTotalKcal().intValue());

        // No items to save
        verify(extractionItemRepository, never()).save(any());

        // Event still emitted
        verify(episodeHistoryEventRepository).save(any(EpisodeHistoryEvent.class));
    }
}