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
        patient = Patient.builder().id(patientId).nutritionistId(nutritionistId).name("Maria").build();
        activeEpisode = Episode.builder().id(episodeId).patientId(patientId).build();
    }

    @Test
    void createAssessment_succeedsWithRequiredFieldsOnly() {
        when(patientRepository.findByIdAndNutritionistId(patientId, nutritionistId)).thenReturn(Optional.of(patient));
        when(episodeRepository.findTopByPatientIdAndEndDateIsNullOrderByStartDateDesc(patientId)).thenReturn(Optional.of(activeEpisode));
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
        verify(historyEventRepository).save(argThat(e ->
                e.getEventType().equals("EPISODE_BIOMETRY_CREATED") && e.getEventAt() != null));
    }

    @Test
    void createAssessment_succeedsWithAllOptionalFields() {
        when(patientRepository.findByIdAndNutritionistId(patientId, nutritionistId)).thenReturn(Optional.of(patient));
        when(episodeRepository.findTopByPatientIdAndEndDateIsNullOrderByStartDateDesc(patientId)).thenReturn(Optional.of(activeEpisode));
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
    }

    @Test
    void createAssessment_failsWhenNoActiveEpisode() {
        when(patientRepository.findByIdAndNutritionistId(patientId, nutritionistId)).thenReturn(Optional.of(patient));
        when(episodeRepository.findTopByPatientIdAndEndDateIsNullOrderByStartDateDesc(patientId)).thenReturn(Optional.empty());

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
                .nutritionistId(nutritionistId)
                .assessmentDate(LocalDate.of(2025, 1, 10))
                .weight(new BigDecimal("75.00"))
                .bodyFatPercent(new BigDecimal("22.50"))
                .build();
        existing.setSkinfolds(List.of());
        existing.setPerimetries(List.of());

        when(assessmentRepository.findByIdAndNutritionistId(existing.getId(), nutritionistId)).thenReturn(Optional.of(existing));
        when(episodeRepository.findByIdAndPatientId(episodeId, patientId)).thenReturn(Optional.of(activeEpisode));
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
    void createAndUpdate_emitHistoryEvents() {
        when(patientRepository.findByIdAndNutritionistId(patientId, nutritionistId)).thenReturn(Optional.of(patient));
        when(episodeRepository.findTopByPatientIdAndEndDateIsNullOrderByStartDateDesc(patientId)).thenReturn(Optional.of(activeEpisode));
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
    void updateAssessment_failsWhenNotOwnedByNutritionist() {
        UUID assessmentId = UUID.randomUUID();
        when(assessmentRepository.findByIdAndNutritionistId(assessmentId, nutritionistId)).thenReturn(Optional.empty());

        UpdateBiometryAssessmentRequest req = new UpdateBiometryAssessmentRequest(null, null, null, null, null, null, null, null, null, null, null);

        assertThrows(ResourceNotFoundException.class,
                () -> biometryService.updateAssessment(nutritionistId, patientId, assessmentId, req));
    }

    @Test
    void updateAssessment_failsWhenRoutePatientDoesNotOwnAssessmentEpisode() {
        UUID assessmentId = UUID.randomUUID();
        BiometryAssessment existing = BiometryAssessment.builder()
                .id(assessmentId)
                .episodeId(episodeId)
                .nutritionistId(nutritionistId)
                .assessmentDate(LocalDate.of(2025, 1, 10))
                .weight(new BigDecimal("75.00"))
                .bodyFatPercent(new BigDecimal("22.50"))
                .build();
        when(assessmentRepository.findByIdAndNutritionistId(assessmentId, nutritionistId)).thenReturn(Optional.of(existing));
        when(episodeRepository.findByIdAndPatientId(episodeId, patientId)).thenReturn(Optional.empty());

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
                .startDate(LocalDateTime.of(2025, 1, 1, 0, 0))
                .endDate(LocalDateTime.of(2025, 3, 1, 0, 0))
                .build();
        Episode activeEpisode = Episode.builder()
                .id(episodeId).patientId(patientId)
                .startDate(LocalDateTime.of(2025, 3, 1, 0, 0))
                .build();
        when(episodeRepository.findByPatientIdOrderByStartDateDesc(patientId)).thenReturn(List.of(closedEpisode, activeEpisode));
        when(assessmentRepository.findByEpisodeIdOrderByAssessmentDateDesc(closedEpisode.getId()))
                .thenReturn(List.of(BiometryAssessment.builder().id(UUID.randomUUID()).build()));

        List<BiometryHistoryEpisodeResponse> result = biometryService.listHistoryEpisodes(nutritionistId, patientId);

        assertEquals(1, result.size());
        assertEquals(closedEpisode.getId(), result.get(0).episodeId());
        assertTrue(result.get(0).hasBiometry());
        assertEquals(59, result.get(0).durationDays());
    }

    @Test
    void listHistoryEpisodes_returnsEmptyWhenNoClosedEpisodes() {
        when(patientRepository.findByIdAndNutritionistId(patientId, nutritionistId)).thenReturn(Optional.of(patient));
        when(episodeRepository.findByPatientIdOrderByStartDateDesc(patientId)).thenReturn(List.of(activeEpisode));

        List<BiometryHistoryEpisodeResponse> result = biometryService.listHistoryEpisodes(nutritionistId, patientId);

        assertTrue(result.isEmpty());
    }

    @Test
    void getHistorySnapshot_returnsAssessmentsAndTimeline() {
        UUID closedEpisodeId = UUID.randomUUID();
        Episode closedEpisode = Episode.builder()
                .id(closedEpisodeId).patientId(patientId)
                .startDate(LocalDateTime.of(2025, 1, 1, 0, 0))
                .endDate(LocalDateTime.of(2025, 3, 1, 0, 0))
                .build();

        when(patientRepository.findByIdAndNutritionistId(patientId, nutritionistId)).thenReturn(Optional.of(patient));
        when(episodeRepository.findByIdAndPatientId(closedEpisodeId, patientId)).thenReturn(Optional.of(closedEpisode));
        when(assessmentRepository.findByEpisodeIdAndNutritionistIdOrderByAssessmentDateAsc(closedEpisodeId, nutritionistId))
                .thenReturn(List.of());
        when(historyEventRepository.findByEpisodeIdAndNutritionistIdOrderByEventAtAsc(closedEpisodeId, nutritionistId))
                .thenReturn(List.of());
        when(mealPlanRepository.findByEpisodeIdAndNutritionistId(closedEpisodeId, nutritionistId)).thenReturn(Optional.empty());

        BiometryHistorySnapshotResponse result = biometryService.getHistorySnapshot(nutritionistId, patientId, closedEpisodeId);

        assertNotNull(result);
        assertEquals(closedEpisodeId, result.episodeId());
        assertEquals(0, result.assessments().size());
        assertEquals(0, result.timelineEvents().size());
        assertEquals(0, result.mealSlotCount());
    }

    @Test
    void getHistorySnapshot_failsWhenEpisodeBelongsToDifferentPatient() {
        UUID otherEpisodeId = UUID.randomUUID();

        when(patientRepository.findByIdAndNutritionistId(patientId, nutritionistId)).thenReturn(Optional.of(patient));
        when(episodeRepository.findByIdAndPatientId(otherEpisodeId, patientId)).thenReturn(Optional.empty());

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
        when(episodeRepository.findByIdAndPatientId(episodeId, patientId)).thenReturn(Optional.of(activeEpisode));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> biometryService.getHistorySnapshot(nutritionistId, patientId, episodeId));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
    }

    @Test
    void getHistorySnapshot_failsForNonexistentEpisode() {
        UUID randomId = UUID.randomUUID();
        when(patientRepository.findByIdAndNutritionistId(patientId, nutritionistId)).thenReturn(Optional.of(patient));
        when(episodeRepository.findByIdAndPatientId(randomId, patientId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> biometryService.getHistorySnapshot(nutritionistId, patientId, randomId));
    }
}
