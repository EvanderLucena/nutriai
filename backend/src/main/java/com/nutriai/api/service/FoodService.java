package com.nutriai.api.service;

import com.nutriai.api.dto.food.*;
import com.nutriai.api.exception.ResourceNotFoundException;
import com.nutriai.api.model.Food;
import com.nutriai.api.model.FoodPortion;
import com.nutriai.api.repository.FoodPortionRepository;
import com.nutriai.api.repository.FoodRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class FoodService {

    private static final Logger logger = LoggerFactory.getLogger(FoodService.class);

    private final FoodRepository foodRepository;
    private final FoodPortionRepository foodPortionRepository;

    public FoodService(FoodRepository foodRepository, FoodPortionRepository foodPortionRepository) {
        this.foodRepository = foodRepository;
        this.foodPortionRepository = foodPortionRepository;
    }

    @Transactional
    public FoodResponse createFood(UUID nutritionistId, CreateFoodRequest req) {
        Food food = Food.builder()
                .nutritionistId(nutritionistId)
                .type(req.type())
                .name(req.name())
                .category(req.category())
                .per100Kcal(req.per100Kcal())
                .per100Prot(req.per100Prot())
                .per100Carb(req.per100Carb())
                .per100Fat(req.per100Fat())
                .per100Fiber(req.per100Fiber())
                .presetGrams(req.presetGrams())
                .presetKcal(req.presetKcal())
                .presetProt(req.presetProt())
                .presetCarb(req.presetCarb())
                .presetFat(req.presetFat())
                .portionLabel(req.portionLabel())
                .build();

        Food saved = foodRepository.save(food);

        List<FoodPortion> portions = List.of();
        if (req.portions() != null && !req.portions().isEmpty()) {
            int sortOrder = 0;
            for (FoodPortionDto p : req.portions()) {
                FoodPortion portion = FoodPortion.builder()
                        .foodId(saved.getId())
                        .name(p.name())
                        .grams(p.grams())
                        .sortOrder(sortOrder++)
                        .build();
                foodPortionRepository.save(portion);
            }
            portions = foodPortionRepository.findByFoodIdOrderBySortOrder(saved.getId());
        }

        logger.info("Food created: id={}, name={}, type={}, nutritionistId={}", saved.getId(), saved.getName(), saved.getType(), nutritionistId);
        return FoodResponse.from(saved, portions);
    }

    @Transactional(readOnly = true)
    public FoodListResponse listFoods(UUID nutritionistId, int page, int size, String search, String category) {
        PageRequest pageRequest = PageRequest.of(page, size);

        String escapedSearch = search != null ? escapeLike(search) : null;
        boolean hasFilter = escapedSearch != null || category != null;

        Page<Food> result;
        if (hasFilter) {
            result = foodRepository.findByNutritionistIdWithFilters(nutritionistId, escapedSearch, category, pageRequest);
        } else {
            result = foodRepository.findByNutritionistId(nutritionistId, pageRequest);
        }

        return FoodListResponse.from(result, this);
    }

    @Transactional(readOnly = true)
    public FoodResponse getFood(UUID nutritionistId, UUID foodId) {
        Food food = foodRepository.findByIdAndNutritionistId(foodId, nutritionistId)
                .orElseThrow(() -> new ResourceNotFoundException("Alimento", foodId));
        List<FoodPortion> portions = foodPortionRepository.findByFoodIdOrderBySortOrder(foodId);
        return FoodResponse.from(food, portions);
    }

    @Transactional
    public FoodResponse updateFood(UUID nutritionistId, UUID foodId, UpdateFoodRequest req) {
        Food food = foodRepository.findByIdAndNutritionistId(foodId, nutritionistId)
                .orElseThrow(() -> new ResourceNotFoundException("Alimento", foodId));

        if (req.name() != null) food.setName(req.name());
        if (req.category() != null) food.setCategory(req.category());

        // BASE-only fields
        if (req.per100Kcal() != null) food.setPer100Kcal(req.per100Kcal());
        if (req.per100Prot() != null) food.setPer100Prot(req.per100Prot());
        if (req.per100Carb() != null) food.setPer100Carb(req.per100Carb());
        if (req.per100Fat() != null) food.setPer100Fat(req.per100Fat());
        if (req.per100Fiber() != null) food.setPer100Fiber(req.per100Fiber());

        // PRESET-only fields
        if (req.presetGrams() != null) food.setPresetGrams(req.presetGrams());
        if (req.presetKcal() != null) food.setPresetKcal(req.presetKcal());
        if (req.presetProt() != null) food.setPresetProt(req.presetProt());
        if (req.presetCarb() != null) food.setPresetCarb(req.presetCarb());
        if (req.presetFat() != null) food.setPresetFat(req.presetFat());
        if (req.portionLabel() != null) food.setPortionLabel(req.portionLabel());

        Food saved = foodRepository.save(food);

        // Replace all portions if provided
        List<FoodPortion> portions = foodPortionRepository.findByFoodIdOrderBySortOrder(foodId);
        if (req.portions() != null) {
            foodPortionRepository.deleteAllByFoodId(foodId);
            int sortOrder = 0;
            for (FoodPortionDto p : req.portions()) {
                FoodPortion portion = FoodPortion.builder()
                        .foodId(foodId)
                        .name(p.name())
                        .grams(p.grams())
                        .sortOrder(sortOrder++)
                        .build();
                foodPortionRepository.save(portion);
            }
            portions = foodPortionRepository.findByFoodIdOrderBySortOrder(foodId);
        }

        logger.info("Food updated: id={}, nutritionistId={}", saved.getId(), nutritionistId);
        return FoodResponse.from(saved, portions);
    }

    @Transactional
    public void deleteFood(UUID nutritionistId, UUID foodId) {
        Food food = foodRepository.findByIdAndNutritionistId(foodId, nutritionistId)
                .orElseThrow(() -> new ResourceNotFoundException("Alimento", foodId));

        foodPortionRepository.deleteAllByFoodId(foodId);
        foodRepository.delete(food);
        logger.info("Food deleted: id={}, nutritionistId={}", foodId, nutritionistId);
    }

    /**
     * Escape SQL LIKE special characters (% and _) for safe wildcard search.
     */
    private String escapeLike(String search) {
        if (search == null) return null;
        return search.replace("!", "!!")
                .replace("%", "!%")
                .replace("_", "!_");
    }

    /**
     * Helper to load portions for a food (used by FoodListResponse).
     */
    public List<FoodPortion> loadPortions(UUID foodId) {
        return foodPortionRepository.findByFoodIdOrderBySortOrder(foodId);
    }

    /**
     * Paginated food list response.
     */
    public record FoodListResponse(
            List<FoodResponse> content,
            int page,
            int size,
            long totalElements,
            int totalPages
    ) {
        public static FoodListResponse from(Page<Food> pageResult, FoodService foodService) {
            return new FoodListResponse(
                    pageResult.getContent().stream()
                            .map(f -> FoodResponse.from(f, foodService.loadPortions(f.getId())))
                            .toList(),
                    pageResult.getNumber(),
                    pageResult.getSize(),
                    pageResult.getTotalElements(),
                    pageResult.getTotalPages()
            );
        }
    }
}