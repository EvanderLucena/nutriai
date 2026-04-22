---
phase: 05-meal-plans-food-catalog
plan: 01
subsystem: api, database
tags: [spring-boot, jpa, flyway, postgres, meal-plan, food-catalog, macro-calculation]

# Dependency graph
requires:
  - phase: 04-patient-management
    provides: Patient model, Episode model, PatientService, PatientController, nutritionist-scoped data isolation
provides:
  - Food catalog CRUD API with BASE/PRESET types and nutritionist isolation
  - Meal plan CRUD API linked 1:1 to episode with full tree structure
  - Macro calculation engine (per100 × grams / 100 for BASE, preset values for PRESET)
  - Auto-creation of default 6-meal plan on patient creation
  - Frozen macro values in MealFood (editing catalog does NOT update existing plans)
  - Off-plan extra authorizations (PlanExtra CRUD)
affects: [06-dashboard-biometry, 07-whatsapp-ai, frontend-phase-5]

# Tech tracking
tech-stack:
  added: [BigDecimal macro calculation with HALF_UP rounding scale=1]
  patterns: [raw-UUID FK entities without @OneToMany(mappedBy), service-layer cascade via explicit repository deletes]

key-files:
  created:
    - backend/src/main/java/com/nutriai/api/model/Food.java
    - backend/src/main/java/com/nutriai/api/model/FoodPortion.java
    - backend/src/main/java/com/nutriai/api/model/MealPlan.java
    - backend/src/main/java/com/nutriai/api/model/MealSlot.java
    - backend/src/main/java/com/nutriai/api/model/MealOption.java
    - backend/src/main/java/com/nutriai/api/model/MealFood.java
    - backend/src/main/java/com/nutriai/api/model/PlanExtra.java
    - backend/src/main/java/com/nutriai/api/repository/FoodRepository.java
    - backend/src/main/java/com/nutriai/api/repository/FoodPortionRepository.java
    - backend/src/main/java/com/nutriai/api/repository/MealPlanRepository.java
    - backend/src/main/java/com/nutriai/api/repository/MealSlotRepository.java
    - backend/src/main/java/com/nutriai/api/repository/MealOptionRepository.java
    - backend/src/main/java/com/nutriai/api/repository/MealFoodRepository.java
    - backend/src/main/java/com/nutriai/api/repository/PlanExtraRepository.java
    - backend/src/main/resources/db/migration/V5__create_meal_plan_and_food_catalog_tables.sql
    - backend/src/main/java/com/nutriai/api/service/FoodService.java
    - backend/src/main/java/com/nutriai/api/controller/FoodController.java
    - backend/src/main/java/com/nutriai/api/dto/food/CreateFoodRequest.java
    - backend/src/main/java/com/nutriai/api/dto/food/UpdateFoodRequest.java
    - backend/src/main/java/com/nutriai/api/dto/food/FoodResponse.java
    - backend/src/main/java/com/nutriai/api/dto/food/FoodPortionDto.java
    - backend/src/main/java/com/nutriai/api/service/MealPlanService.java
    - backend/src/main/java/com/nutriai/api/controller/PlanController.java
    - backend/src/main/java/com/nutriai/api/dto/plan/PlanResponse.java
    - backend/src/main/java/com/nutriai/api/dto/plan/MealSlotResponse.java
    - backend/src/main/java/com/nutriai/api/dto/plan/MealOptionResponse.java
    - backend/src/main/java/com/nutriai/api/dto/plan/MealFoodResponse.java
    - backend/src/main/java/com/nutriai/api/dto/plan/ExtraResponse.java
    - backend/src/main/java/com/nutriai/api/dto/plan/AddFoodItemRequest.java
    - backend/src/main/java/com/nutriai/api/dto/plan/UpdateFoodItemRequest.java
    - backend/src/main/java/com/nutriai/api/dto/plan/AddMealSlotRequest.java
    - backend/src/main/java/com/nutriai/api/dto/plan/AddOptionRequest.java
    - backend/src/main/java/com/nutriai/api/dto/plan/AddExtraRequest.java
    - backend/src/main/java/com/nutriai/api/dto/plan/UpdateExtraRequest.java
    - backend/src/main/java/com/nutriai/api/dto/plan/UpdatePlanRequest.java
  modified:
    - backend/src/main/java/com/nutriai/api/service/PatientService.java
    - backend/src/test/java/com/nutriai/api/service/PatientServiceTest.java

