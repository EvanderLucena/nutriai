package com.nutriai.api.service;

import com.nutriai.api.dto.food.*;
import com.nutriai.api.exception.ResourceNotFoundException;
import com.nutriai.api.model.Food;
import com.nutriai.api.model.FoodPortion;
import com.nutriai.api.repository.FoodPortionRepository;
import com.nutriai.api.repository.FoodRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FoodServiceTest {

    @Mock
    private FoodRepository foodRepository;

    @Mock
    private FoodPortionRepository foodPortionRepository;

    @InjectMocks
    private FoodService foodService;

    private UUID nutritionistId;

    @BeforeEach
    void setUp() {
        nutritionistId = UUID.randomUUID();
    }

    @Test
    void createFood_baseType_storesPer100FieldsPresetFieldsNull() {
        when(foodRepository.save(any(Food.class))).thenAnswer(inv -> {
            Food f = inv.getArgument(0);
            f.setId(UUID.randomUUID());
            return f;
        });
        when(foodPortionRepository.findByFoodIdOrderBySortOrder(any(UUID.class))).thenReturn(List.of());

        CreateFoodRequest req = new CreateFoodRequest(
                "BASE", "Arroz branco", "CARBOIDRATO",
                new BigDecimal("130.0"), new BigDecimal("2.7"), new BigDecimal("28.0"),
                new BigDecimal("0.3"), new BigDecimal("0.4"),
                null, null, null, null, null, null, null,
                List.of(new FoodPortionDto(null, "1 colher", new BigDecimal("15.0")))
        );

        FoodResponse resp = foodService.createFood(nutritionistId, req);

        assertNotNull(resp.id());
        assertEquals("BASE", resp.type());
        assertEquals(new BigDecimal("130.0"), resp.per100Kcal());
        assertNull(resp.presetGrams());
        verify(foodPortionRepository, times(1)).save(any(FoodPortion.class));
    }

    @Test
    void createFood_presetType_storesPresetFieldsPer100FieldsNull() {
        when(foodRepository.save(any(Food.class))).thenAnswer(inv -> {
            Food f = inv.getArgument(0);
            f.setId(UUID.randomUUID());
            return f;
        });

        CreateFoodRequest req = new CreateFoodRequest(
                "PRESET", "Pão integral", "CARBOIDRATO",
                null, null, null, null, null,
                new BigDecimal("30.0"), new BigDecimal("70.0"), new BigDecimal("2.5"),
                new BigDecimal("12.0"), new BigDecimal("1.0"), "1 fatia",
                null, null
        );

        FoodResponse resp = foodService.createFood(nutritionistId, req);

        assertNotNull(resp.id());
        assertEquals("PRESET", resp.type());
        assertEquals(new BigDecimal("30.0"), resp.presetGrams());
        assertEquals("1 fatia", resp.portionLabel());
        assertNull(resp.per100Kcal());
    }

    @Test
    void listFoods_returnsOnlyNutritionistsFoods() {
        Food food = Food.builder().id(UUID.randomUUID()).nutritionistId(nutritionistId).type("BASE").name("Arroz").build();
        Page<Food> page = new PageImpl<>(List.of(food));
        when(foodRepository.findByNutritionistId(eq(nutritionistId), any(PageRequest.class))).thenReturn(page);
        when(foodPortionRepository.findByFoodIdOrderBySortOrder(food.getId())).thenReturn(List.of());

        FoodService.FoodListResponse resp = foodService.listFoods(nutritionistId, 0, 12, null, null);

        assertEquals(1, resp.content().size());
        assertEquals(1, resp.totalElements());
    }

    @Test
    void listFoods_withSearchAndCategory_usesFilteredQuery() {
        Food food = Food.builder().id(UUID.randomUUID()).nutritionistId(nutritionistId).type("BASE").name("Arroz").category("CARBOIDRATO").build();
        Page<Food> page = new PageImpl<>(List.of(food));
        when(foodRepository.findByNutritionistIdWithFilters(eq(nutritionistId), eq("arroz"), eq("CARBOIDRATO"), any(PageRequest.class))).thenReturn(page);
        when(foodPortionRepository.findByFoodIdOrderBySortOrder(food.getId())).thenReturn(List.of());

        FoodService.FoodListResponse resp = foodService.listFoods(nutritionistId, 0, 12, "arroz", "CARBOIDRATO");

        assertEquals(1, resp.content().size());
        verify(foodRepository).findByNutritionistIdWithFilters(eq(nutritionistId), eq("arroz"), eq("CARBOIDRATO"), any(PageRequest.class));
        verify(foodRepository, never()).findByNutritionistId(any(), any());
    }

    @Test
    void getFood_returnsFoodForCorrectNutritionist() {
        UUID foodId = UUID.randomUUID();
        Food food = Food.builder().id(foodId).nutritionistId(nutritionistId).type("BASE").name("Arroz").build();
        when(foodRepository.findByIdAndNutritionistId(foodId, nutritionistId)).thenReturn(Optional.of(food));
        when(foodPortionRepository.findByFoodIdOrderBySortOrder(foodId)).thenReturn(List.of());

        FoodResponse resp = foodService.getFood(nutritionistId, foodId);

        assertEquals(foodId, resp.id());
        assertEquals("Arroz", resp.name());
    }

    @Test
    void getFood_throws404ForWrongNutritionist() {
        UUID foodId = UUID.randomUUID();
        UUID wrongNutriId = UUID.randomUUID();
        when(foodRepository.findByIdAndNutritionistId(foodId, wrongNutriId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> foodService.getFood(wrongNutriId, foodId));
    }

    @Test
    void updateFood_modifiesCorrectFieldsAndPersists() {
        UUID foodId = UUID.randomUUID();
        Food food = Food.builder().id(foodId).nutritionistId(nutritionistId).type("BASE").name("Arroz branco").build();
        when(foodRepository.findByIdAndNutritionistId(foodId, nutritionistId)).thenReturn(Optional.of(food));
        when(foodRepository.save(any(Food.class))).thenAnswer(inv -> inv.getArgument(0));
        when(foodPortionRepository.findByFoodIdOrderBySortOrder(foodId)).thenReturn(List.of());

        UpdateFoodRequest req = new UpdateFoodRequest("Arroz integral", null, null, null, null, null, null, null, null, null, null, null, null, null, null);
        FoodResponse resp = foodService.updateFood(nutritionistId, foodId, req);

        assertEquals("Arroz integral", resp.name());
        verify(foodRepository).save(any(Food.class));
    }

    @Test
    void deleteFood_removesFoodAndPortions() {
        UUID foodId = UUID.randomUUID();
        Food food = Food.builder().id(foodId).nutritionistId(nutritionistId).type("BASE").name("Arroz").build();
        when(foodRepository.findByIdAndNutritionistId(foodId, nutritionistId)).thenReturn(Optional.of(food));

        foodService.deleteFood(nutritionistId, foodId);

        verify(foodPortionRepository).deleteAllByFoodId(foodId);
        verify(foodRepository).delete(food);
    }

    @Test
    void deleteFood_throws404ForWrongNutritionist() {
        UUID foodId = UUID.randomUUID();
        UUID wrongNutriId = UUID.randomUUID();
        when(foodRepository.findByIdAndNutritionistId(foodId, wrongNutriId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> foodService.deleteFood(wrongNutriId, foodId));
    }

    @Test
    void updateFood_replacesPortionsWhenProvided() {
        UUID foodId = UUID.randomUUID();
        Food food = Food.builder().id(foodId).nutritionistId(nutritionistId).type("BASE").name("Arroz").build();
        when(foodRepository.findByIdAndNutritionistId(foodId, nutritionistId)).thenReturn(Optional.of(food));
        when(foodRepository.save(any(Food.class))).thenAnswer(inv -> inv.getArgument(0));
        when(foodPortionRepository.findByFoodIdOrderBySortOrder(foodId)).thenReturn(List.of(
                FoodPortion.builder().id(UUID.randomUUID()).foodId(foodId).name("1 xícara").grams(new BigDecimal("80")).sortOrder(0).build()
        ));

        UpdateFoodRequest req = new UpdateFoodRequest(null, null, null, null, null, null, null, null, null, null, null, null, null, null,
                List.of(new FoodPortionDto(null, "1 colher", new BigDecimal("15"))));

        FoodResponse resp = foodService.updateFood(nutritionistId, foodId, req);

        verify(foodPortionRepository).deleteAllByFoodId(foodId);
        verify(foodPortionRepository).save(any(FoodPortion.class));
    }
}