package com.nutriai.api.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nutriai.api.auth.AuthService;
import com.nutriai.api.auth.RefreshTokenRepository;
import com.nutriai.api.auth.dto.SignupRequest;
import com.nutriai.api.dto.food.CreateFoodRequest;
import com.nutriai.api.dto.food.FoodPortionDto;
import com.nutriai.api.dto.food.UpdateFoodRequest;
import com.nutriai.api.repository.FoodPortionRepository;
import com.nutriai.api.repository.FoodRepository;
import com.nutriai.api.repository.NutritionistRepository;
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
import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class FoodControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private AuthService authService;

    @Autowired
    private FoodRepository foodRepository;

    @Autowired
    private FoodPortionRepository foodPortionRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private NutritionistRepository nutritionistRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private String accessToken;

    @BeforeEach
    void setUp() {
        foodPortionRepository.deleteAll();
        foodRepository.deleteAll();
        refreshTokenRepository.deleteAll();
        nutritionistRepository.deleteAll();

        SignupRequest signupReq = new SignupRequest("Dr. Food", "food@test.com", "senha12345", "12345", "SP", "Nutrição", null, true);
        var result = authService.signup(signupReq);
        accessToken = result.accessToken();
    }

    @Test
    void createFood_returns201WithFoodResponse() throws Exception {
        CreateFoodRequest req = new CreateFoodRequest(
                "BASE", "Arroz branco", "Cereais",
                new BigDecimal("130.0"), new BigDecimal("2.7"), new BigDecimal("28.0"),
                new BigDecimal("0.3"), new BigDecimal("0.4"),
                null, null, null, null, null, null,
                List.of(new FoodPortionDto(null, "1 colher", new BigDecimal("15")))
        );

        mockMvc.perform(post("/api/v1/foods")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("Arroz branco"))
                .andExpect(jsonPath("$.data.type").value("BASE"))
                .andExpect(jsonPath("$.data.per100Kcal").value(130.0))
                .andExpect(jsonPath("$.data.portions").isArray());
    }

    @Test
    void createFood_presetType_returns201WithPresetFields() throws Exception {
        CreateFoodRequest req = new CreateFoodRequest(
                "PRESET", "Pão integral", "Pães",
                null, null, null, null, null,
                new BigDecimal("30.0"), new BigDecimal("70.0"), new BigDecimal("2.5"),
                new BigDecimal("12.0"), new BigDecimal("1.0"), "1 fatia",
                null
        );

        mockMvc.perform(post("/api/v1/foods")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.type").value("PRESET"))
                .andExpect(jsonPath("$.data.presetGrams").value(30.0))
                .andExpect(jsonPath("$.data.portionLabel").value("1 fatia"));
    }

    @Test
    void listFoods_returnsPaginatedList() throws Exception {
        CreateFoodRequest req1 = new CreateFoodRequest("BASE", "Arroz branco", "Cereais", null, null, null, null, null, null, null, null, null, null, null, null);
        CreateFoodRequest req2 = new CreateFoodRequest(
                "PRESET", "Pão integral", "Pães",
                null, null, null, null, null,
                new BigDecimal("30.0"), new BigDecimal("70.0"), new BigDecimal("2.5"),
                new BigDecimal("12.0"), new BigDecimal("1.0"), "1 fatia",
                null
        );

        mockMvc.perform(post("/api/v1/foods").header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(req1)));
        mockMvc.perform(post("/api/v1/foods").header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(req2)));

        mockMvc.perform(get("/api/v1/foods?page=0&size=12")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content").isArray())
                .andExpect(jsonPath("$.data.totalElements").value(2));
    }

    @Test
    void updateFood_returns200WithUpdatedFields() throws Exception {
        CreateFoodRequest createReq = new CreateFoodRequest("BASE", "Arroz branco", "Cereais", new BigDecimal("130"), null, null, null, null, null, null, null, null, null, null, null);
        String createResponse = mockMvc.perform(post("/api/v1/foods")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String foodId = objectMapper.readTree(createResponse).at("/data/id").asText();
        UpdateFoodRequest updateReq = new UpdateFoodRequest("Arroz integral", null, null, null, null, null, null, null, null, null, null, null, null, null);

        mockMvc.perform(patch("/api/v1/foods/" + foodId)
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Arroz integral"));
    }

    @Test
    void deleteFood_returns204() throws Exception {
        CreateFoodRequest createReq = new CreateFoodRequest("BASE", "Arroz branco", "Cereais", null, null, null, null, null, null, null, null, null, null, null, null);
        String createResponse = mockMvc.perform(post("/api/v1/foods")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String foodId = objectMapper.readTree(createResponse).at("/data/id").asText();

        mockMvc.perform(delete("/api/v1/foods/" + foodId)
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isNoContent());
    }

    @Test
    void getFood_returns404ForOtherNutritionist() throws Exception {
        SignupRequest otherNutriReq = new SignupRequest("Other Nutri", "otherfood@test.com", "senha12345", "54321", "RJ", null, null, true);
        var otherResult = authService.signup(otherNutriReq);

        CreateFoodRequest createReq = new CreateFoodRequest("BASE", "Arroz branco", "Cereais", null, null, null, null, null, null, null, null, null, null, null, null);
        String createResponse = mockMvc.perform(post("/api/v1/foods")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String foodId = objectMapper.readTree(createResponse).at("/data/id").asText();

        mockMvc.perform(get("/api/v1/foods/" + foodId)
                        .header("Authorization", "Bearer " + otherResult.accessToken()))
                .andExpect(status().isNotFound());
    }

    @Test
    void listFoods_withSearchFilter_returnsMatching() throws Exception {
        CreateFoodRequest req1 = new CreateFoodRequest("BASE", "Arroz branco", "Cereais", null, null, null, null, null, null, null, null, null, null, null, null);
        CreateFoodRequest req2 = new CreateFoodRequest(
                "PRESET", "Feijão preto", "Leguminosas",
                null, null, null, null, null,
                new BigDecimal("50"), new BigDecimal("80"), new BigDecimal("5"),
                new BigDecimal("15"), new BigDecimal("0.5"), "1 concha",
                null
        );

        mockMvc.perform(post("/api/v1/foods").header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(req1)));
        mockMvc.perform(post("/api/v1/foods").header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(req2)));

        mockMvc.perform(get("/api/v1/foods?search=arroz")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(1))
                .andExpect(jsonPath("$.data.content[0].name").value("Arroz branco"));
    }
}