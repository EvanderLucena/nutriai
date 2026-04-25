package com.nutriai.api.service;

import com.nutriai.api.dto.biometry.*;
import com.nutriai.api.exception.ResourceNotFoundException;
import com.nutriai.api.model.*;
import com.nutriai.api.repository.*;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
public class BiometryService {

    private static final Logger logger = LoggerFactory.getLogger(BiometryService.class);

    private final BiometryAssessmentRepository assessmentRepository;
    private final BiometrySkinfoldRepository skinfoldRepository;
    private final BiometryPerimetryRepository perimetryRepository;
    private final EpisodeHistoryEventRepository historyEventRepository;
    private final PatientRepository patientRepository;
    private final EpisodeRepository episodeRepository;
    private final MealPlanRepository mealPlanRepository;
    private final MealSlotRepository mealSlotRepository;
    private final MealOptionRepository mealOptionRepository;

    public BiometryService(BiometryAssessmentRepository assessmentRepository,
                           BiometrySkinfoldRepository skinfoldRepository,
                           BiometryPerimetryRepository perimetryRepository,
                           EpisodeHistoryEventRepository historyEventRepository,
                           PatientRepository patientRepository,
                           EpisodeRepository episodeRepository,
                           MealPlanRepository mealPlanRepository,
                           MealSlotRepository mealSlotRepository,
                           MealOptionRepository mealOptionRepository) {
        this.assessmentRepository = assessmentRepository;
        this.skinfoldRepository = skinfoldRepository;
        this.perimetryRepository = perimetryRepository;
        this.historyEventRepository = historyEventRepository;
        this.patientRepository = patientRepository;
        this.episodeRepository = episodeRepository;
        this.mealPlanRepository = mealPlanRepository;
        this.mealSlotRepository = mealSlotRepository;
        this.mealOptionRepository = mealOptionRepository;
    }