key-decisions:
  - "Removed @OneToMany(mappedBy) from raw-UUID FK entities — JPA cascade doesn't work without @ManyToOne back-reference; cascade handled at DB level and service layer"
  - "Service-layer cascade pattern: explicit deleteAllByX() calls before parent delete, matching DB ON DELETE CASCADE behavior"
  - "Plan endpoints nested under /api/v1/patients/{patientId}/plan for contextual scoping"
  - "Macro calculation uses BigDecimal with HALF_UP rounding, scale=1"

patterns-established:
  - "Raw UUID FK pattern: entities use UUID fields for foreign keys, not @ManyToOne — cascade handled via service layer deleteAllBy*() methods and DB-level ON DELETE CASCADE"
  - "Ownership verification chain: PlanController → MealPlanService → PatientRepository.findByIdAndNutritionistId() → Episode → MealPlan"
  - "Frozen macro pattern: MealFood stores kcal/prot/carb/fat calculated at add-time; editing Food catalog does NOT propagate to existing plan items"

requirements-completed: [PLAN-01, PLAN-02, PLAN-03, PLAN-04, PLAN-05]

# Metrics
duration: 15min
completed: 2026-04-22
---

# Phase 5 Plan 1: Meal Plans & Food Catalog Backend Summary

**Food catalog CRUD with BASE/PRESET types and meal plan CRUD with macro calculation (per100 × grams / 100), auto-creation, and frozen values**

## Performance

- **Duration:** 15 min
- **Started:** 2026-04-22T10:41:52Z
- **Completed:** 2026-04-22T10:56:01Z
- **Tasks:** 3
- **Files modified:** 36

## Accomplishments
- 7 JPA entities with V5 Flyway migration creating 7 tables with correct FKs, cascades, indexes
- Food catalog CRUD API (6 endpoints) with BASE/PRESET types, portions, nutritionist-scoped data isolation
- Meal plan CRUD API (14 endpoints) with full tree structure, macro calculation, and auto-creation
- Auto-creation: creating a patient produces a 6-meal template plan (D-13/D-14)
- Frozen macros: editing food in catalog does NOT affect existing plan items (D-10)
- 110 backend tests passing (all phases)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create JPA entities and Flyway V5 migration** - `d9d1355` (feat)
2. **Task 2: Food catalog Service, Controller, DTOs, and tests** - `0026bfa` (feat)
3. **Task 3: Meal plan Service, Controller, auto-creation, macro calculation, and tests** - `c5d3b08` (feat)

## Files Created/Modified
- `backend/src/main/java/com/nutriai/api/model/Food.java` - Food entity with BASE/PRESET types, per100 and preset fields
- `backend/src/main/java/com/nutriai/api/model/FoodPortion.java` - Named portion for BASE foods
- `backend/src/main/java/com/nutriai/api/model/MealPlan.java` - Meal plan linked 1:1 to episode
- `backend/src/main/java/com/nutriai/api/model/MealSlot.java` - Meal slot with label, time, sort order
- `backend/src/main/java/com/nutriai/api/model/MealOption.java` - Named option within slot
- `backend/src/main/java/com/nutriai/api/model/MealFood.java` - Food item with frozen macros and nullable foodId FK
- `backend/src/main/java/com/nutriai/api/model/PlanExtra.java` - Off-plan extra authorization
- `backend/src/main/resources/db/migration/V5__create_meal_plan_and_food_catalog_tables.sql` - 7 tables with FKs, cascades, indexes
- `backend/src/main/java/com/nutriai/api/repository/FoodRepository.java` - Nutritionist-scoped queries with filters
- `backend/src/main/java/com/nutriai/api/service/FoodService.java` - Food CRUD with nutritionist isolation
- `backend/src/main/java/com/nutriai/api/controller/FoodController.java` - 5 REST endpoints at /api/v1/foods
- `backend/src/main/java/com/nutriai/api/dto/food/` - CreateFoodRequest, UpdateFoodRequest, FoodResponse, FoodPortionDto
- `backend/src/main/java/com/nutriai/api/service/MealPlanService.java` - Plan CRUD, macro calculation, auto-creation
- `backend/src/main/java/com/nutriai/api/controller/PlanController.java` - 14 REST endpoints under /patients/{id}/plan
- `backend/src/main/java/com/nutriai/api/dto/plan/` - 9 DTOs for plan structure and mutations
- `backend/src/main/java/com/nutriai/api/service/PatientService.java` - Added MealPlanService injection for auto-creation

