package com.nutriai.api.service;

import com.nutriai.api.dto.plan.*;
import com.nutriai.api.exception.ResourceNotFoundException;
import com.nutriai.api.model.*;
import com.nutriai.api.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;

/**
 * Meal plan service — CRUD, macro calculation (D-20), auto-creation (D-13/D-14).
 * All mutations verify nutritionist ownership through Episode → Patient chain.
 */
@Service
public class MealPlanService {

    private static final Logger logger = LoggerFactory.getLogger(MealPlanService.class);
    private static final BigDecimal HUNDRED = BigDecimal.valueOf(100);

    private final MealPlanRepository mealPlanRepository;
    private final MealSlotRepository mealSlotRepository;
    private final MealOptionRepository mealOptionRepository;
    private final MealFoodRepository mealFoodRepository;
    private final PlanExtraRepository planExtraRepository;
    private final FoodRepository foodRepository;
    private final PatientRepository patientRepository;
    private final EpisodeRepository episodeRepository;

    public MealPlanService(MealPlanRepository mealPlanRepository,
                           MealSlotRepository mealSlotRepository,
                           MealOptionRepository mealOptionRepository,
                           MealFoodRepository mealFoodRepository,
                           PlanExtraRepository planExtraRepository,
                           FoodRepository foodRepository,
                           PatientRepository patientRepository,
                           EpisodeRepository episodeRepository) {
        this.mealPlanRepository = mealPlanRepository;
        this.mealSlotRepository = mealSlotRepository;
        this.mealOptionRepository = mealOptionRepository;
        this.mealFoodRepository = mealFoodRepository;
        this.planExtraRepository = planExtraRepository;
        this.foodRepository = foodRepository;
        this.patientRepository = patientRepository;
        this.episodeRepository = episodeRepository;
    }

    /**
     * Create a default 6-meal plan for a new episode (D-13/D-14).
     */
    @Transactional
    public void createDefaultPlan(UUID episodeId, UUID nutritionistId) {
        MealPlan plan = MealPlan.builder()
                .episodeId(episodeId)
                .nutritionistId(nutritionistId)
                .title("Plano alimentar")
                .kcalTarget(new BigDecimal("1800"))
                .protTarget(new BigDecimal("90"))
                .carbTarget(new BigDecimal("200"))
                .fatTarget(new BigDecimal("60"))
                .build();
        MealPlan savedPlan = mealPlanRepository.save(plan);

        String[][] defaultMeals = {
                {"Café da manhã", "07:00"},
                {"Lanche manhã", "10:00"},
                {"Almoço", "12:30"},
                {"Lanche tarde", "15:30"},
                {"Jantar", "19:30"},
                {"Ceia", "22:00"}
        };

        for (int i = 0; i < defaultMeals.length; i++) {
            MealSlot slot = MealSlot.builder()
                    .planId(savedPlan.getId())
                    .label(defaultMeals[i][0])
                    .time(defaultMeals[i][1])
                    .sortOrder(i)
                    .build();
            MealSlot savedSlot = mealSlotRepository.save(slot);

            MealOption option = MealOption.builder()
                    .mealSlotId(savedSlot.getId())
                    .name("Opção 1 · Clássico")
                    .sortOrder(0)
                    .build();
            mealOptionRepository.save(option);
        }

        logger.info("Default plan created: episodeId={}, nutritionistId={}", episodeId, nutritionistId);
    }

