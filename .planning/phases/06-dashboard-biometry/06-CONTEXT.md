# Phase 6: Dashboard & Biometry - Context

**Gathered:** 2026-04-24
**Status:** 5 plans, ready for execution

<domain>
## Phase Boundary

Nutritionists can track patient biometrics and see clinical insights on the dashboard. This phase delivers biometric assessment recording tied to the active patient episode, real dashboard KPIs and summaries using production data, and evolution charts for weight and body fat percentage using real assessment history. WhatsApp-derived dashboard activity is not part of this phase.

</domain>

<decisions>
## Implementation Decisions

### Dashboard scope
- **D-01:** Remove the WhatsApp activity block from the dashboard entirely in Phase 6. Do not keep placeholder cards for Phase 7.
- **D-02:** Dashboard home should focus on the nutritionist's current clinical context, not mocked messaging activity. The replacement content should emphasize patient portfolio data and recent biometric activity.
- **D-03:** The dashboard should include a concise "latest evaluations" surface, but the overall dashboard direction should stay broader than just biometry. Planner/researcher should propose stronger portfolio-level data cards grounded in the nutritionist's current context.
- **D-04:** Existing KPI structure stays in the home view, but values must come from real patient and assessment data rather than ANA/AGGREGATE mocks.

### Biometric assessment capture
- **D-05:** The "Nova avaliação" flow keeps the full planned scope in one form: bioimpedance fields, skinfolds, perimetry, and notes. The nutritionist may leave fields blank and return to edit later.
- **D-06:** Save validation requires `data` plus mandatory `peso` and `% gordura`. All other biometric fields remain optional in the first release.
- **D-07:** The form should preserve the current "fill only what is available" philosophy from the existing modal copy. The product should not block partial clinical capture beyond the required minimum.
- **D-08:** Recording a biometric assessment should open a prompt for manual patient status review/update after save. The system does not auto-change status.

### Episode and history behavior
- **D-09:** Biometric data belongs to the patient episode model established in Phase 4. The active Biometria tab only works against the current active episode.
- **D-10:** The Histórico tab should show only past episodes, not the active one. The active episode remains represented in the current tabs (Hoje, Plano, Biometria, Inteligência).
- **D-11:** Opening a past episode from Histórico should reveal the full context of that closed period in read-only mode: plan of that cycle, biometric records of that cycle, and timeline/history from that cycle.
- **D-12:** Closed episodes remain visible even when they are short or clinically sparse. A brief activation/deactivation cycle is valid history and must not be hidden.
- **D-13:** If a past episode has little or no clinical activity, the UI should label that honestly (for example, no biometric records in the period), rather than pretending the episode is missing.
- **D-14:** Meal plan presence should be assumed for every episode because the base plan is auto-created on patient activation, even when it remains nearly empty.

### Evolution views and read/write boundaries
- **D-15:** The Biometria tab should continue to be the operational workspace for the active episode: register evaluation, edit current episode data, and inspect current evolution.
- **D-16:** Past episodes are visualization-only. No editing is allowed when reviewing historical cycles.
- **D-17:** Evolution charts in this phase must at minimum support real weight and body fat percentage progression over time, with the richer derived metrics and multi-series behavior left to implementation discretion where already scaffolded by the UI.

### the agent's Discretion
- Exact dashboard KPI composition beyond the locked removal of WhatsApp and inclusion of recent evaluation context
- API response shape for dashboard aggregates and recent assessments
- Whether dashboard replacement uses one combined clinical summary card or a small set of coordinated cards
- Edit-after-save UX for partial biometric records
- Exact wording for sparse-episode states in Histórico
- Whether past episode inspection opens inline, in an expanded panel, or in a drill-down layout inside Histórico

### Verification fixes applied during plan restructure
- **I-5 fix:** Plan 06-05 Task 2 explicitly removes both the WhatsApp KPI ("Refeições registradas · via WhatsApp") and the entire activity card, not just the card.
- **I-6 fix:** Dashboard hooks stored in `clinicalStore.ts` (not `biometryStore.ts`) to reflect both dashboard and biometry concerns.
- **I-3 fix:** NewBiometryModal conversion from visual shell to functional form is explicitly scoped (controlled state, validation, mutation, post-save flow).
- **I-4 fix:** StatusReviewModal component is itemized with props, behavior, and mutation wiring.
- **I-9 fix:** ANA mock removal is scoped: biometry/skinfolds/perimetry are replaced; macrosToday, weekAdherence, weekMacroFill, timeline, and aiSummary remain as fallback.
- **G-3 fix:** E2E spec explicitly covers the StatusReviewModal flow after save.
- **G-6 fix:** Acceptance criteria include graceful empty/single-point chart state handling.
- **I-7 fix:** Full route manifest documented in 06-02 and 06-03 plans.
- **I-8 fix:** metadata_json explicitly declared as JSONB with @Column(columnDefinition = "jsonb") String in 06-01 Task 1.
- **R-7 fix:** DashboardController @PreAuthorize documented in 06-03 must_haves and action text.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project requirements
- `.planning/REQUIREMENTS.md` — BIO-01, BIO-02, BIO-03 define the requirements for this phase
- `.planning/ROADMAP.md` §Phase 6 — phase boundary, success criteria, and test expectations
- `.planning/PROJECT.md` — product constraints: pt-BR UI, solo nutritionist workflow, preserve existing UI direction