    @Transactional
    public BiometryAssessmentResponse createAssessment(UUID nutritionistId, UUID patientId, CreateBiometryAssessmentRequest request) {
        Patient patient = patientRepository.findByIdAndNutritionistId(patientId, nutritionistId)
                .orElseThrow(() -> new ResourceNotFoundException("Paciente", patientId));

        Episode activeEpisode = episodeRepository.findTopByPatientIdAndNutritionistIdAndEndDateIsNullOrderByStartDateDesc(patientId, nutritionistId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Paciente não possui episódio ativo"));

        BiometryAssessment assessment = BiometryAssessment.builder()
                .episodeId(activeEpisode.getId())
                .nutritionistId(nutritionistId)
                .assessmentDate(request.assessmentDate())
                .weight(request.weight())
                .bodyFatPercent(request.bodyFatPercent())
                .leanMassKg(request.leanMassKg())
                .waterPercent(request.waterPercent())
                .visceralFatLevel(request.visceralFatLevel())
                .bmrKcal(request.bmrKcal())
                .device(request.device())
                .notes(request.notes())
                .build();

        if (request.skinfolds() != null && !request.skinfolds().isEmpty()) {
            List<BiometrySkinfold> skinfolds = request.skinfolds().stream()
                    .map(s -> BiometrySkinfold.builder()
                            .assessment(assessment)
                            .measureKey(s.measureKey())
                            .valueMm(s.valueMm())
                            .sortOrder(s.sortOrder())
                            .build())
                    .toList();
            assessment.setSkinfolds(skinfolds);
        }

        if (request.perimetry() != null && !request.perimetry().isEmpty()) {
            List<BiometryPerimetry> perimetries = request.perimetry().stream()
                    .map(p -> BiometryPerimetry.builder()
                            .assessment(assessment)
                            .measureKey(p.measureKey())
                            .valueCm(p.valueCm())
                            .sortOrder(p.sortOrder())
                            .build())
                    .toList();
            assessment.setPerimetries(perimetries);
        }

        BiometryAssessment saved = assessmentRepository.save(assessment);
        logger.info("Biometry assessment created: id={}, episodeId={}, nutritionistId={}", saved.getId(), activeEpisode.getId(), nutritionistId);

        emitHistoryEvent(activeEpisode.getId(), nutritionistId, "EPISODE_BIOMETRY_CREATED",
                "Avaliação biométrica criada", "BiometryAssessment", saved.getId());

        return BiometryAssessmentResponse.from(saved);
    }

    @Transactional
    public BiometryAssessmentResponse updateAssessment(UUID nutritionistId, UUID patientId, UUID assessmentId, UpdateBiometryAssessmentRequest request) {
        BiometryAssessment assessment = assessmentRepository.findByIdAndNutritionistId(assessmentId, nutritionistId)
                .orElseThrow(() -> new ResourceNotFoundException("Avaliação biométrica", assessmentId));
        episodeRepository.findByIdAndPatientId(assessment.getEpisodeId(), patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Avaliação biométrica", assessmentId));

        if (request.assessmentDate() != null) assessment.setAssessmentDate(request.assessmentDate());
        if (request.weight() != null) assessment.setWeight(request.weight());
        if (request.bodyFatPercent() != null) assessment.setBodyFatPercent(request.bodyFatPercent());
        if (request.leanMassKg() != null) assessment.setLeanMassKg(request.leanMassKg());
        if (request.waterPercent() != null) assessment.setWaterPercent(request.waterPercent());
        if (request.visceralFatLevel() != null) assessment.setVisceralFatLevel(request.visceralFatLevel());
        if (request.bmrKcal() != null) assessment.setBmrKcal(request.bmrKcal());
        if (request.device() != null) assessment.setDevice(request.device());
        if (request.notes() != null) assessment.setNotes(request.notes());

        if (request.skinfolds() != null) {
            skinfoldRepository.deleteAllByAssessmentId(assessmentId);
            assessment.getSkinfolds().clear();
            List<BiometrySkinfold> newSkinfolds = request.skinfolds().stream()
                    .map(s -> BiometrySkinfold.builder()
                            .assessment(assessment)
                            .measureKey(s.measureKey())
                            .valueMm(s.valueMm())
                            .sortOrder(s.sortOrder())
                            .build())
                    .toList();
            assessment.getSkinfolds().addAll(newSkinfolds);
        }

        if (request.perimetry() != null) {
            perimetryRepository.deleteAllByAssessmentId(assessmentId);
            assessment.getPerimetries().clear();
            List<BiometryPerimetry> newPerimetries = request.perimetry().stream()
                    .map(p -> BiometryPerimetry.builder()
                            .assessment(assessment)
                            .measureKey(p.measureKey())
                            .valueCm(p.valueCm())
                            .sortOrder(p.sortOrder())
                            .build())
                    .toList();
            assessment.getPerimetries().addAll(newPerimetries);
        }

        BiometryAssessment updated = assessmentRepository.save(assessment);
        logger.info("Biometry assessment updated: id={}, nutritionistId={}", updated.getId(), nutritionistId);

        emitHistoryEvent(updated.getEpisodeId(), nutritionistId, "EPISODE_BIOMETRY_UPDATED",
                "Avaliação biométrica atualizada", "BiometryAssessment", updated.getId());

        return BiometryAssessmentResponse.from(updated);
    }

    @Transactional(readOnly = true)
    public List<BiometryAssessmentResponse> listAssessments(UUID nutritionistId, UUID patientId) {
        patientRepository.findByIdAndNutritionistId(patientId, nutritionistId)
                .orElseThrow(() -> new ResourceNotFoundException("Paciente", patientId));

        Episode activeEpisode = episodeRepository.findTopByPatientIdAndNutritionistIdAndEndDateIsNullOrderByStartDateDesc(patientId, nutritionistId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Paciente não possui episódio ativo"));

        List<BiometryAssessment> assessments = assessmentRepository.findByEpisodeIdAndNutritionistIdOrderByAssessmentDateAsc(activeEpisode.getId(), nutritionistId);
        return assessments.stream()
                .map(BiometryAssessmentResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<BiometryHistoryEpisodeResponse> listHistoryEpisodes(UUID nutritionistId, UUID patientId) {
        patientRepository.findByIdAndNutritionistId(patientId, nutritionistId)
                .orElseThrow(() -> new ResourceNotFoundException("Paciente", patientId));

        List<Episode> closedEpisodes = episodeRepository.findByPatientIdAndNutritionistIdOrderByStartDateDesc(patientId, nutritionistId).stream()
                .filter(e -> e.getEndDate() != null)
                .toList();

        return closedEpisodes.stream().map(episode -> {
            List<BiometryAssessment> assessments = assessmentRepository.findByEpisodeIdAndNutritionistIdOrderByAssessmentDateAsc(episode.getId(), nutritionistId);
            int durationDays = (int) ChronoUnit.DAYS.between(
                    episode.getStartDate().toLocalDate(),
                    episode.getEndDate().toLocalDate());
            return new BiometryHistoryEpisodeResponse(
                    episode.getId(),
                    episode.getStartDate(),
                    episode.getEndDate(),
                    !assessments.isEmpty(),
                    assessments.size(),
                    durationDays
            );
        }).toList();
    }

    @Transactional(readOnly = true)
    public BiometryHistorySnapshotResponse getHistorySnapshot(UUID nutritionistId, UUID patientId, UUID episodeId) {
        patientRepository.findByIdAndNutritionistId(patientId, nutritionistId)
                .orElseThrow(() -> new ResourceNotFoundException("Paciente", patientId));

        Episode episode = episodeRepository.findByIdAndPatientId(episodeId, patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Episódio", episodeId));

        if (episode.getEndDate() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Episódio ativo não possui histórico");
        }

        List<BiometryAssessment> assessments = assessmentRepository
                .findByEpisodeIdAndNutritionistIdOrderByAssessmentDateAsc(episodeId, nutritionistId);
        List<EpisodeHistoryEvent> timelineEvents = historyEventRepository
                .findByEpisodeIdAndNutritionistIdOrderByEventAtAsc(episodeId, nutritionistId);

        MealPlan plan = mealPlanRepository.findByEpisodeIdAndNutritionistId(episodeId, nutritionistId).orElse(null);
        int mealSlotCount = 0;
        int foodItemCount = 0;
        if (plan != null) {
            List<MealSlot> slots = mealSlotRepository.findByPlanIdOrderBySortOrder(plan.getId());
            mealSlotCount = slots.size();
            List<UUID> slotIds = slots.stream().map(MealSlot::getId).toList();
            List<MealOption> options = slotIds.isEmpty() ? List.of() : mealOptionRepository.findAllByMealSlotIds(slotIds);
            foodItemCount = options.size();
        }

        List<BiometryAssessmentResponse> assessmentResponses = assessments.stream()
                .map(BiometryAssessmentResponse::from).toList();
        List<EpisodeHistoryEventResponse> eventResponses = timelineEvents.stream()
                .map(e -> new EpisodeHistoryEventResponse(e.getId(), e.getEventType(), e.getEventAt(),
                        e.getTitle(), e.getDescription(), e.getSourceRef())).toList();

        return new BiometryHistorySnapshotResponse(
                episodeId, episode.getStartDate(), episode.getEndDate(), null,
                mealSlotCount, foodItemCount, assessmentResponses, eventResponses);
    }

    private void emitHistoryEvent(UUID episodeId, UUID nutritionistId, String eventType, String title, String sourceRef, UUID sourceId) {
        EpisodeHistoryEvent event = EpisodeHistoryEvent.builder()
                .episodeId(episodeId)
                .nutritionistId(nutritionistId)
                .eventType(eventType)
                .eventAt(LocalDateTime.now())
                .title(title)
                .sourceRef(sourceRef + ":" + sourceId)
                .build();
        historyEventRepository.save(event);
    }
}
