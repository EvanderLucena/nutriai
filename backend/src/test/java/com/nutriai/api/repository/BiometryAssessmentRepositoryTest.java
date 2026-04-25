package com.nutriai.api.repository;

import com.nutriai.api.model.BiometryAssessment;
import com.nutriai.api.model.BiometryPerimetry;
import com.nutriai.api.model.BiometrySkinfold;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@ActiveProfiles("test")
class BiometryAssessmentRepositoryTest {

    @Autowired
    private BiometryAssessmentRepository assessmentRepository;

    @Autowired
    private BiometrySkinfoldRepository skinfoldRepository;

    @Autowired
    private BiometryPerimetryRepository perimetryRepository;

    private UUID nutritionistId1;
    private UUID nutritionistId2;
    private UUID episodeId1;
    private UUID episodeId2;

    @BeforeEach
    void setUp() {
        skinfoldRepository.deleteAll();
        perimetryRepository.deleteAll();
        assessmentRepository.deleteAll();
        nutritionistId1 = UUID.randomUUID();
        nutritionistId2 = UUID.randomUUID();
        episodeId1 = UUID.randomUUID();
        episodeId2 = UUID.randomUUID();
    }

    private BiometryAssessment createAssessment(UUID episodeId, UUID nutritionistId, LocalDate date, BigDecimal weight, BigDecimal bodyFat) {
        return BiometryAssessment.builder()
                .episodeId(episodeId)
                .nutritionistId(nutritionistId)
                .assessmentDate(date)
                .weight(weight)
                .bodyFatPercent(bodyFat)
                .build();
    }

    @Test
    void findByEpisodeIdOrderByAssessmentDateAsc_returnsChronologicalOrder() {
        BiometryAssessment a1 = assessmentRepository.save(
                createAssessment(episodeId1, nutritionistId1, LocalDate.of(2025, 1, 10), new BigDecimal("75.00"), new BigDecimal("22.50")));
        BiometryAssessment a2 = assessmentRepository.save(
                createAssessment(episodeId1, nutritionistId1, LocalDate.of(2025, 1, 20), new BigDecimal("74.50"), new BigDecimal("21.80")));
        BiometryAssessment a3 = assessmentRepository.save(
                createAssessment(episodeId1, nutritionistId1, LocalDate.of(2025, 1, 15), new BigDecimal("74.80"), new BigDecimal("22.10")));

        List<BiometryAssessment> result = assessmentRepository.findByEpisodeIdOrderByAssessmentDateAsc(episodeId1);

        assertEquals(3, result.size());
        assertEquals(LocalDate.of(2025, 1, 10), result.get(0).getAssessmentDate());
        assertEquals(LocalDate.of(2025, 1, 15), result.get(1).getAssessmentDate());
        assertEquals(LocalDate.of(2025, 1, 20), result.get(2).getAssessmentDate());
    }

    @Test
    void findByEpisodeIdOrderByAssessmentDateDesc_returnsReverseChronological() {
        assessmentRepository.save(createAssessment(episodeId1, nutritionistId1, LocalDate.of(2025, 1, 10), new BigDecimal("75.00"), new BigDecimal("22.50")));
        assessmentRepository.save(createAssessment(episodeId1, nutritionistId1, LocalDate.of(2025, 1, 20), new BigDecimal("74.50"), new BigDecimal("21.80")));

        List<BiometryAssessment> result = assessmentRepository.findByEpisodeIdOrderByAssessmentDateDesc(episodeId1);

        assertEquals(2, result.size());
        assertEquals(LocalDate.of(2025, 1, 20), result.get(0).getAssessmentDate());
    }

    @Test
    void findByIdAndNutritionistId_returnsEmptyForWrongNutritionist() {
        BiometryAssessment a = assessmentRepository.save(
                createAssessment(episodeId1, nutritionistId1, LocalDate.of(2025, 1, 10), new BigDecimal("75.00"), new BigDecimal("22.50")));

        Optional<BiometryAssessment> result = assessmentRepository.findByIdAndNutritionistId(a.getId(), nutritionistId2);

        assertTrue(result.isEmpty());
    }

