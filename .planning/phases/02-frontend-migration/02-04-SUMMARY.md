---
phase: 02-frontend-migration
plan: 04
subsystem: ui
tags: [react, typescript, tailwind, dashboard, patients, kpi, avatars, pagination, modals]

# Dependency graph
requires:
  - phase: 02-01
    provides: Icons, types, mock data (PATIENTS, AGGREGATE), viz components (Ring, Sparkline, StackBar)
  - phase: 02-02
    provides: AppShell, navigationStore, routing, globals.css
provides:
  - HomeView with 4 KPI cards and patient grid
  - KPI reusable metric component with sparkline support
  - PatientsView with table/grid toggle, filters, search, pagination
  - Avatar component with status dot
  - Pagination component with page numbers
  - PatientTable with adherence bars and inline actions
  - PatientGrid with cards and sparklines
  - NewPatientModal with form fields
  - EditPatientModal with pre-filled data
  - Barrel export for patients components
affects: [dashboard, patient-list, navigation]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Extracted patient subcomponents under components/patients/ barrel"
    - "KPI with optional sparkline trend visualization"
    - "Modal forms using @/components/ui/Modal and Input"

key-files:
  created:
    - frontend/src/components/patients/Avatar.tsx
    - frontend/src/components/patients/Pagination.tsx
    - frontend/src/components/patients/PatientTable.tsx
    - frontend/src/components/patients/PatientGrid.tsx
    - frontend/src/components/patients/NewPatientModal.tsx
    - frontend/src/components/patients/EditPatientModal.tsx
    - frontend/src/components/patients/index.ts
  modified:
    - frontend/src/components/KPI.tsx
    - frontend/src/views/HomeView.tsx
    - frontend/src/views/PatientsView.tsx

key-decisions:
  - "Kept PAGE_SIZE=10 for patients view (prototype uses 10), PAGE_SIZE=8 for home patient grid"
  - "Used sparkline data arrays in KPI for trend visualization instead of simple up/down arrows"
  - "Patient subcomponents extracted to components/patients/ barrel with individual files for reusability"

patterns-established:
  - "Barrel exports for feature-component directories (components/patients/index.ts)"
  - "KPI component accepts sparklineData prop for trend visualization"
  - "Avatar component with status-aware dot positioning"

requirements-completed: [INFRA-02]

# Metrics
duration: 23min
completed: 2026-04-20
---

# Phase 2 Plan 04: Dashboard & Patient List Summary

**HomeView with 4 KPI cards (sparkline trends) and patient grid; PatientsView with extracted table/grid, filters, search, pagination, and patient modals**

## Performance

- **Duration:** 23 min
- **Started:** 2026-04-20T13:49:14Z
- **Completed:** 2026-04-20T14:12:19Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- Enhanced KPI component with sparkline trend data, change indicators, and icon support
- HomeView dashboard with 4 KPI cards (Pacientes ativos, Adesão média, Refeições registradas, Sem registro) plus patient grid with avatar status dots
- Extracted Avatar component with status dot (sage/amber/coral) and size variants
- Extracted Pagination component with page numbers and active/inactive page styling
- PatientTable with adherence StackBar visualization, weight delta, and toggle actions
- PatientGrid with card layout, sparkline adherence trends, and status chips
- NewPatientModal with full form: Nome, Data nascimento, Sexo, Altura, Objetivo, WhatsApp, Observações
- EditPatientModal with pre-filled patient data for editing
- PatientsView fully refactored to use extracted subcomponents with table/grid toggle, status filters, search, pagination, and inactivity toggle
- All TypeScript compilation passing with zero errors

## Task Commits

Each task was committed atomically:

1. **task 1: Migrate HomeView with KPIs** - `c165df1` (feat)
2. **task 2: Migrate PatientsView with table, grid, filters, search, modals** - `3506b76` (feat)

## Files Created/Modified
- `frontend/src/components/KPI.tsx` - Enhanced KPI metric card with sparkline, trend, icon support
- `frontend/src/views/HomeView.tsx` - Dashboard with KPI cards, activity feed, patient grid
- `frontend/src/components/patients/Avatar.tsx` - Patient avatar with status dot and size variants
- `frontend/src/components/patients/Pagination.tsx` - Pagination with page numbers and prev/next
- `frontend/src/components/patients/PatientTable.tsx` - Table layout with StackBar adherence
- `frontend/src/components/patients/PatientGrid.tsx` - Card grid with sparklines and status
- `frontend/src/components/patients/NewPatientModal.tsx` - New patient form modal
- `frontend/src/components/patients/EditPatientModal.tsx` - Edit patient form modal
- `frontend/src/components/patients/index.ts` - Barrel export for patients components
- `frontend/src/views/PatientsView.tsx` - Full patient list with filters, search, toggles

## Decisions Made
- Kept PAGE_SIZE=10 for patients view (matching prototype behavior), PAGE_SIZE=8 for home patient grid
- KPI sparkline uses trend prop for color (sage for up, coral for down) instead of hard-coded values
- Patient subcomponents use individual files under components/patients/ for reusability across views
- NewPatientModal adds patient to local state array (mock — API integration in Phase 4)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- HomeView and PatientsView fully migrated with all subcomponents extracted
- KPI component reusable across future dashboard views
- Patient components (Avatar, Pagination) available for import in other views
- Ready for Plan 05 (Patient Detail View) and Plan 06 (PlansView)

---
*Phase: 02-frontend-migration*
*Completed: 2026-04-20*

## Self-Check: PASSED
- All 10 created/modified files verified on disk
- Both task commits found in git history (c165df1, 3506b76)
- TypeScript compilation passes with zero errors