# Phase 5: Meal Plans & Food Catalog — Research

**Phase:** 05
**Researched:** 2026-04-22
**Discovery Level:** 1 (Quick Verification — all patterns established from Phases 1-4)

## Executive Summary

Phase 5 requires no new external dependencies. The entire tech stack is established from prior phases. The main technical challenges are: (1) macro calculation on the backend (per100 × grams / 100 with frozen storage), (2) auto-save with optimistic updates via TanStack Query mutations, and (3) plan auto-creation orchestration when a patient is created.

## Standard Stack

| Layer | Technology | Version | Status | Notes |
|-------|-----------|---------|--------|-------|
| Backend | Java + Spring Boot | 3.x + JDK 21 | ✅ Established | Layers: controller → service → repository → model |
| ORM | JPA/Hibernate | 6.x | ✅ Established | @Getter/@Setter (not @Data), UUID PKs, @PrePersist timestamps |
| Database | PostgreSQL | 16 | ✅ Established | Flyway migrations (V1-V4 done, V5 next) |
| Frontend | React + TypeScript | 18 + 5.x | ✅ Established | Vite 6 + Tailwind 4 |
| State | Zustand + TanStack Query | 5 + 5 | ✅ Established | UI state in Zustand, server state in TanStack Query |
| API | Axios + JWT | 1.x | ✅ Established | apiClient with 401 refresh interceptor |
| Auth | Spring Security + JWT | 6.x | ✅ Established | NutritionistAccess.getCurrentNutritionistId() |
| Testing (back) | JUnit 5 + Mockito | 5 + 5 | ✅ Established | @SpringBootTest + @WebMvcTest |
| Testing (front) | Vitest + Testing Library | 3 + 14 | ✅ Established | jsdom environment |

## Architecture Patterns (from Prior Phases)

### Backend Pattern
```
controller → service → repository → model
```
- **Entities**: `@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor @Entity` with UUID PKs, `@PrePersist/@PreUpdate` for timestamps
- **Repositories**: Spring Data JPA with `@Query` for filtered/scoped queries
- **Services**: Take `nutritionistId` first parameter for data isolation
- **Controllers**: REST with `/api/v1` prefix, `ApiResponse<T>` wrapper
- **DTOs**: Separate request/response DTOs, mapping in service layer
- **Validation**: `@Valid` on controllers, `@Min`/`@NotNull` on request DTOs
- **Errors**: GlobalExceptionHandler for `IllegalArgumentException` → 400, `DataIntegrityViolation` → 409

### Frontend Pattern
```
api module → Zustand store (UI) + TanStack Query hooks (server) → Views
```
- **API modules**: Functions calling `apiClient` (axios), exporting request/response types
- **Stores**: `usePatientUIStore` pattern — Zustand for filters, modals, pagination state
- **Hooks**: `useQuery` for reads, `useMutation` for writes with `queryClient.invalidateQueries` on success
- **Views**: Consume hooks, render loading/error states
- **Types**: Separate type files per domain (`types/patient.ts`, `types/plan.ts`, etc.)

### Data Isolation Pattern (from Phase 4)
- Repository-level filtering by `nutritionistId`
- `NutritionistAccess.getCurrentNutritionistId()` in service layer
- 404 (not 403) for wrong nutritionist to prevent ID enumeration

## Key Technical Challenges

### 1. Macro Calculation (Backend)

**Decision D-20**: Backend calculates ALL macros. Frontend never calculates.

**Algorithm**: 
```
frozenKcal = food.per100.kcal * grams / 100
frozenProt = food.per100.prot * grams / 100
frozenCarb = food.per100.carb * grams / 100
frozenFat = food.per100.fat * grams / 100
```

**Frozen storage**: MealFood rows store kcal, prot, carb, fat at the moment of addition. When a food's per100 data is edited in the catalog, existing plans keep their frozen values (D-10).

**Implementation**: The service method `addFoodItem(foodId, grams, qty)` looks up the Food entity, calculates macros from per100 data, and stores the frozen values in the MealFood row.

### 2. Auto-Save with Optimistic Updates (Frontend)

**Decision D-18**: Each edit action saves immediately via API. No bulk Save button.

**Pattern**: Use TanStack Query `useMutation` with `onMutate` (optimistic update), `onError` (revert + toast), `onSuccess` (confirm). This is the standard TanStack Query optimistic update pattern.

**Implementation approach**:
```typescript
useMutation({
  mutationFn: (data) => apiClient.patch(`/patients/${id}/plan/meals/${mealId}/options/${optId}/items/${itemId}`, data),
  onMutate: async (data) => {
    await queryClient.cancelQueries({ queryKey: ['plan', patientId] });
    const previous = queryClient.getQueryData(['plan', patientId]);
    // Apply optimistic update to cached plan
    queryClient.setQueryData(['plan', patientId], (old) => applyOptimisticUpdate(old, data));
    return { previous };
  },
  onError: (err, data, context) => {
    queryClient.setQueryData(['plan', patientId], context.previous);
    showToast('Erro ao salvar — tente novamente');
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['plan', patientId] });
  },
});
```

