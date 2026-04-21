# Phase 4: Patient Management - Context

**Gathered:** 2026-04-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Nutritionists can manage their patient roster with complete data isolation. This phase delivers: Patient CRUD (create, edit, deactivate, reactivate) with all demographic and clinical fields, patient list with status tracking (on-track, attention, critical) and search/filter by status and objective, complete data isolation between nutritionist accounts, and patient detail view loading with real API data. The episode/cycle model for patient reactivation is introduced here as a foundation for biometry and timeline in later phases.

</domain>

<decisions>
## Implementation Decisions

### Patient Entity & Fields
- **D-01:** Backend Patient entity matches the existing `Patient` type (name, age, objective, weight, adherence, tag, status, active). `DetailedPatient` fields (sex, height, since, macrosToday, biometry, skinfolds, perimetry, timeline, aiSummary) are loaded on-demand for the detail view, not duplicated on the list entity.
- **D-02:** Status (ontrack/warning/danger) is **manual** — set by the nutritionist, never auto-computed. Auto-computation would be misleading because patients who don't log meals via WhatsApp aren't necessarily doing poorly.
- **D-03:** When a nutritionist records a biometric assessment (Phase 6), the system should **prompt for a status update**. Not automatic, but surfaced as an opportunity.
- **D-04:** Patient objective is a **fixed list** (Emagrecimento, Hipertrofia, Controle glicêmico, Performance esportiva, Reeducação alimentar, Controle pressão, etc.) — dropdown selection, not free text. Ensures consistent filtering and reporting.

### Deactivation & Episode Model
- **D-05:** Patients are **soft-deleted only** — deactivation, never permanent deletion. Data is always preserved (LGPD compliance). Deactivated patients can be reactivated anytime.
- **D-06:** Deactivated patients move to a **separate "Inativos" filter/tab** — not mixed in the main list. Active count excludes them.
- **D-07:** All data is **fully preserved** on deactivation — meal plans, timeline, biometry, everything remains accessible.
- **D-08:** The system uses an **Episode/Cycle model** — each activation-deactivation period is a first-class `Episode` entity with its own ID, start/end dates, and links to biometry, timeline, and plan data. This solves the "patient returns after 1 year" problem: old data stays in previous episodes, new data starts a fresh cycle, weight delta resets.
- **D-09:** Default view shows only the **current (latest) episode**. A "Histórico" tab or toggle shows all episodes (full history across reactivations). This avoids distortion from inactive periods.

### Data Isolation & API
- **D-10:** Data isolation is enforced at the **repository level** — every query filters by nutritionist_id transparently. Service layer doesn't need to worry about scoping. JPA/Hibernate convention: `findBy...NutritionistId` methods on repositories.
- **D-11:** API returns **404 (not 403)** when a nutritionist tries to access another nutritionist's patient — avoids leaking patient ID existence.
- **D-12:** RESTful endpoints with status actions:
  - `GET /api/v1/patients` — list (paginated, filtered)
  - `POST /api/v1/patients` — create
  - `GET /api/v1/patients/{id}` — detail
  - `PATCH /api/v1/patients/{id}` — update
  - `PATCH /api/v1/patients/{id}/deactivate` — soft delete
  - `PATCH /api/v1/patients/{id}/reactivate` — reactivate (creates new Episode)

### Patient List UX
- **D-13:** Data fetching uses **Zustand (client state: filters, selection) + TanStack Query (server data: patient list from API)**. Matches the pattern already established with authStore.
- **D-14:** **Preserve the table/grid toggle** exactly as-is from the prototype. Just wire it to real API data.
- **D-15:** **Server-side pagination** — backend returns paginated results with page/size/total. Essential for scaling with 30+ patients.

### OpenCode's Discretion
- Exact Patient entity field names and column types
- Flyway migration for patient + episode tables
- Pagination response shape (page metadata, total count)
- TanStack Query hook structure (usePatients, usePatient, etc.)
- patientStore (Zustand) internal shape
- Error handling patterns for API failures
- Test structure and coverage specifics

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project requirements
- `.planning/REQUIREMENTS.md` — PAT-01, PAT-02, PAT-03, PAT-04 are the requirements for this phase
- `.planning/ROADMAP.md` §Phase 4 — Success criteria and phase boundary
- `.planning/PROJECT.md` — Tech stack constraints, isolation requirement, pt-BR language

