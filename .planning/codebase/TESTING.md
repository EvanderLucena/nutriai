# Testing — NutriAI

**Analysis Date:** 2026-04-19

## Current Test Infrastructure

### Test Framework
- **None.** There is no test framework, test runner, or testing configuration of any kind in the project.

### Test Configuration Files
- No `jest.config.*`, `vitest.config.*`, `karma.conf.*`, or any test configuration files exist
- No `__tests__` directories exist anywhere in the project
- No test-related scripts in any `package.json` (no `package.json` exists — the project has no Node.js package management)
- No CI/CD configuration files (no `.github/workflows/`, no `.gitlab-ci.yml`, no `circle.yml`)

## Test Coverage

### Existing Tests
**Zero test coverage.** No test files exist anywhere in the project:
- No `*.test.*` files
- No `*.spec.*` files
- No `test/` or `tests/` directory
- No snapshot tests
- No end-to-end tests

### Code Without Tests
Every component in the codebase is untested:

| File | Key Untested Logic |
|------|-------------------|
| `NutriAI.html` | Auth routing, localStorage persistence, sidebar collapse logic, theme switching, tweak panel |
| `shell.jsx` | Sidebar patient filtering, status filter counts, search filtering |
| `data.jsx` | Mock data integrity (no assertions on structure) |
| `icons.jsx` | Icon rendering (low priority but no tests verify SVG output) |
| `viz.jsx` | `Ring` percentage calculation, `Sparkline` SVG path generation, `LineChart` hover/tooltip logic, `WeekBars` height calculation, `StackBar` segment width |
| `view_home.jsx` | KPI rendering, activity feed, pagination |
| `view_patients.jsx` | Patient filtering (status, objective, search), pagination, toggle active/inactive, edit patient modal |
| `view_patient.jsx` | Tab switching, today view, timeline rendering, extraction editor, biometry chart, history pagination |
| `view_plans.jsx` | Meal plan CRUD (add/remove/edit items), option management (add/remove/rename), meal addition, total macro calculation, PDF export |
| `view_foods.jsx` | Food catalog filtering (category, search), food card rendering, create food modal |
| `view_insights.jsx` | Aggregate insights display, chart hover/tooltip |
| `view_landing.jsx` | Static landing page content (lowest priority for testing) |
| `view_login.jsx` | Form validation, auth state transition |
| `view_signup.jsx` | Multi-step form, validation, step transitions |
| `view_onboarding.jsx` | Step progression, step dots UI |

## Test Types Present

| Type | Status | Details |
|------|--------|---------|
| Unit Tests | ❌ Not present | No individual function or component tests |
| Integration Tests | ❌ Not present | No tests verifying component interactions |
| E2E Tests | ❌ Not present | No browser automation tests |
| Visual Regression | ❌ Not present | No screenshot/snapshot comparison |
| Accessibility Tests | ❌ Not present | No a11y testing |
| Performance Tests | ❌ Not present | No performance benchmarks |

## Testing Gaps

### Critical Paths Without Tests

**1. Data Computation Logic (Highest Priority)**
- `view_plans.jsx` — Macro totals calculation in `PlansView` and `ExtractionEditor`:
  ```jsx
  const optTotals = activeOpt.items.reduce((a, x) => ({
    kcal: a.kcal + (Number(x.kcal)||0),
    prot: a.prot + (Number(x.prot)||0),
    carb: a.carb + (Number(x.carb)||0),
    fat:  a.fat  + (Number(x.fat) ||0),
  }), {kcal:0, prot:0, carb:0, fat:0});
  ```
  This is clinical nutrition data — incorrect totals could直接影响 patient care.

- `viz.jsx` — SVG chart calculations (path generation, coordinate mapping, hover positioning in `LineChart` and `MultiLineChart`)

**2. State Management**
- Auth routing logic in `App` component (`NutriAI.html`) — untested conditional rendering based on `isAuthenticated` and `authView`
- localStorage read/write for view persistence — `try/catch` blocks silently fail

**3. Filter/Search Logic**
- `view_patients.jsx` — Multi-criteria filtering (status, objective, search text, active/inactive toggle) — `useMemo` chains that could have subtle bugs
- `view_foods.jsx` — Category filter + search combination

