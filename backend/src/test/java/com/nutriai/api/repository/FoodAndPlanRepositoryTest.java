package com.nutriai.api.repository;

import com.nutriai.api.model.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@ActiveProfiles("test")
class FoodAndPlanRepositoryTest {

    @Autowired
    private FoodRepository foodRepository;

    @Autowired
    private FoodPortionRepository foodPortionRepository;

    @Autowired
    private MealPlanRepository mealPlanRepository;

    @Autowired
    private MealSlotRepository mealSlotRepository;

    @Autowired
    private MealOptionRepository mealOptionRepository;

    @Autowired
    private MealFoodRepository mealFoodRepository;

    @Autowired
    private PlanExtraRepository planExtraRepository;

    @Autowired
    private EpisodeRepository episodeRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private NutritionistRepository nutritionistRepository;

    private UUID nutritionistId;

    @BeforeEach
    void setUp() {
        planExtraRepository.deleteAll();
        mealFoodRepository.deleteAll();
        mealOptionRepository.deleteAll();
        mealSlotRepository.deleteAll();
        mealPlanRepository.deleteAll();
        foodPortionRepository.deleteAll();
        foodRepository.deleteAll();
        episodeRepository.deleteAll();
        patientRepository.deleteAll();
        nutritionistRepository.deleteAll();

        // Create a real nutritionist for FK constraints
        Nutritionist nutri = Nutritionist.builder()
                .email("test@repo.com")
                .passwordHash("hash")
                .name("Test Nutri")
                .build();
        nutritionistRepository.save(nutri);
        nutritionistId = nutri.getId();
    }

    // === Food entity tests ===

    @Test
    void foodEntity_withBaseType_hasPer100FieldsPopulated() {
        Food food = Food.builder()
                .nutritionistId(nutritionistId)
                .type("BASE")
                .name("Arroz branco")
                .category("Cereais")
                .per100Kcal(new BigDecimal("130.0"))
                .per100Prot(new BigDecimal("2.7"))
                .per100Carb(new BigDecimal("28.0"))
                .per100Fat(new BigDecimal("0.3"))
                .per100Fiber(new BigDecimal("0.4"))
                .build();

        Food saved = foodRepository.save(food);

        assertNotNull(saved.getId());
        assertEquals("BASE", saved.getType());
        assertEquals(new BigDecimal("130.0"), saved.getPer100Kcal());
        assertNull(saved.getPresetGrams());
        assertNull(saved.getPresetKcal());
    }

    @Test
    void foodEntity_withPresetType_hasPresetFieldsPopulated() {
        Food food = Food.builder()
                .nutritionistId(nutritionistId)
                .type("PRESET")
                .name("Pão integral")
                .category("Pães")
                .presetGrams(new BigDecimal("30.0"))
                .presetKcal(new BigDecimal("70.0"))
                .presetProt(new BigDecimal("2.5"))
                .presetCarb(new BigDecimal("12.0"))
                .presetFat(new BigDecimal("1.0"))
                .portionLabel("1 fatia")
                .build();

        Food saved = foodRepository.save(food);

        assertNotNull(saved.getId());
        assertEquals("PRESET", saved.getType());
        assertEquals(new BigDecimal("30.0"), saved.getPresetGrams());
        assertNull(saved.getPer100Kcal());
    }

    @Test
    void foodRepository_findByNutritionistId_returnsOnlyOwnerFoods() {
        UUID otherNutriId = createOtherNutritionist();

        foodRepository.save(Food.builder().nutritionistId(nutritionistId).type("BASE").name("Arroz").build());
        foodRepository.save(Food.builder().nutritionistId(nutritionistId).type("PRESET").name("Pão").build());
        foodRepository.save(Food.builder().nutritionistId(otherNutriId).type("BASE").name("Feijão").build());

        Page<Food> result = foodRepository.findByNutritionistId(nutritionistId, PageRequest.of(0, 20));
        assertEquals(2, result.getTotalElements());
        assertTrue(result.getContent().stream().allMatch(f -> f.getNutritionistId().equals(nutritionistId)));
    }

    @Test
    void foodRepository_findByIdAndNutritionistId_returnsEmptyForWrongOwner() {
        UUID otherNutriId = createOtherNutritionist();

        Food food = foodRepository.save(Food.builder().nutritionistId(nutritionistId).type("BASE").name("Arroz").build());

        Optional<Food> result = foodRepository.findByIdAndNutritionistId(food.getId(), otherNutriId);
        assertTrue(result.isEmpty());
    }

    @Test
    void foodPortion_deletedSeparatelyWhenFoodDeleted() {
        Food food = Food.builder()
                .nutritionistId(nutritionistId)
                .type("BASE")
                .name("Arroz")
                .build();
        Food savedFood = foodRepository.save(food);

        FoodPortion portion = FoodPortion.builder()
                .foodId(savedFood.getId())
                .name("1 colher de sopa")
                .grams(new BigDecimal("15.0"))
                .sortOrder(0)
                .build();
        foodPortionRepository.save(portion);

        // With raw UUID FKs, cascade is handled in DB (ON DELETE CASCADE) and service layer
        // Simulate service-layer cascade: delete children before parent
        foodPortionRepository.deleteAllByFoodId(savedFood.getId());
        foodRepository.delete(savedFood);

        assertTrue(foodPortionRepository.findById(portion.getId()).isEmpty());
        assertTrue(foodRepository.findById(savedFood.getId()).isEmpty());
    }

    // === MealPlan entity tests ===