    @Test
    void findByIdAndNutritionistId_returnsAssessmentForCorrectNutritionist() {
        BiometryAssessment a = assessmentRepository.save(
                createAssessment(episodeId1, nutritionistId1, LocalDate.of(2025, 1, 10), new BigDecimal("75.00"), new BigDecimal("22.50")));

        Optional<BiometryAssessment> result = assessmentRepository.findByIdAndNutritionistId(a.getId(), nutritionistId1);

        assertTrue(result.isPresent());
        assertEquals(a.getId(), result.get().getId());
    }

    @Test
    void findTopByEpisodeIdOrderByAssessmentDateDesc_returnsLatest() {
        assessmentRepository.save(createAssessment(episodeId1, nutritionistId1, LocalDate.of(2025, 1, 10), new BigDecimal("75.00"), new BigDecimal("22.50")));
        BiometryAssessment latest = assessmentRepository.save(
                createAssessment(episodeId1, nutritionistId1, LocalDate.of(2025, 1, 20), new BigDecimal("74.50"), new BigDecimal("21.80")));

        Optional<BiometryAssessment> result = assessmentRepository.findTopByEpisodeIdOrderByAssessmentDateDesc(episodeId1);

        assertTrue(result.isPresent());
        assertEquals(LocalDate.of(2025, 1, 20), result.get().getAssessmentDate());
    }

    @Test
    void findByEpisodeId_scopesToSingleEpisode() {
        assessmentRepository.save(createAssessment(episodeId1, nutritionistId1, LocalDate.of(2025, 1, 10), new BigDecimal("75.00"), new BigDecimal("22.50")));
        assessmentRepository.save(createAssessment(episodeId1, nutritionistId1, LocalDate.of(2025, 1, 15), new BigDecimal("74.80"), new BigDecimal("22.10")));
        assessmentRepository.save(createAssessment(episodeId2, nutritionistId1, LocalDate.of(2025, 1, 12), new BigDecimal("80.00"), new BigDecimal("25.00")));

        List<BiometryAssessment> result = assessmentRepository.findByEpisodeIdOrderByAssessmentDateAsc(episodeId1);

        assertEquals(2, result.size());
        assertTrue(result.stream().allMatch(a -> a.getEpisodeId().equals(episodeId1)));
    }

    @Test
    void skinfold_and_perimetry_persistWithAssessment() {
        BiometryAssessment a = createAssessment(episodeId1, nutritionistId1, LocalDate.of(2025, 1, 10), new BigDecimal("75.00"), new BigDecimal("22.50"));

        BiometrySkinfold skinfold = BiometrySkinfold.builder()
                .assessment(a)
                .measureKey("triceps")
                .valueMm(new BigDecimal("12.50"))
                .sortOrder(1)
                .build();

        BiometryPerimetry perimetry = BiometryPerimetry.builder()
                .assessment(a)
                .measureKey("cintura")
                .valueCm(new BigDecimal("82.30"))
                .sortOrder(1)
                .build();

        a.setSkinfolds(List.of(skinfold));
        a.setPerimetries(List.of(perimetry));

        BiometryAssessment saved = assessmentRepository.save(a);

        List<BiometrySkinfold> skinfolds = skinfoldRepository.findByAssessmentIdOrderBySortOrder(saved.getId());
        List<BiometryPerimetry> perimetries = perimetryRepository.findByAssessmentIdOrderBySortOrder(saved.getId());

        assertEquals(1, skinfolds.size());
        assertEquals("triceps", skinfolds.get(0).getMeasureKey());
        assertEquals(0, new BigDecimal("12.50").compareTo(skinfolds.get(0).getValueMm()));

        assertEquals(1, perimetries.size());
        assertEquals("cintura", perimetries.get(0).getMeasureKey());
        assertEquals(0, new BigDecimal("82.30").compareTo(perimetries.get(0).getValueCm()));
    }
}