## Decisions Made
- Removed `@OneToMany(mappedBy=...)` from entities using raw UUID FKs — JPA can't manage cascade without `@ManyToOne` back-reference; DB-level ON DELETE CASCADE + service-layer cascade instead
- Service-layer cascade: `deleteAllByX()` repository methods for explicit child deletion before parent
- Plan nested under patient path (`/patients/{patientId}/plan`) for contextual ownership verification
- Macro calculation: `BigDecimal` arithmetic with `HALF_UP` rounding, scale=1

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed broken @OneToMany(mappedBy) on raw UUID FK entities**
- **Found during:** Task 1 (entity creation)
- **Issue:** `@OneToMany(mappedBy = "foodId", cascade = CascadeType.ALL)` on Food entity expects a `@ManyToOne` back-reference named `foodId` in FoodPortion, but `foodId` is a raw UUID column — JPA cannot manage the relationship, causing cascade delete tests to fail
- **Fix:** Removed all `@OneToMany(mappedBy=...)` collections from entities using raw UUID FKs (Food, MealPlan, MealSlot, MealOption). Added service-layer cascade methods (`deleteAllByFoodId`, `deleteAllByPlanId`, etc.) to repositories. Updated repository tests to use service-layer cascade pattern.
- **Files modified:** Food.java, MealPlan.java, MealSlot.java, MealOption.java, FoodPortionRepository.java, MealFoodRepository.java, MealOptionRepository.java, MealSlotRepository.java, PlanExtraRepository.java, FoodAndPlanRepositoryTest.java
- **Verification:** All 10 repository tests pass
- **Committed in:** d9d1355 (Task 1 commit)

**2. [Rule 3 - Blocking] Added MealPlanService mock to PatientServiceTest**
- **Found during:** Task 3 (meal plan service integration with PatientService)
- **Issue:** PatientService constructor changed to inject MealPlanService, but existing PatientServiceTest didn't mock the new dependency, causing NullPointerException
- **Fix:** Added `@Mock MealPlanService mealPlanService` to PatientServiceTest
- **Files modified:** PatientServiceTest.java
- **Verification:** All PatientServiceTest tests pass
- **Committed in:** c5d3b08 (Task 3 commit)

---

**Total deviations:** 2 auto-fixed (1 bug, 1 blocking)
**Impact on plan:** Both fixes essential for correctness and buildability. No scope creep.

## Issues Encountered
- Repository cascade tests in H2 `@DataJpaTest` can't leverage DB-level ON DELETE CASCADE since Flyway is disabled in test profile — resolved by using service-layer cascade pattern in tests

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Backend fully ready for frontend integration in Plan 02
- Food catalog API: POST/GET/PATCH/DELETE at /api/v1/foods
- Meal plan API: 14 endpoints at /api/v1/patients/{patientId}/plan/...
- Auto-creation verified: POST /api/v1/patients creates patient + episode + 6-meal plan
- Macro calculation verified: BASE foods calculate per100 × grams / 100, PRESET uses direct values

---
*Phase: 05-meal-plans-food-catalog*
*Completed: 2026-04-22*

## Self-Check: PASSED