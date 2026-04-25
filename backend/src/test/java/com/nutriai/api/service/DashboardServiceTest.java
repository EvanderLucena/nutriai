package com.nutriai.api.service;

import com.nutriai.api.dto.dashboard.DashboardResponse;
import com.nutriai.api.model.*;
import com.nutriai.api.repository.BiometryAssessmentRepository;
import com.nutriai.api.repository.EpisodeRepository;
import com.nutriai.api.repository.PatientRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DashboardServiceTest {

    @Mock private PatientRepository patientRepository;
    @Mock private EpisodeRepository episodeRepository;
    @Mock private BiometryAssessmentRepository assessmentRepository;

    @InjectMocks
    private DashboardService dashboardService;

    private UUID nutritionistId;

    @BeforeEach
    void setUp() {
        nutritionistId = UUID.randomUUID();
    }

    @Test
    void getDashboard_returnsCorrectKpiCounts() {
        Patient p1 = Patient.builder().id(UUID.randomUUID()).nutritionistId(nutritionistId).name("Maria")
                .status(PatientStatus.ONTRACK).adherence(90).active(true).build();
        Patient p2 = Patient.builder().id(UUID.randomUUID()).nutritionistId(nutritionistId).name("Jose")
                .status(PatientStatus.WARNING).adherence(60).active(true).build();
        Patient p3 = Patient.builder().id(UUID.randomUUID()).nutritionistId(nutritionistId).name("Ana")
                .status(PatientStatus.DANGER).adherence(30).active(true).build();
        Patient p4 = Patient.builder().id(UUID.randomUUID()).nutritionistId(nutritionistId).name("Inactive")
                .status(PatientStatus.ONTRACK).active(false).build();

        when(patientRepository.findByNutritionistId(eq(nutritionistId), any()))
                .thenReturn(new PageImpl<>(List.of(p1, p2, p3, p4)));
        when(episodeRepository.findTopByPatientIdAndEndDateIsNullOrderByStartDateDesc(any()))
                .thenReturn(Optional.empty());

        DashboardResponse response = dashboardService.getDashboard(nutritionistId);

        assertEquals(3, response.kpis().activePatients());
        assertEquals(1, response.kpis().attentionPatients());
        assertEquals(1, response.kpis().criticalPatients());
    }

    @Test
    void getDashboard_computesAverageAdherence() {
        Patient p1 = Patient.builder().id(UUID.randomUUID()).nutritionistId(nutritionistId).name("M")
                .status(PatientStatus.ONTRACK).adherence(80).active(true).build();
        Patient p2 = Patient.builder().id(UUID.randomUUID()).nutritionistId(nutritionistId).name("J")
                .status(PatientStatus.ONTRACK).adherence(100).active(true).build();

        when(patientRepository.findByNutritionistId(eq(nutritionistId), any()))
                .thenReturn(new PageImpl<>(List.of(p1, p2)));
        when(episodeRepository.findTopByPatientIdAndEndDateIsNullOrderByStartDateDesc(any()))
                .thenReturn(Optional.empty());

        DashboardResponse response = dashboardService.getDashboard(nutritionistId);

        assertEquals(90.0, response.kpis().averageAdherence());
    }

    @Test
    void getDashboard_handlesEmptyState() {
        when(patientRepository.findByNutritionistId(eq(nutritionistId), any()))
                .thenReturn(new PageImpl<>(List.of()));

        DashboardResponse response = dashboardService.getDashboard(nutritionistId);

        assertEquals(0, response.kpis().activePatients());
        assertEquals(0, response.kpis().attentionPatients());
        assertEquals(0, response.kpis().criticalPatients());
        assertNull(response.kpis().averageAdherence());
        assertTrue(response.recentEvaluations().isEmpty());
    }

    @Test
    void getDashboard_includesRecentEvaluations() {
        UUID patientId = UUID.randomUUID();
        UUID episodeId = UUID.randomUUID();
        Patient p1 = Patient.builder().id(patientId).nutritionistId(nutritionistId).name("Maria")
                .initials("M").status(PatientStatus.ONTRACK).adherence(90).active(true).build();
        Episode episode = Episode.builder().id(episodeId).patientId(patientId).build();
        BiometryAssessment assessment = BiometryAssessment.builder()
                .id(UUID.randomUUID()).episodeId(episodeId).nutritionistId(nutritionistId)
                .assessmentDate(LocalDate.now().minusDays(5))
                .weight(new BigDecimal("75.00")).bodyFatPercent(new BigDecimal("22.50")).build();

        when(patientRepository.findByNutritionistId(eq(nutritionistId), any()))
                .thenReturn(new PageImpl<>(List.of(p1)));
        when(episodeRepository.findTopByPatientIdAndEndDateIsNullOrderByStartDateDesc(patientId))
                .thenReturn(Optional.of(episode));
        when(assessmentRepository.findByEpisodeIdOrderByAssessmentDateDesc(episodeId))
                .thenReturn(List.of(assessment));

        DashboardResponse response = dashboardService.getDashboard(nutritionistId);

        assertEquals(1, response.recentEvaluations().size());
        assertEquals(patientId, response.recentEvaluations().get(0).patientId());
        assertEquals(1, response.kpis().assessedInLast30Days());
    }

    @Test
    void getDashboard_countsPendingAssessments() {
        UUID patientId = UUID.randomUUID();
        Patient p1 = Patient.builder().id(patientId).nutritionistId(nutritionistId).name("Maria")
                .status(PatientStatus.ONTRACK).active(true).build();

        when(patientRepository.findByNutritionistId(eq(nutritionistId), any()))
                .thenReturn(new PageImpl<>(List.of(p1)));
        when(episodeRepository.findTopByPatientIdAndEndDateIsNullOrderByStartDateDesc(patientId))
                .thenReturn(Optional.empty());

        DashboardResponse response = dashboardService.getDashboard(nutritionistId);

        assertEquals(1, response.kpis().pendingAssessmentCount());
    }
}