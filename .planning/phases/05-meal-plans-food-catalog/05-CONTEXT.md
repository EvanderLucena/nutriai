# Phase 5: Meal Plans & Food Catalog - Context

**Gathered:** 2026-04-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Nutritionists can create and manage complete meal plans using the food catalog. This covers: meal plan CRUD (one plan per patient episode), food catalog (base per-100g items + portioned presets), automatic macro calculation (backend calculates from per100 data, freezes in plan), multiple options per meal slot, and extras (simple reference foods outside formal meals). Plans are auto-generated with a 6-meal template when a patient is created, and edited in-place within the PatientView Plans tab.

</domain>

<decisions>
## Implementation Decisions

### Meal Plan Data Model
- **D-01:** MealFood rows reference the Food catalog via `foodId`. Macros are auto-calculated from the food's `per100` data × grams. When a food is edited in the catalog, existing plans keep their frozen macros (no auto-update).
- **D-02:** One plan per patient episode. No versioning — plans are edited in-place. The episode model from Phase 4 provides the lifecycle: patient created → episode opened → plan auto-created → episode closed → plan preserved in history.
- **D-03:** Meals are predefined slots within the plan (café da manhã, lanche manhã, almoço, lanche tarde, jantar, ceia). Nutritionists can add/remove slots.
- **D-04:** Multiple options per meal slot (Opção 1 Clássico, Opção 2 Peixe, etc.). Each option is a named list of MealFood items.
- **D-05:** MealFood fields: `foodId` (catalog reference), `foodName` (display text, frozen), `qty` (free-text, human-readable like "4 col. sopa"), `grams` (numeric, for calculation), `prep` (preparation notes like "grelhado"), frozen macro values (`kcal`, `prot`, `carb`, `fat`).
- **D-06:** Display shows medida caseira + gramas: "Banana · 1 unidade (120g)". Patient reads the portion name, system uses grams for calculation.
- **D-07:** Portion references from base foods (1 colher de sopa = 20g, 1 unidade = 50g) serve as quick-fill shortcuts. Nutritionist picks a portion or types grams directly. All calculation rolls through grams → per100 data.

### Food Catalog & Macros
- **D-08:** Food catalog is private per nutritionist (isolated by `nutritionist_id`). Same isolation pattern as patients (D-10 from Phase 4).
- **D-09:** Two food types preserved from prototype: **Base** (per-100g nutrition data + portion references) and **Preset** (pre-calculated portion like "Omelete 2 ovos + queijo branco", references one or more base foods). Both editable by the nutritionist.
- **D-10:** When a food's per100 data is edited in the catalog, existing plans keep their frozen macro values. Macros are frozen at the moment a food is added to a plan. No cascade update.

### Extras
- **D-11:** Extras are a simple list of food items in the plan, with just name + qty + macros. No "authorized/not authorized" framing, no AI notes, no categories. The framing is reference foods for the diet, not restrictions. The AI uses extras as context (Phase 7) but with a harm-reduction approach, not restrictions.
- **D-12:** Extra items store: name, quantity, macros (kcal, prot, carb, fat). No separate category or AI note field.

### Plan-Patient Linking
- **D-13:** One MealPlan per Episode. Plan is auto-created when a patient is created (episode opened). Plan follows episode lifecycle: created with patient, preserved when episode closes, new episode = new plan.
- **D-14:** New plans start with a template of 6 meal slots: Café da manhã (07:00), Lanche manhã (10:00), Almoço (12:30), Lanche tarde (15:30), Jantar (19:30), Ceia (22:00). Macro targets distributed proportionally based on patient's objective. Nutritionist can add/remove/rename slots.
- **D-15:** Plan lives inside PatientView's Plans tab. No standalone Plans page in the sidebar. The plan is contextual to the patient — you enter a patient, go to the Plan tab, and edit.
- **D-16:** Each plan has total daily macro targets (kcal, prot, carb, fat) and per-meal macro targets. Both are editable. Macro targets on the plan level can differ from one episode to another.

