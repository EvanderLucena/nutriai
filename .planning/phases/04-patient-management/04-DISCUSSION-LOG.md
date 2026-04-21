# Phase 4: Patient Management - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in 04-CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-21
**Phase:** 04-patient-management
**Areas discussed:** Patient fields & status model, Deactivation vs deletion behavior, Data isolation & API security, Patient list UX

---

## Patient Fields & Status Model

| Option | Description | Selected |
|--------|-------------|----------|
| Match existing type | Backend Patient entity mirrors the Patient type (list fields only, detail fields lazy-loaded) | ✓ |
| Promote DetailedPatient fields | Move sex, height, since to base Patient entity | |
| You decide | Let researcher/planner decide field mapping | |

**User's choice:** Match existing type — keep Patient (list) and DetailedPatient (detail) separation.
**Notes:** DetailedPatient fields like biometry, macros, timeline only load on demand for the detail view.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Manual status (Recommended) | Nutritionist sets status manually via edit | ✓ |
| Auto-computed from adherence | Status computed from adherence percentage and weight trend | |
| Manual with suggestions | Manual default, system suggests changes | |

**User's choice:** Manual status.
**Notes:** User pointed out that adherence-based status would be unreliable — patients who don't log via WhatsApp aren't necessarily doing poorly. Status should reflect the nutritionist's clinical judgment, especially during in-person consultations.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Fixed list (Recommended) | Dropdown selection from a fixed list of objectives | ✓ |
| Free text | Nutritionist types any objective | |
| Fixed + custom | Fixed list with a 'Custom' option for free text | |

**User's choice:** Fixed list for objectives.
**Notes:** Ensures consistent filtering and reporting.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Prompt on biometry save (Recommended) | When recording a biometric assessment, prompt for status update | ✓ |
| No automatic link | Status and biometry completely separate | |

**User's choice:** Prompt on biometry save.
**Notes:** Status updates are most naturally tied to the in-person consultation moment. Phase 6 (Biometry) should surface a status update prompt.

---

## Deactivation vs Deletion Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Soft delete only (Recommended) | Patients deactivated, never permanently deleted. Data always preserved. | ✓ |
| Soft delete + hard delete | Offer both deactivate and permanent delete (with strong confirmation) | |

**User's choice:** Soft delete only — deactivation with reactivation. User emphasized that the active list would become unmanageably large if patients can't be deactivated.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Separate inactive list (Recommended) | Deactivated patients in separate "Inativos" filter/tab | ✓ |
| Dimmed in main list | Inactive patients stay in main list but visually dimmed | |

**User's choice:** Separate inactive list.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Full preservation (Recommended) | All data preserved — meal plans, timeline, biometry stay accessible | ✓ |
| Archive but queryable | Data archived but still queryable | |

**User's choice:** Full preservation.
**Notes:** User raised important concern about reactivation: if a patient returns after 1 year, showing old data (e.g., weight delta of +10kg during an unmonitored period) would be misleading. Led to the episode model discussion.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Timeline gap + cycle reset (Recommended) | Old data preserved with gap markers, delta resets | |
| Episode/cycle model | First-class Episode entity with start/end dates, data scoped to episodes | ✓ |
| You decide | Implementation up to planner/researcher | |

**User's choice:** Episode/cycle model.
**Notes:** User liked this approach because it allows full cross-episode reporting later, while showing only the current episode by default.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Current episode default + history toggle (Recommended) | Default view shows current episode, "Histórico" shows all | ✓ |
| Strictly separate episodes | Each episode completely independent | |
| You decide UX | Implementation detail | |

**User's choice:** Current episode default + history toggle.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Date range filter (no new entity) | Episode is just a period filter on existing data | |
| First-class Episode entity | Episode has its own ID, start/end dates, links to data | ✓ |
| You decide | UX is what matters, implementation detail | |

**User's choice:** First-class Episode entity.
**Notes:** Enables future reporting across episodes and clean separation of data per activation period.

---

## Data Isolation & API Security

| Option | Description | Selected |
|--------|-------------|----------|
| Repository-level filter (Recommended) | Every query automatically filters by nutritionist_id. Safest approach. | ✓ |
| Service-level scoping | Service passes nutritionistId explicitly to every query | |

**User's choice:** Repository-level filter.
**Notes:** Matches the existing NutritionistAccess utility pattern. Impossible to forget scoping.

---

| Option | Description | Selected |
|--------|-------------|----------|
| RESTful with status actions (Recommended) | Standard REST endpoints + deactivation/reactivation actions | ✓ |
| RESTful with PUT/PATCH distinction | PUT for full update, PATCH for partial | |

**User's choice:** RESTful with status actions.

---

| Option | Description | Selected |
|--------|-------------|----------|
| 404 on cross-access (Recommended) | Return 404 when accessing another nutritionist's patient (hides existence) | ✓ |
| 403 on cross-access | Return 403 Forbidden (explicit authorization failure but leaks IDs) | |

**User's choice:** 404 on cross-access.
**Notes:** Standard security practice for multi-tenant apps — avoids information leakage.

---

## Patient List UX

| Option | Description | Selected |
|--------|-------------|----------|
| Zustand + TanStack Query (Recommended) | Zustand for client state, TanStack Query for server data | ✓ |
| Zustand only (simpler) | All state in Zustand, manual loading/error handling | |

**User's choice:** Zustand + TanStack Query.
**Notes:** User asked for explanation of both libraries. After understanding, chose the recommended pattern. Matches Phase 1 context decision (Zustand for global state, TanStack Query when API calls are needed).

---

| Option | Description | Selected |
|--------|-------------|----------|
| Preserve prototype toggle (Recommended) | Keep table/grid toggle as-is, wire to real API | ✓ |
| Rethink the toggle | Redesign the view toggle | |

**User's choice:** Preserve prototype toggle.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Server-side pagination (Recommended) | Backend paginates results, frontend sends page/size params | ✓ |
| Client-side pagination | Load all patients, paginate in frontend | |

**User's choice:** Server-side pagination.

---

## OpenCode's Discretion

- Backend field names, column types, and entity relationships
- Flyway migration V4 structure for patient + episode tables
- TanStack Query hook organization (usePatients, usePatient, etc.)
- patientStore (Zustand) internal structure
- Error handling patterns for API failures
- Test structure and coverage specifics

## Deferred Ideas

- Patient detail 5-tab view: full functionality deferred to Phases 5 (Plans) and 6 (Biometry)
- Patient limit enforcement: deferred to Phase 8 (Billing)
- LGPD consent at registration: deferred to Phase 9
- WhatsApp activation link: deferred to Phase 7
- AI summary on timeline: deferred to Phase 7