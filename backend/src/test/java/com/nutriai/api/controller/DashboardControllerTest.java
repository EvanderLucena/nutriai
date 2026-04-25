package com.nutriai.api.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nutriai.api.auth.AuthService;
import com.nutriai.api.auth.RefreshTokenRepository;
import com.nutriai.api.auth.dto.SignupRequest;
import com.nutriai.api.model.*;
import com.nutriai.api.repository.*;

import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class DashboardControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private AuthService authService;
    @Autowired private PatientRepository patientRepository;
    @Autowired private EpisodeRepository episodeRepository;
    @Autowired private BiometryAssessmentRepository assessmentRepository;
    @Autowired private BiometrySkinfoldRepository skinfoldRepository;
    @Autowired private RefreshTokenRepository refreshTokenRepository;
    @Autowired private NutritionistRepository nutritionistRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    private String accessToken;
    private UUID nutritionistId;

    @BeforeEach
    void setUp() {
        skinfoldRepository.deleteAll();
        assessmentRepository.deleteAll();
        episodeRepository.deleteAll();
        patientRepository.deleteAll();
        refreshTokenRepository.deleteAll();
        nutritionistRepository.deleteAll();

        SignupRequest signupReq = new SignupRequest("Dr. Dashboard", "dash@test.com", "senha12345", "12345", "SP", "Nutrição", null, true);
        var result = authService.signup(signupReq);
        accessToken = result.accessToken();
        nutritionistId = nutritionistRepository.findByEmail("dash@test.com").orElseThrow().getId();
    }

    @Test
    void getDashboard_returns200WithEnvelope() throws Exception {
        mockMvc.perform(get("/api/v1/dashboard")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.kpis.activePatients").value(0));
    }

    @Test
    void getDashboard_returnsPatientCounts() throws Exception {
        Patient p1 = Patient.builder().nutritionistId(nutritionistId).name("Maria")
                .objective(PatientObjective.EMAGRECIMENTO).status(PatientStatus.ONTRACK).active(true).build();
        Patient p2 = Patient.builder().nutritionistId(nutritionistId).name("Jose")
                .objective(PatientObjective.EMAGRECIMENTO).status(PatientStatus.WARNING).active(true).build();
        patientRepository.save(p1);
        patientRepository.save(p2);

        mockMvc.perform(get("/api/v1/dashboard")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.kpis.activePatients").value(2))
                .andExpect(jsonPath("$.data.kpis.attentionPatients").value(1));
    }

    @Test
    void getDashboard_withoutAuth_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/dashboard"))
                .andExpect(status().isUnauthorized());
    }
}