    /**
     * Get full plan tree for a patient's active episode.
     * Verifies nutritionist ownership via Episode → Patient → nutritionistId chain.
     */
    @Transactional(readOnly = true)
    public PlanResponse getPlan(UUID nutritionistId, UUID patientId) {
        verifyPatientOwnership(patientId, nutritionistId);

        Episode episode = episodeRepository.findTopByPatientIdAndEndDateIsNullOrderByStartDateDesc(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Episódio ativo", patientId));

        MealPlan plan = mealPlanRepository.findByEpisodeId(episode.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Plano alimentar", episode.getId()));

        return buildPlanResponse(plan);
    }

    /**
     * Update plan-level fields (title, targets, notes).
     */
    @Transactional
    public PlanResponse updatePlan(UUID nutritionistId, UUID patientId, UpdatePlanRequest req) {
        MealPlan plan = getPlanAndVerifyOwnership(nutritionistId, patientId);

        if (req.title() != null) plan.setTitle(req.title());
        if (req.notes() != null) plan.setNotes(req.notes());
        if (req.kcalTarget() != null) plan.setKcalTarget(req.kcalTarget());
        if (req.protTarget() != null) plan.setProtTarget(req.protTarget());
        if (req.carbTarget() != null) plan.setCarbTarget(req.carbTarget());
        if (req.fatTarget() != null) plan.setFatTarget(req.fatTarget());

        mealPlanRepository.save(plan);
        return buildPlanResponse(plan);
    }

    /**
     * Add a meal slot to the plan.
     */
    @Transactional
    public MealSlotResponse addMealSlot(UUID nutritionistId, UUID patientId, AddMealSlotRequest req) {
        MealPlan plan = getPlanAndVerifyOwnership(nutritionistId, patientId);

        int maxSort = mealSlotRepository.findByPlanIdOrderBySortOrder(plan.getId())
                .stream().mapToInt(MealSlot::getSortOrder).max().orElse(-1);

        MealSlot slot = MealSlot.builder()
                .planId(plan.getId())
                .label(req.label())
                .time(req.time())
                .sortOrder(maxSort + 1)
                .build();
        MealSlot savedSlot = mealSlotRepository.save(slot);

        MealOption option = MealOption.builder()
                .mealSlotId(savedSlot.getId())
                .name("Opção 1 · Clássico")
                .sortOrder(0)
                .build();
        mealOptionRepository.save(option);

        return MealSlotResponse.from(savedSlot,
                mealOptionRepository.findByMealSlotIdOrderBySortOrder(savedSlot.getId()),
                List.of());
    }

    /**
     * Update a meal slot (label, time).
     */
    @Transactional
    public MealSlotResponse updateMealSlot(UUID nutritionistId, UUID mealSlotId, String label, String time) {
        MealSlot slot = findSlotAndVerifyOwnership(nutritionistId, mealSlotId);

        if (label != null) slot.setLabel(label);
        if (time != null) slot.setTime(time);
        mealSlotRepository.save(slot);

        return MealSlotResponse.from(slot,
                mealOptionRepository.findByMealSlotIdOrderBySortOrder(slot.getId()),
                mealFoodRepository.findByOptionIdOrderBySortOrder(
                        mealOptionRepository.findByMealSlotIdOrderBySortOrder(slot.getId())
                                .stream().map(MealOption::getId).toList().isEmpty() ?
                        UUID.randomUUID() :
                        mealOptionRepository.findByMealSlotIdOrderBySortOrder(slot.getId()).get(0).getId()
                ));
    }

    /**
     * Delete a meal slot (cascades to options and food items).
     */
    @Transactional
    public void deleteMealSlot(UUID nutritionistId, UUID mealSlotId) {
        MealSlot slot = findSlotAndVerifyOwnership(nutritionistId, mealSlotId);

        // Service-layer cascade: delete children before parent
        List<MealOption> options = mealOptionRepository.findByMealSlotIdOrderBySortOrder(slot.getId());
        for (MealOption opt : options) {
            mealFoodRepository.deleteAllByOptionId(opt.getId());
        }
        mealOptionRepository.deleteAllByMealSlotId(slot.getId());
        mealSlotRepository.delete(slot);
        logger.info("MealSlot deleted: id={}", mealSlotId);
    }

    /**
     * Add a named option to a meal slot (D-04).
     */
    @Transactional
    public MealOptionResponse addOption(UUID nutritionistId, UUID mealSlotId, AddOptionRequest req) {
        MealSlot slot = findSlotAndVerifyOwnership(nutritionistId, mealSlotId);

        int maxSort = mealOptionRepository.findByMealSlotIdOrderBySortOrder(slot.getId())
                .stream().mapToInt(MealOption::getSortOrder).max().orElse(-1);

        MealOption option = MealOption.builder()
                .mealSlotId(slot.getId())
                .name(req.name())
                .sortOrder(maxSort + 1)
                .build();
        MealOption saved = mealOptionRepository.save(option);

        return MealOptionResponse.from(saved, List.of());
    }

    /**
     * Rename an option.
     */
    @Transactional
    public MealOptionResponse updateOption(UUID nutritionistId, UUID optionId, String name) {
        MealOption option = findOptionAndVerifyOwnership(nutritionistId, optionId);

        if (name != null) option.setName(name);
        mealOptionRepository.save(option);

        return MealOptionResponse.from(option,
                mealFoodRepository.findByOptionIdOrderBySortOrder(option.getId()));
    }

    /**
     * Delete an option (cascades to items).
     */
    @Transactional
    public void deleteOption(UUID nutritionistId, UUID optionId) {
        MealOption option = findOptionAndVerifyOwnership(nutritionistId, optionId);

        mealFoodRepository.deleteAllByOptionId(optionId);
        mealOptionRepository.delete(option);
        logger.info("Option deleted: id={}", optionId);
    }

    /**
     * Add a food item to an option with macro calculation (D-20).
     */
    @Transactional
    public MealFoodResponse addFoodItem(UUID nutritionistId, UUID optionId, AddFoodItemRequest req) {
        MealOption option = findOptionAndVerifyOwnership(nutritionistId, optionId);

        Food food = foodRepository.findById(req.foodId())
                .orElseThrow(() -> new ResourceNotFoundException("Alimento", req.foodId()));

        BigDecimal grams, kcal, prot, carb, fat;

        if ("BASE".equals(food.getType())) {
            // D-20: Backend calculates macros from per100 data × grams / 100
            grams = req.grams();
            kcal = calculateMacro(food.getPer100Kcal(), grams);
            prot = calculateMacro(food.getPer100Prot(), grams);
            carb = calculateMacro(food.getPer100Carb(), grams);
            fat = calculateMacro(food.getPer100Fat(), grams);
        } else {
            // PRESET: use preset values directly
            grams = food.getPresetGrams() != null ? food.getPresetGrams() : req.grams();
            kcal = food.getPresetKcal();
            prot = food.getPresetProt();
            carb = food.getPresetCarb();
            fat = food.getPresetFat();
        }

        int maxSort = mealFoodRepository.findByOptionIdOrderBySortOrder(option.getId())
                .stream().mapToInt(MealFood::getSortOrder).max().orElse(-1);

        MealFood item = MealFood.builder()
                .optionId(option.getId())
                .foodId(food.getId())
                .foodName(food.getName())
                .qty(req.qty())
                .grams(grams)
                .kcal(kcal)
                .prot(prot)
                .carb(carb)
                .fat(fat)
                .sortOrder(maxSort + 1)
                .build();
        MealFood saved = mealFoodRepository.save(item);

        // Update usedCount on food
        food.setUsedCount(food.getUsedCount() + 1);
        foodRepository.save(food);

        logger.info("Food item added: foodId={}, optionId={}, kcal={}", food.getId(), optionId, kcal);
        return MealFoodResponse.from(saved);
    }

    /**
     * Update a food item — recalculate macros if grams changed (D-20).
     */
    @Transactional
    public MealFoodResponse updateFoodItem(UUID nutritionistId, UUID itemId, UpdateFoodItemRequest req) {
        MealFood item = findFoodItemAndVerifyOwnership(nutritionistId, itemId);

        if (req.grams() != null) {
            item.setGrams(req.grams());
            // Recalculate macros from food's per100 data if foodId exists
            if (item.getFoodId() != null) {
                foodRepository.findById(item.getFoodId()).ifPresent(food -> {
                    if ("BASE".equals(food.getType())) {
                        item.setKcal(calculateMacro(food.getPer100Kcal(), req.grams()));
                        item.setProt(calculateMacro(food.getPer100Prot(), req.grams()));
                        item.setCarb(calculateMacro(food.getPer100Carb(), req.grams()));
                        item.setFat(calculateMacro(food.getPer100Fat(), req.grams()));
                    }
                    // PRESET: just update grams, macros stay as is
                });
            }
        }
        if (req.qty() != null) item.setQty(req.qty());
        if (req.prep() != null) item.setPrep(req.prep());

        MealFood saved = mealFoodRepository.save(item);
        return MealFoodResponse.from(saved);
    }

    /**
     * Delete a food item from an option.
     */
    @Transactional
    public void deleteFoodItem(UUID nutritionistId, UUID itemId) {
        MealFood item = findFoodItemAndVerifyOwnership(nutritionistId, itemId);
        mealFoodRepository.delete(item);
        logger.info("Food item deleted: id={}", itemId);
    }

    /**
     * Add an off-plan extra authorization (D-11/D-12).
     */
    @Transactional
    public ExtraResponse addExtra(UUID nutritionistId, UUID patientId, AddExtraRequest req) {
        MealPlan plan = getPlanAndVerifyOwnership(nutritionistId, patientId);

        int maxSort = planExtraRepository.findByPlanIdOrderBySortOrder(plan.getId())
                .stream().mapToInt(PlanExtra::getSortOrder).max().orElse(-1);

        PlanExtra extra = PlanExtra.builder()
                .planId(plan.getId())
                .name(req.name())
                .quantity(req.quantity())
                .kcal(req.kcal())
                .prot(req.prot())
                .carb(req.carb())
                .fat(req.fat())
                .sortOrder(maxSort + 1)
                .build();
        PlanExtra saved = planExtraRepository.save(extra);

        return ExtraResponse.from(saved);
    }

    /**
     * Update an extra.
     */
    @Transactional
    public ExtraResponse updateExtra(UUID nutritionistId, UUID extraId, UpdateExtraRequest req) {
        PlanExtra extra = findExtraAndVerifyOwnership(nutritionistId, extraId);

        if (req.name() != null) extra.setName(req.name());
        if (req.quantity() != null) extra.setQuantity(req.quantity());
        if (req.kcal() != null) extra.setKcal(req.kcal());
        if (req.prot() != null) extra.setProt(req.prot());
        if (req.carb() != null) extra.setCarb(req.carb());
        if (req.fat() != null) extra.setFat(req.fat());

        PlanExtra saved = planExtraRepository.save(extra);
        return ExtraResponse.from(saved);
    }

    /**
     * Delete an extra.
     */
    @Transactional
    public void deleteExtra(UUID nutritionistId, UUID extraId) {
        PlanExtra extra = findExtraAndVerifyOwnership(nutritionistId, extraId);
        planExtraRepository.delete(extra);
        logger.info("Extra deleted: id={}", extraId);
    }

    // === Macro Calculation (D-20) ===

    /**
     * Calculate frozen macro value: per100 × grams / 100, with HALF_UP rounding, scale=1.
     */
    BigDecimal calculateMacro(BigDecimal per100Value, BigDecimal grams) {
        if (per100Value == null || grams == null) return BigDecimal.ZERO;
        return per100Value.multiply(grams).divide(HUNDRED, 1, RoundingMode.HALF_UP);
    }

    // === Ownership Verification ===

    private MealPlan getPlanAndVerifyOwnership(UUID nutritionistId, UUID patientId) {
        verifyPatientOwnership(patientId, nutritionistId);

        Episode episode = episodeRepository.findTopByPatientIdAndEndDateIsNullOrderByStartDateDesc(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Episódio ativo", patientId));

        return mealPlanRepository.findByEpisodeId(episode.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Plano alimentar", episode.getId()));
    }

    private void verifyPatientOwnership(UUID patientId, UUID nutritionistId) {
        patientRepository.findByIdAndNutritionistId(patientId, nutritionistId)
                .orElseThrow(() -> new ResourceNotFoundException("Paciente", patientId));
    }

    private MealSlot findSlotAndVerifyOwnership(UUID nutritionistId, UUID slotId) {
        MealSlot slot = mealSlotRepository.findById(slotId)
                .orElseThrow(() -> new ResourceNotFoundException("Refeição", slotId));
        MealPlan plan = mealPlanRepository.findById(slot.getPlanId())
                .orElseThrow(() -> new ResourceNotFoundException("Plano alimentar", slot.getPlanId()));
        if (!plan.getNutritionistId().equals(nutritionistId)) {
            throw new ResourceNotFoundException("Refeição", slotId);
        }
        return slot;
    }

    private MealOption findOptionAndVerifyOwnership(UUID nutritionistId, UUID optionId) {
        MealOption option = mealOptionRepository.findById(optionId)
                .orElseThrow(() -> new ResourceNotFoundException("Opção", optionId));
        MealSlot slot = mealSlotRepository.findById(option.getMealSlotId())
                .orElseThrow(() -> new ResourceNotFoundException("Refeição", option.getMealSlotId()));
        MealPlan plan = mealPlanRepository.findById(slot.getPlanId())
                .orElseThrow(() -> new ResourceNotFoundException("Plano alimentar", slot.getPlanId()));
        if (!plan.getNutritionistId().equals(nutritionistId)) {
            throw new ResourceNotFoundException("Opção", optionId);
        }
        return option;
    }

    private MealFood findFoodItemAndVerifyOwnership(UUID nutritionistId, UUID itemId) {
        MealFood item = mealFoodRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Item", itemId));
        MealOption option = mealOptionRepository.findById(item.getOptionId())
                .orElseThrow(() -> new ResourceNotFoundException("Opção", item.getOptionId()));
        MealSlot slot = mealSlotRepository.findById(option.getMealSlotId())
                .orElseThrow(() -> new ResourceNotFoundException("Refeição", option.getMealSlotId()));
        MealPlan plan = mealPlanRepository.findById(slot.getPlanId())
                .orElseThrow(() -> new ResourceNotFoundException("Plano alimentar", slot.getPlanId()));
        if (!plan.getNutritionistId().equals(nutritionistId)) {
            throw new ResourceNotFoundException("Item", itemId);
        }
        return item;
    }

    private PlanExtra findExtraAndVerifyOwnership(UUID nutritionistId, UUID extraId) {
        PlanExtra extra = planExtraRepository.findById(extraId)
                .orElseThrow(() -> new ResourceNotFoundException("Extra", extraId));
        MealPlan plan = mealPlanRepository.findById(extra.getPlanId())
                .orElseThrow(() -> new ResourceNotFoundException("Plano alimentar", extra.getPlanId()));
        if (!plan.getNutritionistId().equals(nutritionistId)) {
            throw new ResourceNotFoundException("Extra", extraId);
        }
        return extra;
    }

    private PlanResponse buildPlanResponse(MealPlan plan) {
        List<MealSlot> slots = mealSlotRepository.findByPlanIdOrderBySortOrder(plan.getId());
        List<PlanExtra> extras = planExtraRepository.findByPlanIdOrderBySortOrder(plan.getId());

        List<MealOption> allOptions = slots.stream()
                .flatMap(s -> mealOptionRepository.findByMealSlotIdOrderBySortOrder(s.getId()).stream())
                .toList();

        List<MealFood> allItems = allOptions.stream()
                .flatMap(o -> mealFoodRepository.findByOptionIdOrderBySortOrder(o.getId()).stream())
                .toList();

        return PlanResponse.from(plan, slots, extras, allOptions, allItems);
    }
}