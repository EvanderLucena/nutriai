# Phase 06 Pattern Map

Mapped on 2026-04-24 for dashboard + biometry work.

## Frontend query/store/view wiring

Use the same split already established in patient and plan code:

- API module owns HTTP calls and unwraps the backend envelope.
  - Pattern: `frontend/src/api/patients.ts:37-65`
  - Pattern: `frontend/src/api/plans.ts:63-218`
  - Rule: return `response.data.data`, not the full Axios response.

- Zustand store holds local UI state only; TanStack Query hooks live beside that store.
  - Pattern: `frontend/src/stores/patientStore.ts:7-67`
  - Pattern: `frontend/src/stores/planStore.ts:10-78`
  - Rule: put filters, selected tab/metric, modal state, and “pending action” flags in Zustand. Put server fetch/mutation hooks in the same store file.

- Query hooks use stable array keys and `enabled` guards for id-driven pages.
  - Pattern: `frontend/src/stores/patientStore.ts:45-79`
  - Pattern: `frontend/src/stores/planStore.ts:67-78`
  - Rule: for Phase 06 use keys like `['dashboard']`, `['patient-biometry', patientId]`, `['patient-history', patientId]`, `['episode-history', patientId, episodeId]`.

- Mutations invalidate the relevant queries and surface toast errors from `toastStore`.
  - Pattern: `frontend/src/stores/patientStore.ts:81-137`
  - Pattern: `frontend/src/stores/planStore.ts:45-65, 82-402`
  - Rule: follow patient-store style for simple CRUD; only add optimistic updates if the UX clearly benefits, as in plan editing.

- Views consume hooks directly and map API DTOs into screen-ready objects before rendering.
  - Pattern: `frontend/src/views/HomeView.tsx:138-170`
  - Pattern: `frontend/src/views/PatientView.tsx:14-41`
  - Rule: Phase 06 should replace remaining mock dashboard/biometry data by wiring hooks into the existing view shell instead of redesigning it.

- Reuse the existing biometry UI shell and chart primitives.
  - Pattern: `frontend/src/views/PatientView.tsx:258-399`
  - Pattern: `frontend/src/components/patient/NewBiometryModal.tsx:21-100`
  - Rule: preserve the “Preencha só o que tiver disponível” flow, keep the single-form structure, and keep charts on `LineChart` / `MultiLineChart`.

## API envelope handling

- Non-auth endpoints return wrapped JSON with `success` + `data`.
  - Backend source: `backend/src/main/java/com/nutriai/api/dto/ApiResponse.java:11-33`
  - Frontend consumption: `frontend/src/api/patients.ts:37-65`, `frontend/src/api/plans.ts:63-218`

- Axios interceptor normalizes backend errors to `{ success, message, errors, status }`.
  - Pattern: `frontend/src/api/client.ts:44-103`
  - Rule: new Phase 06 API modules should rely on this centralized behavior; do not add endpoint-specific error parsing in views.

- Validation and generic failures come back as `success: false` payloads from the global handler.
  - Pattern: `backend/src/main/java/com/nutriai/api/exception/GlobalExceptionHandler.java:23-111`
  - Rule: frontend forms should read `message` and optional `errors` without assuming auth-style direct DTOs.

## Backend controller/service/repository conventions

- Controller pattern: `@RestController`, `/api/v1/...`, `@PreAuthorize("hasRole('NUTRITIONIST')")`, resolve nutritionist id via `NutritionistAccess`, wrap success with `ApiResponse.ok(...)`.
  - Pattern: `backend/src/main/java/com/nutriai/api/controller/PatientController.java:17-81`
  - Pattern: `backend/src/main/java/com/nutriai/api/controller/PlanController.java:14-174`
  - Rule: dashboard and biometry controllers should follow the patient/plan style, not auth-controller style.

- Service pattern: transactional application logic, ownership check first, then mutate/load, then map DTO.
  - Pattern: `backend/src/main/java/com/nutriai/api/service/PatientService.java:46-170`
  - Pattern: `backend/src/main/java/com/nutriai/api/service/MealPlanService.java:91-415`
  - Rule: biometry should attach to the active episode, using the same active-episode lookup style as meal plans (`findTopByPatientIdAndEndDateIsNullOrderByStartDateDesc`).

