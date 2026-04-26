# Phase 06: Dashboard & Biometry - Research

**Researched:** 2026-04-24
**Status:** Ready for planning

## Executive Summary

Phase 06 should be implemented as an episode-scoped clinical data expansion, not as a generic patient-metrics feature. The cleanest path is:

1. Add a dedicated biometry aggregate tied to `episode_id`, with one header record per assessment and child rows for skinfold/perimetry measures.
2. Expose two backend surfaces:
   - dashboard aggregate endpoint for portfolio-level KPI cards + recent evaluations
   - patient biometry/history endpoints for active-episode editing and closed-episode read-only inspection
3. Reuse the current frontend split:
   - `HomeView` becomes a real-data clinical overview
   - `PatientView` keeps `Biometria` for the active episode
   - `Histórico` becomes closed-episode inspection only
4. Slice planning into backend foundation first, then frontend wiring/history UI second, with verification/E2E covered in the frontend-facing plan.

This phase does not need a redesign. The codebase already has the right architectural seams in patient/plan flows and enough chart primitives to support the intended UX.

## Research Findings

### 1. Data model should be episode-owned

The existing domain already establishes episode lifecycle:

- `EpisodeRepository.findTopByPatientIdAndEndDateIsNullOrderByStartDateDesc(...)` gives the active clinical cycle.
- `PatientService.deactivatePatient(...)` closes the active episode.
- `PatientService.reactivatePatient(...)` opens a new episode and auto-creates a plan.

That means biometry should attach to `episode_id`, not directly to `patient_id`, so historical inspection naturally follows the same cycle boundary as plans.

Recommended schema shape:

- `biometry_assessment`
  - `id`
  - `episode_id`
  - `nutritionist_id`
  - `assessment_date`
  - required core fields: `weight`, `body_fat_percent`
  - optional bioimpedance fields: `lean_mass_kg`, `water_percent`, `visceral_fat_level`, `bmr_kcal`, `device`
  - optional notes / timestamps
- `biometry_skinfold`
  - `id`
  - `assessment_id`
  - `measure_key`
  - `value_mm`
  - `sort_order`
- `biometry_perimetry`
  - `id`
  - `assessment_id`
  - `measure_key`
  - `value_cm`
  - `sort_order`

Why this shape fits the repo:

- It mirrors the nested ownership style already used in meal-plan tables.
- It supports partial capture without sparse top-level nullable columns for every fold/perimetry point.
- It keeps read-only history simple: one assessment plus child collections.

### 2. CRUD should be “create + update latest/edit existing”, not wizard-heavy

The current `NewBiometryModal.tsx` already encodes the product rule:

- required user mental model: “Preencha só o que tiver disponível”
- one-form flow
- full field inventory visible at once

The backend therefore should support:

- `POST` create assessment with partial optional sections
- `PATCH` update assessment later
- list assessments for the active episode ordered by date asc/desc depending on endpoint use

Validation rule locked by context:

- required: `assessmentDate`, `weight`, `bodyFatPercent`
- all remaining fields optional

This is closer to the current patient update style than to plan auto-save. There is no evidence that optimistic mutation is necessary for assessment save; standard mutation + invalidate is enough.

### 3. Dashboard should use dedicated aggregate DTOs, not reuse patient list DTOs

Current `HomeView.tsx` only has patient-list data available through `usePatients()`, which is enough for:

- active patient count
- status counts
- average adherence

It is not enough for Phase 06 goals because recent evaluations and clinical trends need assessment data.

Recommended backend endpoint:

- `GET /api/v1/dashboard`

Recommended DTO shape:

- `DashboardResponse`
  - `kpis`
    - `activePatients`
    - `attentionPatients`
    - `criticalPatients`
    - `averageAdherence`
    - optional `assessedInLast30Days`
    - optional `pendingAssessmentCount`
  - `recentEvaluations`
    - array of `{ patientId, patientName, initials, status, assessmentDate, weight, bodyFatPercent }`
  - `portfolio`
    - optional light summary cards if needed by planner

Why a dedicated endpoint is preferable:

- Keeps `PatientResponse` small and stable.
- Avoids bolting dashboard-specific joins onto the patient list endpoint.
- Matches the current `HomeView` need for one fetch that hydrates multiple cards.

### 4. Historical inspection should be served by a cycle snapshot endpoint

The user direction is explicit:

- `Biometria` = active episode only
- `Histórico` = past episodes only
- opening a past episode should show everything from that period in read-only mode

Existing backend foundations:

- episode list per patient already exists structurally
- meal plans are episode-owned

Recommended endpoints:

- `GET /api/v1/patients/{patientId}/biometry`
  - active-episode assessments + chart-ready series
- `POST /api/v1/patients/{patientId}/biometry`
- `PATCH /api/v1/patients/{patientId}/biometry/{assessmentId}`
- `GET /api/v1/patients/{patientId}/history/episodes`
  - closed episodes only, latest first
- `GET /api/v1/patients/{patientId}/history/episodes/{episodeId}`
  - read-only cycle snapshot including:
    - episode metadata
    - plan summary for that cycle
    - biometry assessments for that cycle
    - timeline/history slice for that cycle

The cycle snapshot endpoint is the simplest way to avoid overfetching the active patient page while giving the history tab a strong archival contract.

### 5. Frontend wiring should follow patient-store style, not plan-store complexity

