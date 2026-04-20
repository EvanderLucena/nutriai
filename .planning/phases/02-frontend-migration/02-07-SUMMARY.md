---
phase: 02-frontend-migration
plan: 07
subsystem: ui
tags: [css, theme, dark-mode, ux, confirmation-dialog, accessibility]

requires:
  - phase: 02-frontend-migration
    provides: migrated React+TypeScript frontend with all views and dark theme support

provides:
  - CSS custom property --carb/--carb-dark for theme-aware carbohydrate macro color
  - All hardcoded #A0801F replaced with var(--carb)
  - All hardcoded #D4FF4F in SVG logos replaced with style={{ fill/stroke: 'var(--lime)' }}
  - DeleteConfirmModal component in PlansView for safe meal/food deletion
  - Disabled login button when email or password is empty
  - Test infrastructure (vitest + jsdom + @testing-library) with 7 passing tests

affects: [02-frontend-migration]

tech-stack:
  added: [vitest, jsdom, @testing-library/jest-dom]
  patterns: [css-custom-property-theme-adaptation, confirmation-dialog-pattern, disabled-button-validation]

key-files:
  created:
    - frontend/vitest.config.ts
    - frontend/src/test-setup.ts
    - frontend/src/views/PlansView.test.tsx
    - frontend/src/views/LoginView.test.tsx
  modified:
    - frontend/src/styles/globals.css
    - frontend/src/views/PatientView.tsx
    - frontend/src/views/FoodsView.tsx
    - frontend/src/views/LandingView.tsx
    - frontend/src/views/LoginView.tsx
    - frontend/src/views/OnboardingView.tsx
    - frontend/src/views/SignupView.tsx
    - frontend/src/views/PlansView.tsx
    - frontend/src/components/plan/PlanFoodRow.tsx
    - frontend/src/components/plan/ExtrasSection.tsx
    - frontend/src/components/plan/AddMealModal.tsx
    - frontend/src/components/plan/EditFoodModal.tsx

key-decisions:
  - "Used --carb-dark value #C49A2E for dark theme (lighter than #A0801F for dark bg visibility)"
  - "Used same DeleteConfirmModal pattern from FoodsView for PlansView consistency"
  - "Stored pendingDelete as { optIdx, itemIdx, name } object to avoid index ambiguity on confirm"
  - "Stored pendingMealId as string ID to derive meal label for modal text"

requirements-completed: [INFRA-02]

duration: 34min
completed: 2026-04-20
---

# Phase 2 Plan 7: UAT Gap Closure Summary

**Replaced hardcoded hex colors with CSS custom properties, added delete confirmation to PlansView, and disabled login button when fields are empty**

## Performance

- **Duration:** 34 min
- **Started:** 2026-04-20T10:11:38Z
- **Completed:** 2026-04-20T10:46:25Z
- **Tasks:** 2
- **Files modified:** 12 component files + 1 CSS file + 4 test/config files

## Accomplishments

- All 13 `#A0801F` references replaced with `var(--carb)` across 6 component files
- All 8 `#D4FF4F` SVG attributes replaced with `style={{ fill/stroke: 'var(--lime)' }}` across 4 view files
- Added `--carb: #A0801F` and `--carb-dark: #C49A2E` tokens to `:root` in globals.css
- Added `--carb: var(--carb-dark)` override in `[data-theme="dark"]` for dark theme visibility
- Added `DeleteConfirmModal` component to PlansView matching FoodsView pattern
- Wired PlanFoodRow `onRemove` through `pendingDelete` confirmation state
- Wired meal delete button through `pendingMealId` confirmation state
- Added `disabled={!email || !password}` with `opacity: 0.45` to LoginView submit button
- Set up vitest + jsdom test infrastructure with 7 passing tests

## task Commits

Each task was committed atomically:

1. **task 1: Replace hardcoded hex colors with CSS custom properties** - `51dbdcc` (fix)
2. **task 2: Add deletion confirmation to PlansView and disabled state to LoginView** - `22dc3e7` (test), `8ec50f4` (feat)

**Plan metadata:** (final metadata commit pending)

_Note: TDD task 2 has a test commit and implementation commit_

## Files Created/Modified

- `frontend/src/styles/globals.css` - Added --carb, --carb-dark tokens and dark override
- `frontend/src/views/PatientView.tsx` - Replaced 7x #A0801F with var(--carb)
- `frontend/src/views/FoodsView.tsx` - Replaced 2x #A0801F with var(--carb)
- `frontend/src/views/LandingView.tsx` - Replaced 2x #D4FF4F SVG with var(--lime)
- `frontend/src/views/LoginView.tsx` - Replaced 2x #D4FF4F SVG with var(--lime), added disabled button
- `frontend/src/views/OnboardingView.tsx` - Replaced 2x #D4FF4F SVG with var(--lime)
- `frontend/src/views/SignupView.tsx` - Replaced 2x #D4FF4F SVG with var(--lime)
- `frontend/src/views/PlansView.tsx` - Added DeleteConfirmModal, pendingDelete/pendingMealId states
- `frontend/src/components/plan/PlanFoodRow.tsx` - Replaced #A0801F with var(--carb)
- `frontend/src/components/plan/ExtrasSection.tsx` - Replaced #A0801F with var(--carb)
- `frontend/src/components/plan/AddMealModal.tsx` - Replaced #A0801F with var(--carb)
- `frontend/src/components/plan/EditFoodModal.tsx` - Replaced #A0801F with var(--carb)
- `frontend/vitest.config.ts` - Vitest config with jsdom environment
- `frontend/src/test-setup.ts` - @testing-library/jest-dom setup
- `frontend/src/views/PlansView.test.tsx` - 3 tests for DeleteConfirmModal
- `frontend/src/views/LoginView.test.tsx` - 4 tests for disabled submit button

## Decisions Made

- **--carb-dark value #C49A2E** - Lighter than #A0801F to ensure visibility on dark backgrounds, following the same pattern as --sage/--sage-dim and --coral/--coral-dim
- **Pending delete state structure** - Used `{ optIdx, itemIdx, name }` object instead of just the name, to avoid ambiguity when the user confirms deletion (exact indices for removal)
- **Meal deletion ID approach** - Stored `pendingMealId` as string ID rather than meal name to reliably find the meal on confirm, deriving the label for display via `meals.find()`

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- **jsdom missing from devDependencies** - vitest was listed in package.json but jsdom was not. Installed jsdom as dev dependency to enable jsdom test environment. This is Rule 3 (blocking) - missing dependency for test execution.

## Known Stubs

None - all carb colors use `var(--carb)` which resolves correctly in both light and dark themes; all SVG brand logos use `var(--lime)` via inline styles; delete confirmation is fully wired; login button disabled state works with validation guard.

## Threat Flags

No new threat surface introduced. All changes are client-only display concerns:
- CSS custom property overrides are display-only, no auth/authz boundaries
- DeleteConfirmModal is cosmetic (no server interaction)
- Disabled button is client-side UX, not a security control

## Next Phase Readiness

- All UAT gaps are closed: carbohydrate dark theme visibility, SVG lime color adaptation, deletion confirmation, login button validation feedback
- `npm run build` succeeds with 0 TypeScript errors
- Phase 2 frontend migration is now fully complete with all UAT fixes applied

---
*Phase: 02-frontend-migration*
*Completed: 2026-04-20*