**Save status indicator**: Track a `saveStatus: 'saved' | 'saving' | 'error'` state in the planStore. Set to 'saving' on mutation start, 'saved' on success, 'error' on failure with auto-revert to 'saved' after 3s.

### 3. Plan Auto-Creation (Backend Orchestration)

**Decision D-13, D-14**: Plan is auto-created when a patient is created, with 6-meal template.

**Implementation**: In `PatientService.createPatient()`, after creating the patient + episode, call `MealPlanService.createDefaultPlan(episodeId, nutritionistId)`. This creates a MealPlan with 6 MealSlot entries (Café da manhã, Lanche manhã, Almoço, Lanche tarde, Jantar, Ceia), each with one empty MealOption.

**Macro targets**: Default total targets can be simple placeholders (e.g., kcal=1800, prot=90, carb=200, fat=60) that the nutritionist customizes. Auto-calculation from biometrics is deferred.

### 4. Preset Foods

**Decision D-09**: Preset foods are pre-calculated portions (e.g., "Omelete 2 ovos"). They reference base foods but store their own macros directly.

**Schema**: Preset foods have `type='PRESET'`, store `grams` directly, and have `nutrition` values (not per100). When adding a preset to a plan, use the preset's `grams` + `nutrition` directly (no per100 calculation).

### 5. Episode-Plan Linkage

**Decision D-13, D-02**: One MealPlan per Episode. Plan links to `episode_id` (not `patient_id` directly).

**Implementation**: MealPlan has FK to Episode. The `GET /patients/{id}/plan` endpoint resolves the current active episode and returns its plan. This ensures plan lifecycle follows episode lifecycle.

## Entity Model

```
Food (food_catalog table)
├── id: UUID (PK)
├── nutritionist_id: UUID (FK → nutritionist, NOT NULL)
├── type: VARCHAR(10) — 'BASE' or 'PRESET'
├── name: VARCHAR(200)
├── category: VARCHAR(50)
├── per100_kcal: DECIMAL(8,1) — nullable, BASE only
├── per100_prot: DECIMAL(8,1) — nullable, BASE only
├── per100_carb: DECIMAL(8,1) — nullable, BASE only
├── per100_fat: DECIMAL(8,1) — nullable, BASE only
├── per100_fiber: DECIMAL(8,1) — nullable, BASE only
├── preset_grams: DECIMAL(8,1) — nullable, PRESET only
├── preset_kcal: DECIMAL(8,1) — nullable, PRESET only
├── preset_prot: DECIMAL(8,1) — nullable, PRESET only
├── preset_carb: DECIMAL(8,1) — nullable, PRESET only
├── preset_fat: DECIMAL(8,1) — nullable, PRESET only
├── portion_label: VARCHAR(200) — nullable, PRESET display text
├── used_count: INTEGER — denormalized count for "usado em N planos"
├── created_at: TIMESTAMP
└── updated_at: TIMESTAMP

FoodPortion (food_portion table)
├── id: UUID (PK)
├── food_id: UUID (FK → food_catalog)
├── name: VARCHAR(100) — "1 colher de sopa", "1 unidade"
├── grams: DECIMAL(8,1) — 20, 120
├── sort_order: INTEGER
└── created_at: TIMESTAMP

MealPlan (meal_plan table)
├── id: UUID (PK)
├── episode_id: UUID (FK → episode, UNIQUE) — 1:1 with episode
├── nutritionist_id: UUID (FK → nutritionist)
├── title: VARCHAR(200) — "Plano alimentar"
├── notes: TEXT — observations
├── kcal_target: DECIMAL(8,1)
├── prot_target: DECIMAL(8,1)
├── carb_target: DECIMAL(8,1)
├── fat_target: DECIMAL(8,1)
├── created_at: TIMESTAMP
└── updated_at: TIMESTAMP

MealSlot (meal_slot table)
├── id: UUID (PK)
├── plan_id: UUID (FK → meal_plan)
├── label: VARCHAR(100) — "Café da manhã"
├── time: VARCHAR(5) — "07:00"
├── sort_order: INTEGER
├── created_at: TIMESTAMP
└── updated_at: TIMESTAMP

MealOption (meal_option table)
├── id: UUID (PK)
├── meal_slot_id: UUID (FK → meal_slot)
├── name: VARCHAR(100) — "Opção 1 · Clássico"
├── sort_order: INTEGER
├── created_at: TIMESTAMP
└── updated_at: TIMESTAMP

MealFood (meal_food table)
├── id: UUID (PK)
├── option_id: UUID (FK → meal_option)
├── food_id: UUID (FK → food_catalog, nullable — allows free-text foods)
├── food_name: VARCHAR(200) — frozen display text
├── qty: VARCHAR(200) — free-text "1 unidade"
├── grams: DECIMAL(8,1) — numeric for calculation
├── prep: VARCHAR(200) — "grelhado"
├── kcal: DECIMAL(8,1) — frozen macro
├── prot: DECIMAL(8,1) — frozen macro
├── carb: DECIMAL(8,1) — frozen macro
├── fat: DECIMAL(8,1) — frozen macro
├── sort_order: INTEGER
├── created_at: TIMESTAMP
└── updated_at: TIMESTAMP

PlanExtra (plan_extra table)
├── id: UUID (PK)
├── plan_id: UUID (FK → meal_plan)
├── name: VARCHAR(200)
├── quantity: VARCHAR(200) — "350ml · lata"
├── kcal: DECIMAL(8,1)
├── prot: DECIMAL(8,1)
├── carb: DECIMAL(8,1)
├── fat: DECIMAL(8,1)
├── sort_order: INTEGER
├── created_at: TIMESTAMP
└── updated_at: TIMESTAMP
```