### Prior phase context
- `.planning/phases/01-monorepo-infrastructure/01-CONTEXT.md` — architecture, `/api/v1`, Flyway, Zustand + TanStack Query baseline
- `.planning/phases/04-patient-management/04-CONTEXT.md` — episode model, manual status, detail-view expectations, patient isolation
- `.planning/phases/05-meal-plans-food-catalog/05-CONTEXT.md` — one plan per episode, plan auto-created on activation, patient tab structure

### Existing frontend code
- `frontend/src/views/HomeView.tsx` — current dashboard structure and mock-derived KPI/activity layout to be replaced with real clinical context
- `frontend/src/views/PatientView.tsx` — current Biometria and Histórico tab structure, active-vs-history split, current mock rendering
- `frontend/src/components/patient/NewBiometryModal.tsx` — existing modal structure and optional-field philosophy
- `frontend/src/components/patient/MultiLineChart.tsx` — reusable multi-series evolution chart primitive
- `frontend/src/components/viz/LineChart.tsx` — reusable single-metric evolution chart primitive
- `frontend/src/types/patient.ts` — current patient, biometry, skinfold, perimetry, and timeline TypeScript shapes

### Existing backend code
- `backend/src/main/java/com/nutriai/api/model/Episode.java` — episode lifecycle and active/closed cycle model
- `backend/src/main/java/com/nutriai/api/model/Patient.java` — patient fields already persisted for detail/dashboard context
- `backend/src/main/java/com/nutriai/api/service/PatientService.java` — activation/deactivation behavior and episode creation/closure
- `backend/src/main/java/com/nutriai/api/dto/patient/PatientResponse.java` — current patient detail payload baseline
- `backend/src/main/resources/db/migration/V4__create_patient_and_episode_tables.sql` — patient and episode persistence foundation
- `backend/src/main/resources/db/migration/V7__add_patient_details_fields.sql` — existing patient detail columns available before biometric schema expansion

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `frontend/src/views/HomeView.tsx` already has the dashboard card/grid scaffold, KPI row, and patient portfolio section. The layout can be repurposed instead of redesigned.
- `frontend/src/views/PatientView.tsx` already splits active work into `BiometryTab` and archival review into `HistoryTab`, which matches the chosen product direction.
- `frontend/src/components/patient/NewBiometryModal.tsx` already contains the full field inventory for bioimpedance, skinfolds, and perimetry, plus the right tone: "Preencha só o que tiver disponível".
- `frontend/src/components/patient/MultiLineChart.tsx` and existing viz components can cover active-episode evolution without inventing a new chart system.
- `backend/src/main/java/com/nutriai/api/model/Episode.java` and `PatientService.java` already support multi-cycle patient history, which is the structural foundation for read-only historical review.
- `backend/src/main/resources/db/migration/V7__add_patient_details_fields.sql` shows the project already accepts iterative expansion of the patient clinical model via migration.

### Established Patterns
- Active operational flows live in the patient detail tabs; archive/audit behavior can live in a dedicated historical view instead of overloading the active workspace.
- Data isolation is repository/service enforced per nutritionist and must apply to all biometric and dashboard queries.
- Frontend follows Zustand for UI state and TanStack Query for server data; Phase 6 should extend that pattern rather than introduce a new state model.
- pt-BR copy and the existing visual system should be preserved; this is a wiring-and-clarification phase, not a redesign phase.

### Integration Points
- Dashboard aggregate endpoints will feed `HomeView.tsx` and likely share patient/assessment summaries with the patient list context.
- Biometric CRUD endpoints should attach to the current active `Episode`, not directly to a free-floating patient history table.
- Histórico needs backend support to enumerate past episodes and fetch a read-only payload for one closed cycle, including plan and clinical history for that period.
- Patient status update prompt after biometric save will likely connect the new biometry flow back into the existing patient update endpoint/service.

</code_context>

<specifics>
## Specific Ideas

- The user wants the dashboard to stop hinting at WhatsApp before Phase 7 and instead show data that reflects the nutritionist's real portfolio context.
- The dashboard direction is intentionally still a little open: "ultimas avaliações" is desired, but there is room to strengthen the overall clinical summary with better portfolio-level signals.
- Historical episodes should behave like closed clinical snapshots: inspect everything that happened in that cycle, but never edit it.
- Sparse or short-lived cycles are acceptable and should be surfaced explicitly rather than hidden.

</specifics>

<deferred>
## Deferred Ideas

- Real WhatsApp-derived dashboard activity and live messaging cards — deferred to Phase 7
- Automatic status computation from biometric deltas — deferred; manual review remains the rule
- Active episode browsing inside Histórico — explicitly deferred because Histórico should show only past episodes
- Any redesign that changes the app's visual language rather than reusing the migrated dashboard/patient shells

</deferred>

---

*Phase: 06-dashboard-biometry*
*Context gathered: 2026-04-24*