- Ownership and tenant isolation are enforced in repository lookups and service guards.
  - Pattern: `backend/src/main/java/com/nutriai/api/repository/PatientRepository.java:39-56`
  - Pattern: `backend/src/main/java/com/nutriai/api/service/MealPlanService.java:334-397`
  - Rule: every Phase 06 read/write must be scoped to the nutritionist, either via repository signature or explicit service verification.

- Repository pattern: Spring Data interface first, add explicit query methods only when filtering/ordering is needed.
  - Pattern: `backend/src/main/java/com/nutriai/api/repository/PatientRepository.java:17-56`
  - Pattern: `backend/src/main/java/com/nutriai/api/repository/EpisodeRepository.java:11-24`
  - Rule: for dashboard aggregates and episode history, prefer clear repository methods like “find active episode”, “find episodes by patient ordered desc”, and scoped aggregate queries.

## Migration naming style

- Use monotonic Flyway versioning with descriptive snake-case names.
  - Pattern: `V4__create_patient_and_episode_tables.sql`
  - Pattern: `V5__create_meal_plan_and_food_catalog_tables.sql`
  - Pattern: `V7__add_patient_details_fields.sql`
  - Pattern: `V12__rename_meal_food_amount_to_reference_amount.sql`

- Migration files include short header comments and then direct DDL/DDL+backfill.
  - Pattern: `backend/src/main/resources/db/migration/V4__create_patient_and_episode_tables.sql:1-38`
  - Pattern: `backend/src/main/resources/db/migration/V7__add_patient_details_fields.sql:1-10`
  - Rule: Phase 06 biometry migrations should read like `V13__create_biometry_tables.sql` or `V13__add_episode_biometry_tables.sql`, with indexes and any required backfill inline.

## Test organization patterns

- Frontend store tests are lightweight state-transition tests with mocked query hooks.
  - Pattern: `frontend/src/stores/patientStore.test.ts:1-131`
  - Pattern: `frontend/src/stores/planStore.test.ts:1-163`
  - Rule: add a biometry/dashboard UI store test if Phase 06 introduces new Zustand state.

- Frontend view tests mock the store hooks and assert visible domain content.
  - Pattern: `frontend/src/views/PlansView.test.tsx:13-109`
  - Rule: for dashboard + patient biometry views, mock the Phase 06 hooks and assert render states, required labels, and empty/error states in pt-BR.

- Backend controller tests are `@SpringBootTest + @AutoConfigureMockMvc + @Transactional` integration-style tests.
  - Pattern: `backend/src/test/java/com/nutriai/api/controller/PatientControllerTest.java:31-230`
  - Pattern: `backend/src/test/java/com/nutriai/api/controller/PlanControllerTest.java:28-233`
  - Rule: create records through real endpoints/services, assert JSON envelope shape, and include cross-nutritionist 404 coverage.

- Backend service tests are Mockito unit tests focused on orchestration and invariants.
  - Pattern: `backend/src/test/java/com/nutriai/api/service/PatientServiceTest.java:25-250`
  - Rule: biometry service tests should verify active-episode binding, partial update behavior, and no access across nutritionists.

- Backend repository tests are `@DataJpaTest` and focus on isolation/filter semantics.
  - Pattern: `backend/src/test/java/com/nutriai/api/repository/PatientRepositoryTest.java:21-236`
  - Rule: add repository tests for episode history ordering and nutritionist-scoped aggregate queries.

## Highest-value analogs for Phase 06

- Dashboard wiring: `frontend/src/views/HomeView.tsx`, `frontend/src/stores/patientStore.ts`
- Active patient workspace: `frontend/src/views/PatientView.tsx`
- Complex nested episode-owned data flow: `frontend/src/api/plans.ts`, `frontend/src/stores/planStore.ts`, `backend/src/main/java/com/nutriai/api/controller/PlanController.java`, `backend/src/main/java/com/nutriai/api/service/MealPlanService.java`
- Episode lifecycle and isolation: `backend/src/main/java/com/nutriai/api/service/PatientService.java`, `backend/src/main/java/com/nutriai/api/repository/EpisodeRepository.java`, `backend/src/main/java/com/nutriai/api/repository/PatientRepository.java`
