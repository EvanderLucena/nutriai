package com.nutriai.api.service;

import com.nutriai.api.dto.dashboard.DashboardResponse;
import com.nutriai.api.model.BiometryAssessment;
import com.nutriai.api.model.Episode;
import com.nutriai.api.model.Patient;
import com.nutriai.api.model.PatientStatus;
import com.nutriai.api.repository.BiometryAssessmentRepository;
import com.nutriai.api.repository.EpisodeRepository;
import com.nutriai.api.repository.PatientRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@Service
public class DashboardService {

    private final PatientRepository patientRepository;
    private final EpisodeRepository episodeRepository;
    private final BiometryAssessmentRepository assessmentRepository;

    public DashboardService(PatientRepository patientRepository,
                            EpisodeRepository episodeRepository,
                            BiometryAssessmentRepository assessmentRepository) {
        this.patientRepository = patientRepository;
        this.episodeRepository = episodeRepository;
        this.assessmentRepository = assessmentRepository;
    }

    @Transactional(readOnly = true)
    public DashboardResponse getDashboard(UUID nutritionistId) {
        Page<Patient> allPatientsPage = patientRepository.findByNutritionistId(nutritionistId, Pageable.unpaged());
        List<Patient> allPatients = allPatientsPage.getContent();

        long activePatients = allPatients.stream().filter(p -> Boolean.TRUE.equals(p.getActive())).count();
        long attentionPatients = allPatients.stream().filter(p -> Boolean.TRUE.equals(p.getActive()) && p.getStatus() == PatientStatus.WARNING).count();
        long criticalPatients = allPatients.stream().filter(p -> Boolean.TRUE.equals(p.getActive()) && p.getStatus() == PatientStatus.DANGER).count();

        Double averageAdherence = allPatients.stream()
                .filter(p -> Boolean.TRUE.equals(p.getActive()) && p.getAdherence() != null)
                .mapToInt(Patient::getAdherence)
                .average()
                .stream().boxed().findFirst().orElse(null);

        LocalDate thirtyDaysAgo = LocalDate.now().minusDays(30);
        int assessedInLast30Days = 0;
        int pendingAssessmentCount = 0;

        List<DashboardResponse.RecentEvaluation> recentEvals = new ArrayList<>();

        for (Patient patient : allPatients) {
            if (!Boolean.TRUE.equals(patient.getActive())) continue;

            Optional<Episode> activeEpisode = episodeRepository
                    .findTopByPatientIdAndEndDateIsNullOrderByStartDateDesc(patient.getId());

            if (activeEpisode.isEmpty()) {
                pendingAssessmentCount++;
                continue;
            }

            List<BiometryAssessment> assessments = assessmentRepository
                    .findByEpisodeIdOrderByAssessmentDateDesc(activeEpisode.get().getId());

            if (!assessments.isEmpty()) {
                BiometryAssessment latest = assessments.get(0);
                boolean hasRecent = !latest.getAssessmentDate().isBefore(thirtyDaysAgo);
                if (hasRecent) {
                    assessedInLast30Days++;
                } else {
                    pendingAssessmentCount++;
                }
                recentEvals.add(new DashboardResponse.RecentEvaluation(
                        patient.getId(),
                        patient.getName(),
                        patient.getInitials(),
                        patient.getStatus().name(),
                        latest.getAssessmentDate(),
                        latest.getWeight(),
                        latest.getBodyFatPercent()
                ));
            } else {
                pendingAssessmentCount++;
            }
        }

        recentEvals.sort(Comparator.comparing(DashboardResponse.RecentEvaluation::assessmentDate).reversed());
        if (recentEvals.size() > 5) {
            recentEvals = recentEvals.subList(0, 5);
        }

        DashboardResponse.Kpis kpis = new DashboardResponse.Kpis(
                activePatients, attentionPatients, criticalPatients, averageAdherence,
                assessedInLast30Days, pendingAssessmentCount);

        return new DashboardResponse(kpis, recentEvals);
    }
}