**4. Form Validation**
- `view_login.jsx` — Simple "fill all fields" validation
- `view_signup.jsx` — Multi-step validation (step 1: name/email/password; step 2: CRN/regional/terms)
- `view_patient.jsx` — Edit patient modal (name required)
- `view_plans.jsx` — Add meal/food validation

**5. Data Mutations**
- Patient toggle active/inactive (`setPatients` map operations)
- Plan item add/remove/update operations
- Food item add/remove operations
- No data layer abstraction — all mutations are on React state

### Accessibility Gaps (Untested)
- No `aria-label` attributes on interactive elements
- No `role` attributes on custom components (chips, segmented controls, dropdowns)
- No keyboard navigation testing for modals and dropdowns
- No focus trap implementation in modals (clicking overlay closes, but Tab may escape)
- Color contrast not tested (though the design appears intentional)

## Recommended Testing Strategy

### Priority 1: Setup Infrastructure
Since there is no build system or package management, adding tests requires:

1. **Add a `package.json`** with:
   - React + ReactDOM (development, matching CDN versions)
   - Vitest as test runner (modern, ESM-native, fast)
   - `@testing-library/react` for component testing
   - `jsdom` environment

2. **Restructure for testability** (optional, can be gradual):
   - Extract component definitions from global `window` registration into ES modules
   - Create `src/` directory with proper module structure
   - Keep current structure as fallback during migration

3. **Configuration files needed:**
   - `vitest.config.js`
   - `package.json` with test scripts
   - Consider `setupTests.js` for React Testing Library

### Priority 2: Unit Tests for Pure Functions
Test pure logic that doesn't depend on React rendering:

| Function | File | Why Test |
|----------|------|----------|
| Macro totals calculation | `view_plans.jsx` | Clinical data accuracy |
| Patient filtering | `view_patients.jsx` | Multiple filter criteria |
| Food filtering | `view_foods.jsx` | Category + search interaction |
| SVG path generation | `viz.jsx` | Mathematical correctness |
| Percentage calculations | `viz.jsx` (Ring) | Edge cases (0%, 100%, >100%) |

### Priority 3: Component Tests
Test key UI component behaviors:

| Component | What to Test |
|-----------|-------------|
| `App` | Auth routing (landing → login → home), view switching, localStorage persistence |
| `LoginView` | Form submission, error display, navigation to signup |
| `SignupView` | Step transitions, field validation, form data assembly |
| `PatientView` | Tab switching, status override from tweaks |
| `PlansView` | Add/remove food items, macro total recalculation, option CRUD |
| `NewPatientModal` | Form field rendering, submit/close actions |

### Priority 4: Integration Tests
- Auth flow end-to-end: Landing → Signup → Onboarding → Home → Sidebar navigation → Patient detail
- Plan editing: Open plan → Add food → Edit quantity → Verify totals update → Save
- Patient management: Filter → Select → Edit → Toggle active → Verify list updates

### Priority 5: E2E Tests
Consider Playwright or Cypress for:
- Landing page renders correctly in both themes
- Auth forms submit and transition views
- Sidebar navigation routes correctly
- Patient list filtering and sorting
- Meal plan editing and macro calculations

## CI/CD

### Current State
**No CI/CD configuration exists.** No `.github/workflows/`, no `Makefile`, no deployment scripts.

### Recommended CI Setup
If a `package.json` and build step are added:

```yaml
# .github/workflows/test.yml (example)
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm test
      - run: npm run lint
```

### Build Tool Gap
The current project has **no build system** — JSX is transpiled client-side via Babel standalone:
```html
<script src="https://unpkg.com/@babel/standalone@7.29.0/babel.min.js" ...></script>
<script type="text/babel" src="shell.jsx"></script>
```

This means:
- No bundling, minification, or tree-shaking
- No source maps for production debugging
- No module system (components communicate via `window` global)
- No way to import test utilities without architectural changes

### Migration Path
To enable testing, the minimum changes are:
1. Add `package.json` with React, Vitest, Testing Library
2. Create `vitest.config.js` with jsdom environment
3. Create `src/` directory and mirror existing components as ES modules
4. Write initial tests against extracted pure functions
5. Gradually convert `Object.assign(window, ...)` exports to ES module exports

---

*Testing analysis: 2026-04-19*