Patterns in the repo show two useful levels:

- `patientStore.ts`
  - standard query + invalidation + toast errors
- `planStore.ts`
  - complex optimistic updates for highly interactive nested editing

Phase 06 is mixed:

- dashboard + episode history browsing fit the simpler `patientStore` model
- active biometry editing has nested data, but save frequency is not as high as plan editing

Recommendation:

- create a dedicated `biometryStore.ts`
  - Zustand for local UI state:
    - selected history episode
    - selected chart metric
    - modal open/edit target
  - TanStack Query hooks for:
    - `useDashboard()`
    - `usePatientBiometry(patientId)`
    - `useCreateBiometry(patientId)`
    - `useUpdateBiometry(patientId)`
    - `usePatientHistoryEpisodes(patientId)`
    - `useHistoricalEpisode(patientId, episodeId)`
- use standard mutation invalidation first
- only add optimistic UI for small local affordances if clearly valuable later

### 6. Existing charts are sufficient

The repo already has:

- `LineChart.tsx`
- `MultiLineChart.tsx`

Current `PatientView` mock behavior already matches the intended Phase 06 UX:

- single-metric toggle
- all-series combined view
- latest-evaluation summary card

Recommended chart contract for real data:

- minimum guaranteed active-episode chart series:
  - `weight`
  - `bodyFatPercent`
- optional if data exists:
  - `leanMassKg`
  - `waterPercent`

Do not invent a new chart system. The planning should explicitly preserve these components and just move them from mock data to query-backed data.

### 7. Sparse episodes are a valid domain case and should be modeled intentionally

Because `PatientService.reactivatePatient(...)` creates a new episode immediately, an episode can exist with:

- a plan
- no biometry
- little or no timeline activity

This is not data corruption. It is an operational fact. The backend should therefore return enough metadata for the frontend to label those states honestly:

- `hasBiometry`
- `assessmentCount`
- `startDate`
- `endDate`
- maybe `durationDays`

That lets the frontend say:

- `Sem avaliação registrada no período`
- `Período encerrado sem registros clínicos relevantes`

without special-case guessing.

## Implementation Recommendations

### Recommended backend slice

1. Add biometry schema and repositories.
2. Add service/controller for active-episode biometry CRUD.
3. Add dashboard aggregate queries and DTOs.
4. Add historical episode listing + snapshot DTOs.
5. Add service/controller tests and at least one repository test for ordering/scope.

### Recommended frontend slice

1. Add `dashboard.ts` / `biometry.ts` API modules.
2. Add `biometryStore.ts` with query hooks and lightweight UI state.
3. Rewire `HomeView.tsx` to use dashboard aggregates and recent evaluations.
4. Rewire `PatientView.tsx` biometry tab to real active-episode data.
5. Rework `HistoryTab` from vague mock history into closed-episode list + drill-down snapshot.
6. Reuse `NewBiometryModal.tsx`, `LineChart.tsx`, `MultiLineChart.tsx`.

## Testing Strategy

### Backend

- Service tests
  - active episode is required for create/update flows
  - nutritionist cannot access another nutritionist's patient/episode data
  - partial optional fields persist correctly
  - list/history endpoints return assessments ordered deterministically
- Controller tests
  - envelope shape matches non-auth endpoints
  - `POST /biometry` validates required fields
  - history endpoints exclude active episode from archive list
- Repository tests
  - active episode lookup
  - historical episode ordering
  - scoped aggregate query semantics

### Frontend

- store tests
  - selected metric / selected episode state
  - invalidation after create/update
- view tests
  - `HomeView` renders real KPI labels/cards from hook data
  - `PatientView` biometry tab renders empty state, last assessment, and chart
  - `HistoryTab` renders closed episodes only and opens read-only snapshot

### E2E

- create a patient assessment
- see latest assessment and chart update
- see dashboard KPI/recent-evaluations reflect real data
- deactivate/reactivate patient, then verify old episode appears only in history

## Recommended Plan Split

Recommended planning shape: **2 plans in 2 waves**

- **06-01**
  - backend biometry + dashboard/history APIs + tests + migration
  - wave 1
- **06-02**
  - frontend API/store/view wiring for dashboard, active biometry, historical snapshots, tests
  - wave 2
  - depends on `06-01`

Why 2 plans is the right size:

- Phase 06 depends on new backend contracts before the frontend can wire real data cleanly.
- The backend surface is cohesive enough to stay in one vertical slice.
- The frontend surface is cohesive enough to stay in one follow-up slice.
- A third plan is only justified if the planner finds E2E breadth too large, but current repo precedent suggests the frontend plan can own that verification work.

## Risks and Mitigations

- **Risk:** overloading patient detail endpoint with dashboard/biometry concerns
  - **Mitigation:** keep dedicated dashboard and history DTOs/endpoints
- **Risk:** history tab becomes editable by accident
  - **Mitigation:** separate read-only snapshot DTO and component path from active biometry flow
- **Risk:** episode ownership bugs create cross-cycle leakage
  - **Mitigation:** all assessment queries anchored on `episode_id` plus nutritionist-scoped patient ownership checks
- **Risk:** mock fallback data in `PatientView` hides missing API wiring
  - **Mitigation:** planning should explicitly remove/contain `ANA` fallback usage for biometry/history surfaces touched in this phase

---

*Phase: 06-dashboard-biometry*
*Research completed: 2026-04-24*