### API & Store Design
- **D-17:** CRUD endpoints for Food catalog and MealPlan components:
  - `GET/POST/PATCH/DELETE /api/v1/foods` — food catalog (scoped per nutritionist)
  - `GET /api/v1/patients/{id}/plan` — current episode's plan
  - `PATCH /api/v1/patients/{id}/plan` — update plan-level targets
  - `POST/PATCH/DELETE /api/v1/patients/{id}/plan/meals` — meal slots
  - `POST/PATCH/DELETE /api/v1/patients/{id}/plan/meals/{mealId}/options` — meal options
  - `POST/PATCH/DELETE /api/v1/patients/{id}/plan/meals/{mealId}/options/{optionId}/items` — food items in an option
  - `POST/PATCH/DELETE /api/v1/patients/{id}/plan/extras` — extras
- **D-18:** Auto-save per action — each edit (add food, change qty, remove meal) saves immediately via API. No bulk Save button. Discrete toast confirmation on success.
- **D-19:** Zustand for UI state (active meal tab, selected option, modal state) + TanStack Query for server data (plan, food catalog). Same pattern as auth and patients stores.
- **D-20:** Backend calculates all macros. Frontend sends `foodId` + `grams`, backend looks up per100 data, calculates macros (per100 × grams / 100), and returns/store frozen macro values in the MealFood row. Frontend never calculates macros.

### OpenCode's Discretion
- Exact entity names, column types, and JPA mappings for MealPlan, MealSlot, MealOption, MealFood, PlanExtra
- Flyway migration V5 for meal plan schema
- TanStack Query hook structure (usePlan, useFoodCatalog, etc.)
- planStore (Zustand) internal shape
- Toast/notification component for auto-save confirmations
- Meal template initialization logic (how to distribute macros by objective)
- Food search/pagination UX details
- Error handling patterns for API failures during auto-save

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project requirements
- `.planning/REQUIREMENTS.md` — PLAN-01, PLAN-02, PLAN-03, PLAN-04, PLAN-05 are the requirements for this phase
- `.planning/ROADMAP.md` §Phase 5 — Success criteria and phase boundary
- `.planning/PROJECT.md` — Tech stack constraints, food portioning decisions, meal plan editor scope

### Prior phase context
- `.planning/phases/01-monorepo-infrastructure/01-CONTEXT.md` — Decisions: layered architecture, /api/v1/ prefix, Flyway migrations, Zustand for state, React Router v7, TanStack Query
- `.planning/phases/04-patient-management/04-CONTEXT.md` — Decisions: Episode model, patient-plan linkage (1 plan per episode), data isolation by nutritionist_id, server-side pagination, soft-delete

### Existing codebase (prototype — migration source)
- `frontend/src/views/PlansView.tsx` — Current meal plan editor with inline editing, options, extras, macro totals
- `frontend/src/views/FoodsView.tsx` — Current food catalog view with base/preset cards, search, pagination
- `frontend/src/types/plan.ts` — MealFood, MealOption, MealSlot, PlanExtra type definitions
- `frontend/src/types/food.ts` — Food, FoodPer100, FoodPortion, FoodType, FoodCategory type definitions
- `frontend/src/data/foods.ts` — FOODS_CATALOG mock data (12 base + 5 presets)
- `frontend/src/components/plan/` — AddFoodModal, AddMealModal, EditFoodModal, PlanFoodRow components

