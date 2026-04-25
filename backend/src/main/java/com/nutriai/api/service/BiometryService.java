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
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Optional;
import java.util.Map;
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
        patientRepository.findByIdAndNutritionistId(patientId, nutritionistId)
                .orElseThrow(() -> new ResourceNotFoundException("Paciente", patientId));

        Episode activeEpisode = episodeRepository.findFirstByPatientIdAndNutritionistIdAndEndDateIsNullOrderByStartDateDesc(patientId, nutritionistId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Paciente não possui episódio ativo"));

        BiometryAssessment assessment = BiometryAssessment.builder()
                .patientId(patientId)
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
                            .nutritionistId(nutritionistId)
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
                            .nutritionistId(nutritionistId)
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

        return toResponse(saved, nutritionistId);
    }

    @Transactional
    public BiometryAssessmentResponse updateAssessment(UUID nutritionistId, UUID patientId, UUID assessmentId, UpdateBiometryAssessmentRequest request) {
        BiometryAssessment assessment = assessmentRepository.findByIdAndPatientIdAndNutritionistId(
                        assessmentId, patientId, nutritionistId)
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
            List<BiometrySkinfold> mergedSkinfolds = mergeSkinfolds(assessment, nutritionistId, request.skinfolds());
            assessment.getSkinfolds().clear();
            assessment.getSkinfolds().addAll(mergedSkinfolds);
        }

        if (request.perimetry() != null) {
            List<BiometryPerimetry> mergedPerimetries = mergePerimetries(assessment, nutritionistId, request.perimetry());
            assessment.getPerimetries().clear();
            assessment.getPerimetries().addAll(mergedPerimetries);
        }

        BiometryAssessment updated = assessmentRepository.save(assessment);
        logger.info("Biometry assessment updated: id={}, nutritionistId={}", updated.getId(), nutritionistId);

        emitHistoryEvent(updated.getEpisodeId(), nutritionistId, "EPISODE_BIOMETRY_UPDATED",
                "Avaliação biométrica atualizada", "BiometryAssessment", updated.getId());

        return toResponse(updated, nutritionistId);
    }

    @Transactional(readOnly = true)
    public List<BiometryAssessmentResponse> listAssessments(UUID nutritionistId, UUID patientId) {
        patientRepository.findByIdAndNutritionistId(patientId, nutritionistId)
                .orElseThrow(() -> new ResourceNotFoundException("Paciente", patientId));

        Episode activeEpisode = episodeRepository.findFirstByPatientIdAndNutritionistIdAndEndDateIsNullOrderByStartDateDesc(patientId, nutritionistId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Paciente não possui episódio ativo"));

        List<BiometryAssessment> assessments = assessmentRepository.findByEpisodeIdAndPatientIdAndNutritionistIdOrderByAssessmentDateAsc(
                activeEpisode.getId(), patientId, nutritionistId);
        return assessments.stream()
                .map(assessment -> toResponse(assessment, nutritionistId))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<BiometryHistoryEpisodeResponse> listHistoryEpisodes(UUID nutritionistId, UUID patientId) {
        patientRepository.findByIdAndNutritionistId(patientId, nutritionistId)
                .orElseThrow(() -> new ResourceNotFoundException("Paciente", patientId));

        List<Episode> closedEpisodes = episodeRepository
                .findByPatientIdAndNutritionistIdAndEndDateIsNotNullOrderByStartDateDesc(patientId, nutritionistId);

        List<UUID> episodeIds = closedEpisodes.stream().map(Episode::getId).toList();
        List<BiometryAssessment> allAssessments = episodeIds.isEmpty()
                ? List.of()
                : assessmentRepository.findByEpisodeIdInAndPatientIdAndNutritionistIdOrderByAssessmentDateAsc(
                        episodeIds, patientId, nutritionistId);

        return closedEpisodes.stream().map(episode -> {
            long assessmentCount = allAssessments.stream()
                    .filter(a -> episode.getId().equals(a.getEpisodeId()))
                    .count();
            int durationDays = (int) ChronoUnit.DAYS.between(
                    episode.getStartDate().toLocalDate(),
                    episode.getEndDate().toLocalDate());
            return new BiometryHistoryEpisodeResponse(
                    episode.getId(),
                    episode.getStartDate(),
                    episode.getEndDate(),
                    assessmentCount > 0,
                    (int) assessmentCount,
                    durationDays
            );
        }).toList();
    }

    @Transactional(readOnly = true)
    public BiometryHistorySnapshotResponse getHistorySnapshot(UUID nutritionistId, UUID patientId, UUID episodeId) {
        Patient patient = patientRepository.findByIdAndNutritionistId(patientId, nutritionistId)
                .orElseThrow(() -> new ResourceNotFoundException("Paciente", patientId));

        Episode episode = episodeRepository.findByIdAndPatientIdAndNutritionistId(
                        episodeId, patientId, nutritionistId)
                .orElseThrow(() -> new ResourceNotFoundException("Episódio", episodeId));

        if (episode.getEndDate() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Episódio ativo não possui histórico");
        }

        List<BiometryAssessment> assessments = assessmentRepository
                .findByEpisodeIdAndPatientIdAndNutritionistIdOrderByAssessmentDateAsc(episodeId, patientId, nutritionistId);
        List<EpisodeHistoryEvent> timelineEvents = historyEventRepository
                .findByEpisodeIdAndNutritionistIdOrderByEventAtAsc(episodeId, nutritionistId);

        MealPlan plan = mealPlanRepository.findByEpisodeIdAndNutritionistId(episodeId, nutritionistId).orElse(null);
        int mealSlotCount = 0;
        int foodItemCount = 0;
        if (plan != null) {
            List<MealSlot> slots = mealSlotRepository.findByPlanIdAndNutritionistIdOrderBySortOrder(plan.getId(), nutritionistId);
            mealSlotCount = slots.size();
            List<MealOption> options = mealOptionRepository.findByPlanIdAndNutritionistIdOrderByMealSlotIdAndSortOrder(plan.getId(), nutritionistId);
            foodItemCount = options.size();
        }

        List<BiometryAssessmentResponse> assessmentResponses = assessments.stream()
                .map(assessment -> toResponse(assessment, nutritionistId)).toList();
        List<EpisodeHistoryEventResponse> eventResponses = timelineEvents.stream()
                .map(e -> new EpisodeHistoryEventResponse(e.getId(), e.getEventType(), e.getEventAt(),
                        e.getTitle(), e.getDescription(), e.getSourceRef())).toList();

        return new BiometryHistorySnapshotResponse(
                episodeId, episode.getStartDate(), episode.getEndDate(),
                patient.getObjective() != null ? patient.getObjective().getPortugueseLabel() : null,
                mealSlotCount, foodItemCount, assessmentResponses, eventResponses);
    }

    private BiometryAssessmentResponse toResponse(BiometryAssessment assessment, UUID nutritionistId) {
        List<BiometrySkinfold> skinfolds = Optional.ofNullable(
                skinfoldRepository.findByAssessmentIdAndNutritionistIdOrderBySortOrder(assessment.getId(), nutritionistId))
                .orElse(List.of());
        List<BiometryPerimetry> perimetries = Optional.ofNullable(
                perimetryRepository.findByAssessmentIdAndNutritionistIdOrderBySortOrder(assessment.getId(), nutritionistId))
                .orElse(List.of());
        return BiometryAssessmentResponse.from(assessment, skinfolds, perimetries);
    }

    private List<BiometrySkinfold> mergeSkinfolds(BiometryAssessment assessment, UUID nutritionistId,
                                                  List<UpdateBiometryAssessmentRequest.SkinfoldEntry> entries) {
        Map<UUID, BiometrySkinfold> existingById = new HashMap<>();
        for (BiometrySkinfold skinfold : assessment.getSkinfolds()) {
            if (skinfold.getId() != null) {
                existingById.put(skinfold.getId(), skinfold);
            }
        }

        List<BiometrySkinfold> merged = new ArrayList<>(entries.size());
        for (UpdateBiometryAssessmentRequest.SkinfoldEntry entry : entries) {
            BiometrySkinfold skinfold;
            if (entry.id() != null) {
                skinfold = existingById.get(entry.id());
                if (skinfold == null) {
                    throw new ResourceNotFoundException("Dobra cutânea", entry.id());
                }
            } else {
                skinfold = BiometrySkinfold.builder()
                        .assessment(assessment)
                        .nutritionistId(nutritionistId)
                        .build();
            }
            skinfold.setAssessment(assessment);
            skinfold.setNutritionistId(nutritionistId);
            skinfold.setMeasureKey(entry.measureKey());
            skinfold.setValueMm(entry.valueMm());
            skinfold.setSortOrder(entry.sortOrder());
            merged.add(skinfold);
        }
        return merged;
    }

    private List<BiometryPerimetry> mergePerimetries(BiometryAssessment assessment, UUID nutritionistId,
                                                     List<UpdateBiometryAssessmentRequest.PerimetryEntry> entries) {
        Map<UUID, BiometryPerimetry> existingById = new HashMap<>();
        for (BiometryPerimetry perimetry : assessment.getPerimetries()) {
            if (perimetry.getId() != null) {
                existingById.put(perimetry.getId(), perimetry);
            }
        }

        List<BiometryPerimetry> merged = new ArrayList<>(entries.size());
        for (UpdateBiometryAssessmentRequest.PerimetryEntry entry : entries) {
            BiometryPerimetry perimetry;
            if (entry.id() != null) {
                perimetry = existingById.get(entry.id());
                if (perimetry == null) {
                    throw new ResourceNotFoundException("Perimetria", entry.id());
                }
            } else {
                perimetry = BiometryPerimetry.builder()
                        .assessment(assessment)
                        .nutritionistId(nutritionistId)
                        .build();
            }
            perimetry.setAssessment(assessment);
            perimetry.setNutritionistId(nutritionistId);
            perimetry.setMeasureKey(entry.measureKey());
            perimetry.setValueCm(entry.valueCm());
            perimetry.setSortOrder(entry.sortOrder());
            merged.add(perimetry);
        }
        return merged;
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
