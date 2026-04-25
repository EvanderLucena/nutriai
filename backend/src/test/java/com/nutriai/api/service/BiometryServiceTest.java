package com.nutriai.api.service;

import com.nutriai.api.dto.biometry.*;
import com.nutriai.api.exception.ResourceNotFoundException;
import com.nutriai.api.model.*;
import com.nutriai.api.repository.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BiometryServiceTest {

    @Mock private BiometryAssessmentRepository assessmentRepository;
    @Mock private BiometrySkinfoldRepository skinfoldRepository;
    @Mock private BiometryPerimetryRepository perimetryRepository;
    @Mock private EpisodeHistoryEventRepository historyEventRepository;
    @Mock private PatientRepository patientRepository;
    @Mock private EpisodeRepository episodeRepository;
    @Mock private MealPlanRepository mealPlanRepository;
    @Mock private MealSlotRepository mealSlotRepository;
    @Mock private MealOptionRepository mealOptionRepository;

    @InjectMocks
    private BiometryService biometryService;

    private UUID nutritionistId;
    private UUID patientId;
    private UUID episodeId;
    private Patient patient;
    private Episode activeEpisode;

    @BeforeEach
    void setUp() {
        nutritionistId = UUID.randomUUID();
        patientId = UUID.randomUUID();
        episodeId = UUID.randomUUID();
        patient = Patient.builder()
                .id(patientId)
                .nutritionistId(nutritionistId)
                .name("Maria")
                .objective(PatientObjective.SAUDE_GERAL)
                .build();
        activeEpisode = Episode.builder().id(episodeId).patientId(patientId).nutritionistId(nutritionistId).build();
    }

    @Test
    void createAssessment_succeedsWithRequiredFieldsOnly() {
        when(patientRepository.findByIdAndNutritionistId(patientId, nutritionistId)).thenReturn(Optional.of(patient));
        when(episodeRepository.findFirstByPatientIdAndNutritionistIdAndEndDateIsNullOrderByStartDateDesc(patientId, nutritionistId)).thenReturn(Optional.of(activeEpisode));
        when(assessmentRepository.save(any(BiometryAssessment.class))).thenAnswer(inv -> {
            BiometryAssessment a = inv.getArgument(0);
            a.setId(UUID.randomUUID());
            return a;
        });
        when(historyEventRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        CreateBiometryAssessmentRequest req = new CreateBiometryAssessmentRequest(
                LocalDate.of(2025, 1, 10), new BigDecimal("75.00"), new BigDecimal("22.50"),
                null, null, null, null, null, null, null, null);

        BiometryAssessmentResponse response = biometryService.createAssessment(nutritionistId, patientId, req);

        assertNotNull(response);
        assertEquals(LocalDate.of(2025, 1, 10), response.assessmentDate());
        verify(assessmentRepository).save(argThat(a -> patientId.equals(a.getPatientId())));
        verify(historyEventRepository).save(argThat(e ->
                e.getEventType().equals("EPISODE_BIOMETRY_CREATED") && e.getEventAt() != null));
    }

    @Test
    void createAssessment_succeedsWithAllOptionalFields() {
        when(patientRepository.findByIdAndNutritionistId(patientId, nutritionistId)).thenReturn(Optional.of(patient));
        when(episodeRepository.findFirstByPatientIdAndNutritionistIdAndEndDateIsNullOrderByStartDateDesc(patientId, nutritionistId)).thenReturn(Optional.of(activeEpisode));
        when(skinfoldRepository.findByAssessmentIdAndNutritionistIdOrderBySortOrder(any(), eq(nutritionistId)))
                .thenReturn(List.of(BiometrySkinfold.builder()
                        .measureKey("triceps")
                        .valueMm(new BigDecimal("12.50"))
                        .sortOrder(1)
                        .build()));
        when(perimetryRepository.findByAssessmentIdAndNutritionistIdOrderBySortOrder(any(), eq(nutritionistId)))
                .thenReturn(List.of(BiometryPerimetry.builder()
                        .measureKey("cintura")
                        .valueCm(new BigDecimal("82.30"))
                        .sortOrder(1)
                        .build()));
        when(assessmentRepository.save(any(BiometryAssessment.class))).thenAnswer(inv -> {
            BiometryAssessment a = inv.getArgument(0);
            a.setId(UUID.randomUUID());
            return a;
        });
        when(historyEventRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        CreateBiometryAssessmentRequest req = new CreateBiometryAssessmentRequest(
                LocalDate.of(2025, 1, 10), new BigDecimal("75.00"), new BigDecimal("22.50"),
                new BigDecimal("58.80"), new BigDecimal("55.00"), 5, 1600, "Omron", "Notes",
                List.of(new CreateBiometryAssessmentRequest.SkinfoldEntry("triceps", new BigDecimal("12.50"), 1)),
                List.of(new CreateBiometryAssessmentRequest.PerimetryEntry("cintura", new BigDecimal("82.30"), 1)));

        BiometryAssessmentResponse response = biometryService.createAssessment(nutritionistId, patientId, req);

        assertNotNull(response);
        assertEquals(new BigDecimal("58.80"), response.leanMassKg());
        assertEquals("Omron", response.device());
        assertEquals(1, response.skinfolds().size());
        assertEquals(1, response.perimetry().size());

        ArgumentCaptor<BiometryAssessment> assessmentCaptor = ArgumentCaptor.forClass(BiometryAssessment.class);
        verify(assessmentRepository).save(assessmentCaptor.capture());
        BiometryAssessment savedAssessment = assessmentCaptor.getValue();
        assertEquals(patientId, savedAssessment.getPatientId());
        assertEquals(1, savedAssessment.getSkinfolds().size());
        assertEquals("triceps", savedAssessment.getSkinfolds().get(0).getMeasureKey());
        assertEquals(nutritionistId, savedAssessment.getSkinfolds().get(0).getNutritionistId());
        assertEquals(1, savedAssessment.getPerimetries().size());
        assertEquals("cintura", savedAssessment.getPerimetries().get(0).getMeasureKey());
        assertEquals(nutritionistId, savedAssessment.getPerimetries().get(0).getNutritionistId());
    }

    @Test
    void createAssessment_failsWhenNoActiveEpisode() {
        when(patientRepository.findByIdAndNutritionistId(patientId, nutritionistId)).thenReturn(Optional.of(patient));
        when(episodeRepository.findFirstByPatientIdAndNutritionistIdAndEndDateIsNullOrderByStartDateDesc(patientId, nutritionistId)).thenReturn(Optional.empty());

        CreateBiometryAssessmentRequest req = new CreateBiometryAssessmentRequest(
                LocalDate.of(2025, 1, 10), new BigDecimal("75.00"), new BigDecimal("22.50"),
                null, null, null, null, null, null, null, null);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> biometryService.createAssessment(nutritionistId, patientId, req));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
    }

    @Test
    void createAssessment_failsWhenPatientNotOwnedByNutritionist() {
        when(patientRepository.findByIdAndNutritionistId(patientId, nutritionistId)).thenReturn(Optional.empty());

        CreateBiometryAssessmentRequest req = new CreateBiometryAssessmentRequest(
                LocalDate.of(2025, 1, 10), new BigDecimal("75.00"), new BigDecimal("22.50"),
                null, null, null, null, null, null, null, null);

        assertThrows(ResourceNotFoundException.class,
                () -> biometryService.createAssessment(nutritionistId, patientId, req));
    }

    @Test
    void updateAssessment_modifiesOnlyProvidedFields() {
        BiometryAssessment existing = BiometryAssessment.builder()
                .id(UUID.randomUUID())
                .episodeId(episodeId)
                .patientId(patientId)
                .nutritionistId(nutritionistId)
                .assessmentDate(LocalDate.of(2025, 1, 10))
                .weight(new BigDecimal("75.00"))
                .bodyFatPercent(new BigDecimal("22.50"))
                .build();
        existing.setSkinfolds(List.of());
        existing.setPerimetries(List.of());

        when(assessmentRepository.findByIdAndPatientIdAndNutritionistId(
                existing.getId(), patientId, nutritionistId)).thenReturn(Optional.of(existing));
        when(assessmentRepository.save(any(BiometryAssessment.class))).thenAnswer(inv -> inv.getArgument(0));
        when(historyEventRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UpdateBiometryAssessmentRequest req = new UpdateBiometryAssessmentRequest(
                null, new BigDecimal("74.00"), null, null, null, null, null, null, null, null, null);

        BiometryAssessmentResponse response = biometryService.updateAssessment(nutritionistId, patientId, existing.getId(), req);

        assertNotNull(response);
        assertEquals(new BigDecimal("74.00"), response.weight());
        assertEquals(LocalDate.of(2025, 1, 10), response.assessmentDate());
        verify(historyEventRepository).save(argThat(e ->
                e.getEventType().equals("EPISODE_BIOMETRY_UPDATED") && e.getEventAt() != null));
    }

    @Test
    void updateAssessment_mergesChildRecordsById() {
        UUID assessmentId = UUID.randomUUID();
        UUID skinfoldId = UUID.randomUUID();
        UUID perimetryId = UUID.randomUUID();

        BiometryAssessment existing = BiometryAssessment.builder()
                .id(assessmentId)
                .episodeId(episodeId)
                .patientId(patientId)
                .nutritionistId(nutritionistId)
                .assessmentDate(LocalDate.of(2025, 1, 10))
                .weight(new BigDecimal("75.00"))
                .bodyFatPercent(new BigDecimal("22.50"))
                .build();

        BiometrySkinfold skinfold = BiometrySkinfold.builder()
                .id(skinfoldId)
                .assessment(existing)
                .nutritionistId(nutritionistId)
                .measureKey("triceps")
                .valueMm(new BigDecimal("12.50"))
                .sortOrder(1)
                .build();
        BiometryPerimetry perimetry = BiometryPerimetry.builder()
                .id(perimetryId)
                .assessment(existing)
                .nutritionistId(nutritionistId)
                .measureKey("cintura")
                .valueCm(new BigDecimal("82.30"))
                .sortOrder(1)
                .build();

        existing.setSkinfolds(new ArrayList<>(List.of(skinfold)));
        existing.setPerimetries(new ArrayList<>(List.of(perimetry)));

        when(assessmentRepository.findByIdAndPatientIdAndNutritionistId(
                assessmentId, patientId, nutritionistId)).thenReturn(Optional.of(existing));
        when(assessmentRepository.save(any(BiometryAssessment.class))).thenAnswer(inv -> inv.getArgument(0));
        when(historyEventRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(skinfoldRepository.findByAssessmentIdAndNutritionistIdOrderBySortOrder(assessmentId, nutritionistId))
                .thenAnswer(inv -> existing.getSkinfolds());
        when(perimetryRepository.findByAssessmentIdAndNutritionistIdOrderBySortOrder(assessmentId, nutritionistId))
                .thenAnswer(inv -> existing.getPerimetries());

        UpdateBiometryAssessmentRequest req = new UpdateBiometryAssessmentRequest(
                null, null, null, null, null, null, null, null, null,
                List.of(new UpdateBiometryAssessmentRequest.SkinfoldEntry(
                        skinfoldId, "triceps", new BigDecimal("13.10"), 1)),
                List.of(new UpdateBiometryAssessmentRequest.PerimetryEntry(
                        perimetryId, "cintura", new BigDecimal("83.20"), 1)));

        BiometryAssessmentResponse response = biometryService.updateAssessment(nutritionistId, patientId, assessmentId, req);

        assertEquals(skinfoldId, response.skinfolds().get(0).id());
        assertEquals(new BigDecimal("13.10"), response.skinfolds().get(0).valueMm());
        assertEquals(perimetryId, response.perimetry().get(0).id());
        assertEquals(new BigDecimal("83.20"), response.perimetry().get(0).valueCm());
        verify(skinfoldRepository, never()).deleteAllByAssessmentIdAndNutritionistId(any(), any());
        verify(perimetryRepository, never()).deleteAllByAssessmentIdAndNutritionistId(any(), any());
    }

    @Test
    void createAndUpdate_emitHistoryEvents() {
        when(patientRepository.findByIdAndNutritionistId(patientId, nutritionistId)).thenReturn(Optional.of(patient));
        when(episodeRepository.findFirstByPatientIdAndNutritionistIdAndEndDateIsNullOrderByStartDateDesc(patientId, nutritionistId)).thenReturn(Optional.of(activeEpisode));
        when(assessmentRepository.save(any(BiometryAssessment.class))).thenAnswer(inv -> {
            BiometryAssessment a = inv.getArgument(0);
            if (a.getId() == null) a.setId(UUID.randomUUID());
            return a;
        });
        when(historyEventRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        CreateBiometryAssessmentRequest createReq = new CreateBiometryAssessmentRequest(
                LocalDate.of(2025, 1, 10), new BigDecimal("75.00"), new BigDecimal("22.50"),
                null, null, null, null, null, null, null, null);

        biometryService.createAssessment(nutritionistId, patientId, createReq);
        verify(historyEventRepository).save(argThat(e ->
                e.getEventType().equals("EPISODE_BIOMETRY_CREATED") && e.getEventAt() != null));
    }

    @Test
    void getHistorySnapshot_countsScopedMealData() {
        UUID closedEpisodeId = UUID.randomUUID();
        UUID planId = UUID.randomUUID();
        UUID slotId = UUID.randomUUID();
        UUID optionId = UUID.randomUUID();

        Episode closedEpisode = Episode.builder()
                .id(closedEpisodeId)
                .patientId(patientId)
                .nutritionistId(nutritionistId)
                .startDate(LocalDateTime.of(2025, 1, 1, 0, 0))
                .endDate(LocalDateTime.of(2025, 3, 1, 0, 0))
                .build();
        MealPlan plan = MealPlan.builder()
                .id(planId)
                .episodeId(closedEpisodeId)
                .nutritionistId(nutritionistId)
                .build();
        MealSlot slot = MealSlot.builder()
                .id(slotId)
                .planId(planId)
                .label("Café da manhã")
                .sortOrder(0)
                .build();
        MealOption option = MealOption.builder()
                .id(optionId)
                .mealSlotId(slotId)
                .name("Opção 1")
                .sortOrder(0)
                .build();

        when(patientRepository.findByIdAndNutritionistId(patientId, nutritionistId)).thenReturn(Optional.of(patient));
        when(episodeRepository.findByIdAndPatientIdAndNutritionistId(
                closedEpisodeId, patientId, nutritionistId)).thenReturn(Optional.of(closedEpisode));
        when(assessmentRepository.findByEpisodeIdAndPatientIdAndNutritionistIdOrderByAssessmentDateAsc(
                closedEpisodeId, patientId, nutritionistId)).thenReturn(List.of());
        when(historyEventRepository.findByEpisodeIdAndNutritionistIdOrderByEventAtAsc(
                closedEpisodeId, nutritionistId)).thenReturn(List.of());
        when(mealPlanRepository.findByEpisodeIdAndNutritionistId(closedEpisodeId, nutritionistId))
                .thenReturn(Optional.of(plan));
        when(mealSlotRepository.findByPlanIdAndNutritionistIdOrderBySortOrder(planId, nutritionistId))
                .thenReturn(List.of(slot));
        when(mealOptionRepository.findByPlanIdAndNutritionistIdOrderByMealSlotIdAndSortOrder(planId, nutritionistId))
                .thenReturn(List.of(option));

        BiometryHistorySnapshotResponse result = biometryService.getHistorySnapshot(nutritionistId, patientId, closedEpisodeId);

        assertEquals(1, result.mealSlotCount());
        assertEquals(1, result.foodItemCount());
        verify(mealSlotRepository).findByPlanIdAndNutritionistIdOrderBySortOrder(planId, nutritionistId);
        verify(mealOptionRepository).findByPlanIdAndNutritionistIdOrderByMealSlotIdAndSortOrder(planId, nutritionistId);
        verify(mealSlotRepository, never()).findByPlanIdOrderBySortOrder(any());
        verify(mealOptionRepository, never()).findAllByMealSlotIds(anyList());
    }

    @Test
    void updateAssessment_failsWhenNotOwnedByNutritionist() {
        UUID assessmentId = UUID.randomUUID();
        when(assessmentRepository.findByIdAndPatientIdAndNutritionistId(
                assessmentId, patientId, nutritionistId)).thenReturn(Optional.empty());

        UpdateBiometryAssessmentRequest req = new UpdateBiometryAssessmentRequest(null, null, null, null, null, null, null, null, null, null, null);

        assertThrows(ResourceNotFoundException.class,
                () -> biometryService.updateAssessment(nutritionistId, patientId, assessmentId, req));
    }

    @Test
    void updateAssessment_failsWhenRoutePatientDoesNotOwnAssessmentEpisode() {
        UUID assessmentId = UUID.randomUUID();
        when(assessmentRepository.findByIdAndPatientIdAndNutritionistId(
                assessmentId, patientId, nutritionistId)).thenReturn(Optional.empty());

        UpdateBiometryAssessmentRequest req = new UpdateBiometryAssessmentRequest(
                null, new BigDecimal("74.00"), null, null, null, null, null, null, null, null, null);

        assertThrows(ResourceNotFoundException.class,
                () -> biometryService.updateAssessment(nutritionistId, patientId, assessmentId, req));
        verify(assessmentRepository, never()).save(any());
        verify(historyEventRepository, never()).save(any());
    }

    @Test
    void listHistoryEpisodes_returnsOnlyClosedEpisodesWithBiometryInfo() {
        when(patientRepository.findByIdAndNutritionistId(patientId, nutritionistId)).thenReturn(Optional.of(patient));

        Episode closedEpisode = Episode.builder()
                .id(UUID.randomUUID()).patientId(patientId)
                .nutritionistId(nutritionistId)
                .startDate(LocalDateTime.of(2025, 1, 1, 0, 0))
                .endDate(LocalDateTime.of(2025, 3, 1, 0, 0))
                .build();
        Episode activeEpisode = Episode.builder()
                .id(episodeId).patientId(patientId)
                .nutritionistId(nutritionistId)
                .startDate(LocalDateTime.of(2025, 3, 1, 0, 0))
                .build();
        when(episodeRepository.findByPatientIdAndNutritionistIdAndEndDateIsNotNullOrderByStartDateDesc(patientId, nutritionistId)).thenReturn(List.of(closedEpisode));
        when(assessmentRepository.findByEpisodeIdInAndPatientIdAndNutritionistIdOrderByAssessmentDateAsc(
                List.of(closedEpisode.getId()), patientId, nutritionistId))
                .thenReturn(List.of(BiometryAssessment.builder()
                        .id(UUID.randomUUID())
                        .episodeId(closedEpisode.getId())
                        .patientId(patientId)
                        .build()));

        List<BiometryHistoryEpisodeResponse> result = biometryService.listHistoryEpisodes(nutritionistId, patientId);

        assertEquals(1, result.size());
        assertEquals(closedEpisode.getId(), result.get(0).episodeId());
        assertTrue(result.get(0).hasBiometry());
        assertEquals(59, result.get(0).durationDays());
    }

    @Test
    void listHistoryEpisodes_returnsEmptyWhenNoClosedEpisodes() {
        when(patientRepository.findByIdAndNutritionistId(patientId, nutritionistId)).thenReturn(Optional.of(patient));
        when(episodeRepository.findByPatientIdAndNutritionistIdAndEndDateIsNotNullOrderByStartDateDesc(patientId, nutritionistId)).thenReturn(List.of());

        List<BiometryHistoryEpisodeResponse> result = biometryService.listHistoryEpisodes(nutritionistId, patientId);

        assertTrue(result.isEmpty());
    }

    @Test
    void getHistorySnapshot_returnsAssessmentsAndTimeline() {
        UUID closedEpisodeId = UUID.randomUUID();
        Episode closedEpisode = Episode.builder()
                .id(closedEpisodeId).patientId(patientId)
                .nutritionistId(nutritionistId)
                .startDate(LocalDateTime.of(2025, 1, 1, 0, 0))
                .endDate(LocalDateTime.of(2025, 3, 1, 0, 0))
                .build();

        when(patientRepository.findByIdAndNutritionistId(patientId, nutritionistId)).thenReturn(Optional.of(patient));
        when(episodeRepository.findByIdAndPatientIdAndNutritionistId(
                closedEpisodeId, patientId, nutritionistId)).thenReturn(Optional.of(closedEpisode));
        when(assessmentRepository.findByEpisodeIdAndPatientIdAndNutritionistIdOrderByAssessmentDateAsc(
                closedEpisodeId, patientId, nutritionistId))
                .thenReturn(List.of());
        when(historyEventRepository.findByEpisodeIdAndNutritionistIdOrderByEventAtAsc(closedEpisodeId, nutritionistId))
                .thenReturn(List.of());
        when(mealPlanRepository.findByEpisodeIdAndNutritionistId(closedEpisodeId, nutritionistId)).thenReturn(Optional.empty());

        BiometryHistorySnapshotResponse result = biometryService.getHistorySnapshot(nutritionistId, patientId, closedEpisodeId);

        assertNotNull(result);
        assertEquals(closedEpisodeId, result.episodeId());
        assertEquals(patient.getObjective().getPortugueseLabel(), result.episodeObjective());
        assertEquals(0, result.assessments().size());
        assertEquals(0, result.timelineEvents().size());
        assertEquals(0, result.mealSlotCount());
    }

    @Test
    void getHistorySnapshot_failsWhenEpisodeBelongsToDifferentPatient() {
        UUID otherEpisodeId = UUID.randomUUID();

        when(patientRepository.findByIdAndNutritionistId(patientId, nutritionistId)).thenReturn(Optional.of(patient));
        when(episodeRepository.findByIdAndPatientIdAndNutritionistId(
                otherEpisodeId, patientId, nutritionistId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> biometryService.getHistorySnapshot(nutritionistId, patientId, otherEpisodeId));
        verify(assessmentRepository, never())
                .findByEpisodeIdAndNutritionistIdOrderByAssessmentDateAsc(any(), any());
        verify(historyEventRepository, never())
                .findByEpisodeIdAndNutritionistIdOrderByEventAtAsc(any(), any());
        verify(mealPlanRepository, never()).findByEpisodeIdAndNutritionistId(any(), any());
    }

    @Test
    void getHistorySnapshot_failsForActiveEpisode() {
        when(patientRepository.findByIdAndNutritionistId(patientId, nutritionistId)).thenReturn(Optional.of(patient));
        when(episodeRepository.findByIdAndPatientIdAndNutritionistId(
                episodeId, patientId, nutritionistId)).thenReturn(Optional.of(activeEpisode));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> biometryService.getHistorySnapshot(nutritionistId, patientId, episodeId));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
    }

    @Test
    void getHistorySnapshot_failsForNonexistentEpisode() {
        UUID randomId = UUID.randomUUID();
        when(patientRepository.findByIdAndNutritionistId(patientId, nutritionistId)).thenReturn(Optional.of(patient));
        when(episodeRepository.findByIdAndPatientIdAndNutritionistId(
                randomId, patientId, nutritionistId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> biometryService.getHistorySnapshot(nutritionistId, patientId, randomId));
    }
}