    @Test
    void mealPlan_hasUniqueConstraintOnEpisodeId() {
        UUID patientId = createPatient();
        Episode episode = episodeRepository.save(Episode.builder().patientId(patientId).build());

        MealPlan plan = MealPlan.builder()
                .episodeId(episode.getId())
                .nutritionistId(nutritionistId)
                .build();
        mealPlanRepository.save(plan);

        MealPlan duplicatePlan = MealPlan.builder()
                .episodeId(episode.getId())
                .nutritionistId(nutritionistId)
                .build();
        assertThrows(Exception.class, () -> mealPlanRepository.saveAndFlush(duplicatePlan));
    }

    @Test
    void mealPlan_findByEpisodeId_returnsPlan() {
        UUID patientId = createPatient();
        Episode episode = episodeRepository.save(Episode.builder().patientId(patientId).build());

        MealPlan plan = MealPlan.builder()
                .episodeId(episode.getId())
                .nutritionistId(nutritionistId)
                .title("Plano test")
                .build();
        mealPlanRepository.save(plan);

        Optional<MealPlan> found = mealPlanRepository.findByEpisodeId(episode.getId());
        assertTrue(found.isPresent());
        assertEquals("Plano test", found.get().getTitle());
    }

    // === MealFood with nullable foodId FK ===

    @Test
    void mealFood_withNullFoodId_persistsSuccessfully() {
        UUID patientId = createPatient();
        Episode episode = episodeRepository.save(Episode.builder().patientId(patientId).build());
        MealPlan plan = mealPlanRepository.save(MealPlan.builder().episodeId(episode.getId()).nutritionistId(nutritionistId).build());
        MealSlot slot = mealSlotRepository.save(MealSlot.builder().planId(plan.getId()).label("Café").sortOrder(0).build());
        MealOption option = mealOptionRepository.save(MealOption.builder().mealSlotId(slot.getId()).name("Opção 1").sortOrder(0).build());

        MealFood item = MealFood.builder()
                .optionId(option.getId())
                .foodId(null) // nullable FK for free-text foods
                .foodName("Pão caseiro da mãe")
                .qty("1 unidade")
                .grams(new BigDecimal("50.0"))
                .kcal(new BigDecimal("120.0"))
                .build();
        MealFood saved = mealFoodRepository.save(item);

        assertNotNull(saved.getId());
        assertNull(saved.getFoodId());
        assertEquals("Pão caseiro da mãe", saved.getFoodName());
    }

    // === Cascading delete tests ===

    @Test
    void deleteMealSlot_serviceCascadeRemovesOptionsAndFoodItems() {
        UUID patientId = createPatient();
        Episode episode = episodeRepository.save(Episode.builder().patientId(patientId).build());
        MealPlan plan = mealPlanRepository.save(MealPlan.builder().episodeId(episode.getId()).nutritionistId(nutritionistId).build());
        MealSlot slot = mealSlotRepository.save(MealSlot.builder().planId(plan.getId()).label("Café").sortOrder(0).build());
        MealOption option = mealOptionRepository.save(MealOption.builder().mealSlotId(slot.getId()).name("Opção 1").sortOrder(0).build());
        MealFood item = mealFoodRepository.save(MealFood.builder()
                .optionId(option.getId()).foodName("Café").grams(new BigDecimal("200")).kcal(BigDecimal.ZERO).build());

        // Simulate service-layer cascade: delete children before parent (DB ON DELETE CASCADE handles this in production)
        mealFoodRepository.deleteAllByOptionId(option.getId());
        mealOptionRepository.deleteAllByMealSlotId(slot.getId());
        mealSlotRepository.delete(slot);

        assertTrue(mealOptionRepository.findById(option.getId()).isEmpty());
        assertTrue(mealFoodRepository.findById(item.getId()).isEmpty());
    }

    @Test
    void deleteMealPlan_serviceCascadeRemovesSlotsAndExtras() {
        UUID patientId = createPatient();
        Episode episode = episodeRepository.save(Episode.builder().patientId(patientId).build());
        MealPlan plan = mealPlanRepository.save(MealPlan.builder().episodeId(episode.getId()).nutritionistId(nutritionistId).build());
        MealSlot slot = mealSlotRepository.save(MealSlot.builder().planId(plan.getId()).label("Café").sortOrder(0).build());
        PlanExtra extra = planExtraRepository.save(PlanExtra.builder().planId(plan.getId()).name("Chá verde").build());

        // Simulate service-layer cascade: delete children before parent (DB ON DELETE CASCADE handles this in production)
        planExtraRepository.deleteAllByPlanId(plan.getId());
        List<MealOption> options = mealOptionRepository.findByMealSlotIdOrderBySortOrder(slot.getId());
        for (MealOption opt : options) {
            mealFoodRepository.deleteAllByOptionId(opt.getId());
        }
        mealOptionRepository.deleteAllByMealSlotId(slot.getId());
        mealSlotRepository.deleteAllByPlanId(plan.getId());
        mealPlanRepository.delete(plan);

        assertTrue(mealSlotRepository.findById(slot.getId()).isEmpty());
        assertTrue(planExtraRepository.findById(extra.getId()).isEmpty());
    }

    // Helper methods

    private UUID createPatient() {
        Patient patient = Patient.builder()
                .nutritionistId(nutritionistId)
                .name("Test Patient " + UUID.randomUUID().toString().substring(0, 8))
                .objective(PatientObjective.SAUDE_GERAL)
                .build();
        return patientRepository.save(patient).getId();
    }

    private UUID createOtherNutritionist() {
        Nutritionist other = Nutritionist.builder()
                .email("other" + UUID.randomUUID().toString().substring(0, 8) + "@test.com")
                .passwordHash("hash")
                .name("Other Nutri")
                .build();
        return nutritionistRepository.save(other).getId();
    }
}