## API Design

### Food Catalog
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/foods?page=0&size=12&search=&category=` | List foods (scoped to nutritionist) |
| POST | `/api/v1/foods` | Create food |
| PATCH | `/api/v1/foods/{id}` | Update food |
| DELETE | `/api/v1/foods/{id}` | Delete food |

### Meal Plan
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/patients/{id}/plan` | Get current episode's plan |
| PATCH | `/api/v1/patients/{id}/plan` | Update plan-level (title, targets, notes) |
| POST | `/api/v1/patients/{id}/plan/meals` | Add meal slot |
| PATCH | `/api/v1/patients/{id}/plan/meals/{mealId}` | Update meal slot (label, time) |
| DELETE | `/api/v1/patients/{id}/plan/meals/{mealId}` | Remove meal slot |
| POST | `/api/v1/patients/{id}/plan/meals/{mealId}/options` | Add option |
| PATCH | `/api/v1/patients/{id}/plan/meals/{mealId}/options/{optionId}` | Rename option |
| DELETE | `/api/v1/patients/{id}/plan/meals/{mealId}/options/{optionId}` | Remove option |
| POST | `/api/v1/patients/{id}/plan/meals/{mealId}/options/{optionId}/items` | Add food item |
| PATCH | `/api/v1/patients/{id}/plan/meals/{mealId}/options/{optionId}/items/{itemId}` | Update food item |
| DELETE | `/api/v1/patients/{id}/plan/meals/{mealId}/options/{optionId}/items/{itemId}` | Remove food item |
| POST | `/api/v1/patients/{id}/plan/extras` | Add extra |
| PATCH | `/api/v1/patients/{id}/plan/extras/{extraId}` | Update extra |
| DELETE | `/api/v1/patients/{id}/plan/extras/{extraId}` | Remove extra |

## Don't Hand-Roll
- **Macro calculation**: Simple arithmetic (per100 × grams / 100). Use BigDecimal for precision, or use double with reasonable rounding (2 decimal places). Postgrest DECIMAL columns handle storage precision.
- **Auto-save**: Use TanStack Query's built-in mutation lifecycle. Don't build a custom queue system.
- **Optimistic updates**: Use TanStack Query's onMutate/onError pattern. Don't build a custom diff/patch system.
- **Data isolation**: Follow the exact same repository pattern from Phase 4 (nutritionistId filtering in queries).

## Common Pitfalls
1. **Cascade delete**: Removing a meal slot should cascade to its options and food items. Use `ON DELETE CASCADE` in the migration or handle in service.
2. **Orphan removal**: When a food item's `foodId` references a deleted catalog food, the plan item survives (frozen macros + foodName). The `food_id` FK should be nullable and `ON DELETE SET NULL`.
3. **Ordering**: All lists (meals, options, items, extras) need `sort_order` integer columns to maintain user-arranged order.
4. **Pagination**: Food catalog uses server-side pagination. Don't load all foods at once — could be hundreds of items per nutritionist.
5. **N+1 queries**: The `GET /patients/{id}/plan` endpoint returns the full plan tree (plan → meals → options → items + extras). Use JPA `JOIN FETCH` or `@EntityGraph` to avoid N+1.
6. **Macro rounding**: Use `Math.round(value * 10) / 10.0` for 1-decimal precision. Store as DECIMAL(8,1) in PostgreSQL.

## Validation Architecture

### Test Dimensions

| Dimension | What to Validate | Method |
|-----------|-----------------|--------|
| 1. Macro accuracy | per100 × grams / 100 = stored frozen values | Unit test (service) |
| 2. Data isolation | Nutritionist A cannot see/modify Nutritionist B's plans or foods | Integration test (controller) |
| 3. Plan-Episode linkage | 1 plan per episode, plan lifecycle follows episode | Unit test (service) |
| 4. Frozen macros | Editing food in catalog does NOT update existing plan macros | Unit test (service) |
| 5. Auto-creation | Patient creation → episode → plan with 6-meal template | Integration test |
| 6. CRUD completeness | All endpoints work: create, read, update, delete for each entity | Integration test (controller) |
| 7. Pagination | Food catalog returns correct page/size/total | Unit test (repository) |
| 8. Frontend API wiring | Views call real API, show loading/error states | Component test + E2E |