### Existing codebase (backend — integration points)
- `backend/.../model/Patient.java` — Patient entity with Episode relationship
- `backend/.../model/Episode.java` — Episode entity (plan links to episode, not directly to patient)
- `backend/.../auth/NutritionistAccess.java` — getCurrentNutritionistId() for repository-level filtering
- `backend/.../controller/PatientController.java` — REST endpoint pattern reference
- `backend/.../model/Nutritionist.java` — Nutritionist entity (food catalog is scoped here)
- `backend/src/main/resources/db/migration/` — Flyway migrations V1-V4 (next is V5)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `frontend/src/views/PlansView.tsx` — Full meal plan editor with inline editing, options, extras, macro totals. All UI patterns present (add/remove meal, add/remove option, add food from catalog, edit food inline, daily macro totals with percentage indicators).
- `frontend/src/views/FoodsView.tsx` — Food catalog with base/preset card display, search, category filter, pagination, edit/delete modals.
- `frontend/src/types/plan.ts` — MealFood, MealOption, MealSlot, PlanExtra TypeScript types. Need modification to add `foodId`, `grams` fields.
- `frontend/src/types/food.ts` — Food, FoodPer100, FoodPortion, FoodCategory types. Need modification for API response shapes.
- `frontend/src/data/foods.ts` — FOODS_CATALOG mock data. Serves as reference for seed data and API response shape.
- `frontend/src/components/plan/` — AddFoodModal, AddMealModal, EditFoodModal, PlanFoodRow — UI components ready for API wiring.
- `frontend/src/components/viz/MacroRings.tsx` — Macro visualization component, will display real plan macros.
- `frontend/src/stores/patientStore.ts` — Zustand store pattern (reference for planStore).
- `frontend/src/api/client.ts` — Axios instance with JWT interceptor (base for plan/food API calls).

### Established Patterns
- Zustand store + TanStack Query hooks pattern (authStore, patientStore) — apply to planStore and foodCatalog store
- Axios client with JWT interceptor and 401 refresh — same pattern for all new API calls
- Flyway versioned SQL migrations (V1-V4) — next is V5 for meal plan schema
- Spring Boot layered architecture: controller → service → repository → model
- Nutritionist-scoped data isolation via repository-level filtering (D-10 from Phase 4)
- Server-side pagination with page/size/total response shape
- React Router v7 for client-side routing
- Nutritionist entity has `patientLimit` field — relevant for future billing enforcement

### Integration Points
- Frontend: apiClient at /api/v1 — add plan and food endpoints following existing patterns
- Backend: Episode entity — MealPlan links to episode_id (not patient_id directly), ensuring 1:1 plan per episode
- Backend: NutritionistAccess.getCurrentNutritionistId() — inject into food catalog and plan repository queries for data isolation
- Database: V5 Flyway migration — creates meal_plan, meal_slot, meal_option, meal_food, plan_extra, and food_catalog tables
- Navigation: PlansView is rendered as a tab inside PatientView — plan is loaded via usePatient(id) hook context
- Patient creation: Plan auto-creation happens after patient+episode creation (service-level orchestration)

</code_context>

<specifics>
## Specific Ideas

- Portion references (1 colher de sopa = 20g, 1 unidade = 50g) convert to grams for calculation — display shows "1 unidade (120g)" for patient readability
- Plan auto-created with 6-meal template when patient is created. Template slots: Café da manhã (07:00), Lanche manhã (10:00), Almoço (12:30), Lanche tarde (15:30), Jantar (19:30), Ceia (22:00)
- Macro targets on the plan distributed proportionally based on patient objective (e.g., emagrecimento = higher protein, lower carb)
- Extras are simple reference foods — no "authorized/not authorized" framing, no AI notes, no categories. The AI will use them as context for harm-reduction approach (Phase 7)
- MealFood rows freeze macros at add-time — editing a food in the catalog does NOT update existing plans
- "1 unidade banana" displays as "Banana · 1 unidade (120g)" — medida caseira for readability, grams for calculation

</specifics>

<deferred>
## Deferred Ideas

- Import TACO database — catalog starts with nutritionist-created entries; TACO import is P2 (already noted in TASKS.md as out of scope)
- AI notes on extras — deferred to Phase 7 (WhatsApp Intelligence) where the AI will use extras as context
- Macro target auto-calculation from patient biometrics — nice-to-have, can be added later
- Meal plan PDF export — noted in TASKS.md as out of scope
- Food catalog sharing between nutritionists — could be a future feature (global TACO base)
- Ingredient-level recipe construction (combining base foods into complex meals) — presets cover this for v1; full recipe builder is v2

</deferred>

---

*Phase: 05-meal-plans-food-catalog*
*Context gathered: 2026-04-21*