### Existing codebase
- `frontend/src/types/patient.ts` — Patient and DetailedPatient type definitions (source of truth for field shapes)
- `frontend/src/views/PatientsView.tsx` — Current mock-driven patient list with table/grid, filters, pagination, modals
- `frontend/src/stores/authStore.ts` — Zustand store pattern (reference for patientStore)
- `frontend/src/api/client.ts` — Axios instance with JWT interceptor (base for patient API calls)
- `backend/src/main/java/com/nutriai/api/model/Nutritionist.java` — Existing entity with patientLimit field, UUID primary key, timestamps
- `backend/src/main/java/com/nutriai/api/auth/NutritionistAccess.java` — getCurrentNutritionistId() utility for repository-level filtering
- `backend/src/main/resources/db/migration/` — V1, V2, V3 migrations (next is V4 for patient tables)

### Phase context
- `.planning/phases/01-monorepo-infrastructure/01-CONTEXT.md` — Decisions: layered architecture, /api/v1/ prefix, Flyway migrations, Zustand for state, React Router v7

### Research
- No external specs — requirements fully captured in decisions above

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `frontend/src/components/patients/` — PatientTable, PatientGrid, NewPatientModal, EditPatientModal, Pagination, Avatar components already migrated from prototype. Wire these to real API data.
- `frontend/src/components/patient/` — Patient detail components (Timeline, ExtractionEditor, NewBiometryModal) for Phase 6 but structurally ready.
- `frontend/src/types/patient.ts` — TypeScript types already defined (Patient, DetailedPatient, PatientStatus, macros, biometry). Backend entity should match.
- `frontend/src/data/patients.ts` — Mock patient data with 12 patients. Serves as reference for seed data and API response shape.
- `backend/src/main/java/com/nutriai/api/auth/NutritionistAccess.java` — Utility to extract authenticated nutritionist UUID from SecurityContext. Use in repository filtering.
- `backend/src/main/java/com/nutriai/api/dto/ApiResponse.java` — Standardized error response shape already exists.

### Established Patterns
- Zustand store pattern (authStore.ts) — useQuery + useMutation via Zustand actions for API state
- Axios client with JWT interceptor (apiClient) — already handles 401 refresh
- Flyway migrations with versioned SQL scripts (V1, V2, V3) — next migration is V4
- Spring Boot layered architecture: controller → service → repository → model
- React Router v7 for client-side routing
- Tailwind CSS with custom theme tokens from prototype

### Integration Points
- Frontend: apiClient (already set up at /api/v1) — add patient endpoints following auth pattern
- Backend: NutritionistAccess.getCurrentNutritionistId() — inject into repository queries for data isolation
- Database: V4 Flyway migration — creates `patient` and `episode` tables with `nutritionist_id` foreign key
- Navigation: navigationStore already has setActivePatientId() for patient detail routing

</code_context>

<specifics>
## Specific Ideas

- Episode/cycle model: when reactivating a patient, a new Episode is created. Old data belongs to previous episodes. This avoids showing misleading weight deltas from inactive periods.
- Status should be manually set during in-person consultations (when recording biometry). The system should prompt for a status update when biometry is saved (Phase 6).
- Objective is a fixed list (not free text) to enable consistent filtering. List includes: Emagrecimento, Hipertrofia, Controle glicêmico, Performance esportiva, Reeducação alimentar, Controle pressão.
- Deactivated patients go to a separate "Inativos" filter, not mixed in the main active list.

</specifics>

<deferred>
## Deferred Ideas

- Full patient detail view with 5 tabs (Hoje, Plano, Biometria, Insights, Histórico) — the detail view loads and displays, but rich functionality per tab comes in Phase 5 (Plans) and Phase 6 (Biometry)
- Patient limit enforcement per subscription tier (15/30/unlimited) — deferred to Phase 8 (Billing)
- LGPD consent at patient registration — deferred to Phase 9 (LGPD)
- WhatsApp activation link per patient — deferred to Phase 7 (WhatsApp Intelligence)
- AI summary and meal extraction on patient timeline — deferred to Phase 7

</deferred>

---

*Phase: 04-patient-management*
*Context gathered: 2026-04-21*