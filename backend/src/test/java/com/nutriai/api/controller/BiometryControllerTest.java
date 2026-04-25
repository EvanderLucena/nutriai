package com.nutriai.api.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nutriai.api.auth.AuthService;
import com.nutriai.api.auth.JwtService;
import com.nutriai.api.auth.RefreshTokenRepository;
import com.nutriai.api.auth.dto.LoginRequest;
import com.nutriai.api.auth.dto.SignupRequest;

import java.util.UUID;
import com.nutriai.api.dto.biometry.CreateBiometryAssessmentRequest;
import com.nutriai.api.dto.biometry.UpdateBiometryAssessmentRequest;
import com.nutriai.api.model.*;
import com.nutriai.api.repository.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class BiometryControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private AuthService authService;
    @Autowired private BiometryAssessmentRepository assessmentRepository;
    @Autowired private BiometrySkinfoldRepository skinfoldRepository;
    @Autowired private BiometryPerimetryRepository perimetryRepository;
    @Autowired private PatientRepository patientRepository;
    @Autowired private EpisodeRepository episodeRepository;
    @Autowired private RefreshTokenRepository refreshTokenRepository;
    @Autowired private NutritionistRepository nutritionistRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private JwtService jwtService;

    private String accessToken;
    private UUID nutritionistId;
    private UUID patientId;
    private UUID episodeId;

    @BeforeEach
    void setUp() {
        skinfoldRepository.deleteAll();
        perimetryRepository.deleteAll();
        assessmentRepository.deleteAll();
        episodeRepository.deleteAll();
        patientRepository.deleteAll();
        refreshTokenRepository.deleteAll();
        nutritionistRepository.deleteAll();

        SignupRequest signupReq = new SignupRequest("Dr. Test", "nutri@test.com", "senha12345", "12345", "SP", "Nutrição", null, true);
        var result = authService.signup(signupReq);
        accessToken = result.accessToken();
        nutritionistId = nutritionistRepository.findByEmail("nutri@test.com").orElseThrow().getId();

        Patient patient = Patient.builder()
                .nutritionistId(nutritionistId)
                .name("Maria Silva")
                .objective(PatientObjective.EMAGRECIMENTO)
                .weight(new BigDecimal("75.00"))
                .build();
        patient = patientRepository.save(patient);
        patientId = patient.getId();

        Episode episode = Episode.builder().patientId(patientId).build();
        episode = episodeRepository.save(episode);
        episodeId = episode.getId();
    }

    @Test
    void createAssessment_returns200WithEnvelope() throws Exception {
        CreateBiometryAssessmentRequest req = new CreateBiometryAssessmentRequest(
                LocalDate.of(2025, 1, 10), new BigDecimal("75.00"), new BigDecimal("22.50"),
                null, null, null, null, null, null, null, null);

        mockMvc.perform(post("/api/v1/patients/{patientId}/biometry", patientId)
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.assessmentDate").value("2025-01-10"))
                .andExpect(jsonPath("$.data.weight").value(75.00))
                .andExpect(jsonPath("$.data.bodyFatPercent").value(22.50));
    }

    @Test
    void createAssessment_withMissingRequiredFields_returns400() throws Exception {
        String body = """
                {"assessmentDate": "2025-01-10"}
                """;

        mockMvc.perform(post("/api/v1/patients/{patientId}/biometry", patientId)
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }

    @Test
    void updateAssessment_returnsUpdatedResponse() throws Exception {
        BiometryAssessment assessment = BiometryAssessment.builder()
                .episodeId(episodeId)
                .nutritionistId(nutritionistId)
                .assessmentDate(LocalDate.of(2025, 1, 10))
                .weight(new BigDecimal("75.00"))
                .bodyFatPercent(new BigDecimal("22.50"))
                .build();
        assessment = assessmentRepository.save(assessment);

        UpdateBiometryAssessmentRequest req = new UpdateBiometryAssessmentRequest(
                null, new BigDecimal("74.00"), null, null, null, null, null, null, null, null, null);

        mockMvc.perform(patch("/api/v1/patients/{patientId}/biometry/{assessmentId}", patientId, assessment.getId())
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.weight").value(74.00));
    }

    @Test
    void listAssessments_returnsListForActiveEpisode() throws Exception {
        BiometryAssessment a1 = BiometryAssessment.builder()
                .episodeId(episodeId).nutritionistId(nutritionistId)
                .assessmentDate(LocalDate.of(2025, 1, 10))
                .weight(new BigDecimal("75.00")).bodyFatPercent(new BigDecimal("22.50")).build();
        BiometryAssessment a2 = BiometryAssessment.builder()
                .episodeId(episodeId).nutritionistId(nutritionistId)
                .assessmentDate(LocalDate.of(2025, 1, 20))
                .weight(new BigDecimal("74.00")).bodyFatPercent(new BigDecimal("21.80")).build();
        assessmentRepository.save(a1);
        assessmentRepository.save(a2);

        mockMvc.perform(get("/api/v1/patients/{patientId}/biometry", patientId)
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(2));
    }

    @Test
    void crossNutritionistAccess_returns404() throws Exception {
        SignupRequest otherSignup = new SignupRequest("Dr. Other", "other@test.com", "senha12345", "54321", "RJ", "Nutrição", null, true);
        authService.signup(otherSignup);
        String otherToken = authService.login(new LoginRequest("other@test.com", "senha12345")).accessToken();

        mockMvc.perform(get("/api/v1/patients/{patientId}/biometry", patientId)
                        .header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isNotFound());
    }

    @Test
    void noActiveEpisode_returns400() throws Exception {
        Episode episode = episodeRepository.findById(episodeId).orElseThrow();
        episode.close();
        episodeRepository.save(episode);

        CreateBiometryAssessmentRequest req = new CreateBiometryAssessmentRequest(
                LocalDate.of(2025, 1, 10), new BigDecimal("75.00"), new BigDecimal("22.50"),
                null, null, null, null, null, null, null, null);

        mockMvc.perform(post("/api/v1/patients/{patientId}/biometry", patientId)
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }
}