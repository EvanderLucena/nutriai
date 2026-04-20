---
phase: 02-frontend-migration
plan: 08
subsystem: ui
tags: [react, typescript, vite, theme, visualization]

# Dependency graph
requires:
  - phase: 02-frontend-migration
    provides: React+TypeScript component structure, CSS custom properties, viz components
provides:
  - Theme-aware carb/warning color using var(--carb) across HomeView and PatientGrid
  - MacroRings component wired into PatientView today tab (planned + reported macros)
  - WeekBars component wired into PatientView today tab (7-day adherence)
  - PlanMacro component removed (replaced by MacroRings)
affects: [frontend-migration, dark-theme, visualization]

# Tech tracking
tech-stack:
  added: []
  patterns: [themed-css-tokens-for-status-colors, viz-component-wiring-pattern]

key-files:
  created: []
  modified:
    - frontend/src/views/HomeView.tsx
    - frontend/src/components/patients/PatientGrid.tsx
    - frontend/src/views/PatientView.tsx

key-decisions:
  - "Used patient.macrosToday (not macros) for MacroRings — matches DetailedPatient type field name from types/patient.ts"
  - "Used patient.weekMacroFill (0-1 percentage values) for WeekBars — matches WeekBars 0-1 value contract"
  - "Removed PlanMacro function entirely since both usages in TodayTab were replaced by MacroRings"

patterns-established:
  - "Viz components receive data from patient object fields (macrosToday, weekMacroFill) rather than hardcoded strings"

requirements-completed: [INFRA-02]

# Metrics
duration: 11min
completed: 2026-04-20
---

# Phase 2 Plan 8: Gap Closure Summary

**Replaced hardcoded #A0801F with var(--carb) and wired MacroRings + WeekBars into PatientView today tab**

## Performance

- **Duration:** 11 min
- **Started:** 2026-04-20T20:09:44Z
- **Completed:** 2026-04-20T20:20:53Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Eliminated last 2 hardcoded #A0801F hex values — HomeView and PatientGrid now use var(--carb) CSS token for theme-aware warning/carb color
- Wired MacroRings component into PatientView today tab, replacing static PlanMacro text display with interactive ring visualizations for both planned and reported macros
- Wired WeekBars component into PatientView today tab, showing 7-day adherence pattern (the weekMacroFill data from DetailedPatient)
- Removed unused PlanMacro component after replacement

## Task Commits

Each task was committed atomically:

1. **task 1: Replace hardcoded #A0801F with var(--carb) in HomeView and PatientGrid** - `1d5c61e` (fix)
2. **task 2: Wire MacroRings and WeekBars into PatientView today tab** - `4bee616` (feat)

## Files Created/Modified
- `frontend/src/views/HomeView.tsx` - Replaced '#A0801F' with 'var(--carb)' in warning status color ternary
- `frontend/src/components/patients/PatientGrid.tsx` - Replaced '#A0801F' with 'var(--carb)' in warning status color ternary
- `frontend/src/views/PatientView.tsx` - Added MacroRings + WeekBars imports, replaced PlanMacro grids with MacroRings, added WeekBars adherence card, added reportedMacrosToday const, removed PlanMacro function

## Decisions Made
- Used `patient.macrosToday` field (not `patient.macros`) for MacroRings — matches the actual DetailedPatient type field name in types/patient.ts
- Used `patient.weekMacroFill` (0-1 values) for WeekBars — matches the WeekBars component contract (values 0-1)
- Removed PlanMacro entirely since both usages were replaced by MacroRings and no other code referenced it

## Deviations from Plan

None — plan executed exactly as written. Minor adaptation: used `patient.macrosToday` instead of `patient.macros` to match the actual type field name, and used `patient.weekMacroFill` instead of hardcoded mock values since the data already existed in the ANA mock object.

## Issues Encountered
None

## Next Phase Readiness
- All 7 verification truths for Phase 2 should now pass (4 were already passing, 2 fixed by this plan, 1 was already passing)
- Zero hardcoded #A0801F hex values remain in frontend codebase
- All 6 viz components (Ring, MacroRings, Sparkline, WeekBars, LineChart, StackBar) are now rendered in the application — none are orphaned
- TypeScript compilation and Vite production build both succeed (0 errors)
- Frontend migration gap closure complete

---
*Phase: 02-frontend-migration*
*Completed: 2026-04-20*