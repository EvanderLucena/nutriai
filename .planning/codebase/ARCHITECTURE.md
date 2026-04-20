# Architecture — NutriAI

**Analysis Date:** 2026-04-19

## High-Level Architecture

NutriAI is a **single-page application** built as a single HTML file with React 18, transpiled in-browser via Babel standalone. There is **no build step, no bundler, and no module system**. All components are declared as global functions on the `window` object and loaded via `<script type="text/babel">` tags in a specific dependency order.

The app has two distinct domains:
- **Public flows** (landing, login, signup, onboarding) — unauthenticated
- **Authenticated panel** (home, patients, patient detail, plans, foods, insights) — behind auth guard

State is managed entirely via React `useState` / `useEffect` hooks in the root `App` component, with props drilled down to child views. There is no external state management library.

## Component Tree

```
App (NutriAI.html)
├── [unauthenticated]
│   ├── LandingView          (view_landing.jsx)
│   ├── LoginView            (view_login.jsx)
│   ├── SignupView           (view_signup.jsx)
│   └── OnboardingView       (view_onboarding.jsx)
│
└── [authenticated]
    ├── Rail                 (shell.jsx) — icon sidebar
    ├── Sidebar              (shell.jsx) — patient list + nav
    ├── main.main
    │   ├── HomeView         (view_home.jsx)
    │   ├── PatientsView     (view_patients.jsx)
    │   ├── PatientView      (view_patient.jsx)
    │   │   ├── TodayTab
    │   │   ├── PlansView     (view_plans.jsx) — embedded as tab
    │   │   ├── BiometryTab
    │   │   ├── InsightsTab
    │   │   └── HistoryTab
    │   ├── FoodsView        (view_foods.jsx)
    │   └── InsightsView     (view_insights.jsx)
    └── Tweaks panel          (inline in App)
```

**Key shared components** (defined across files, registered on `window`):
- `Topbar` (shell.jsx) — breadcrumb header for authenticated views
- `KPI` (view_home.jsx) — metric card for dashboard
- `PatientGrid` / `PatientTable` (view_patients.jsx) — table/grid toggle
- `Pagination` (view_patients.jsx) — reused across list views
- `Avatar` (view_patients.jsx) — patient avatar with status dot
- `Ring` / `MacroRings` / `Sparkline` / `WeekBars` / `LineChart` / `StackBar` (viz.jsx) — data visualization primitives
- `NewPatientModal` / `EditPatientModal` (view_patients.jsx) — patient CRUD modals
- `Timeline` / `ExtractionEditor` (view_patient.jsx) — meal timeline with inline editing
- `NewBiometryModal` (view_patient.jsx) — biometric assessment form
- `EditFoodModal` / `AddFoodModal` / `AddMealModal` (view_plans.jsx) — food/meal modals
- `Icon*` (icons.jsx) — 29 icon components

## Routing & Navigation

**There is no router.** Navigation is driven by two pieces of state in `App`:

1. **`authView`** (`"landing"` | `"login"` | `"signup"`) — controls which unauthenticated view renders.
2. **`view`** (`"home"` | `"patients"` | `"patient"` | `"foods"` | `"insights"` | `"onboarding"`) — controls which authenticated view renders.

**Auth flow:**
- `isAuthenticated` starts `false`. When `false`, `authView` determines which public view renders.
- `handleLogin()` / `setAuthAndView('home')` sets `isAuthenticated = true` and switches to the panel.
- `handleLogout()` resets to `isAuthenticated = false`, `authView = "landing"`.

**Within authenticated panel:**
- `Rail` buttons call `setView(id)` to switch top-level views.
- `Sidebar` patient items call `setActivePatientId(id); setView("patient")` to open a specific patient.
- `PatientView` has its own `tab` state (`"today"` | `"plan"` | `"biometry"` | `"insights"` | `"history"`) for sub-navigation.
- View and active patient ID are persisted to `localStorage` (`nutriai.view`, `nutriai.patient`).

**Sidebar toggle:**
- Responsive: `window.matchMedia("(max-width: 1200px)")` auto-collapses sidebar.
- Manual: `window._sidebarToggle()` exposed via `useEffect`, called by `Topbar` hamburger button.

## Data Flow

**All data is mock/static**, defined in `data.jsx`:
- `PATIENTS` — array of 12 patient objects
- `ANA` — deep detail object for the focused patient (p1)
- `AGGREGATE` — portfolio-level statistics and alerts

**State lift pattern:**
```
App (root state)
 ├── patients          ← PATIENTS initial, mutable via setPatients
 ├── activePatientId   ← string, persisted to localStorage
 ├── view              ← string, persisted to localStorage
 ├── authView          ← string
 ├── isAuthenticated   ← boolean
 ├── statusFilter      ← string (sidebar filter)
 ├── sidebarOpen       ← boolean
 ├── tweaks            ← {theme, patientStatus} (edit mode)
 └── tweaksOpen        ← boolean (edit mode panel)
```

Props flow downward:
- `HomeView` ← `patients`, `setView`, `setActivePatientId`
- `PatientsView` ← `patients`, `setPatients`, `setView`, `setActivePatientId`
- `PatientView` ← `setView`, `overrideStatus` (from tweaks)
- `PlansView` ← `setView`
- `FoodsView` ← `setView`
- `InsightsView` ← `setView`, `setActivePatientId`

**No API calls.** All mutations (edit patient, add patient, edit food items, etc.) mutate local React state and are lost on page refresh.

**Tweaks panel** (edit mode) communicates with a parent frame via `window.postMessage` for live editing in a design tool context.

## Key Architectural Decisions

| Decision | Rationale | Trade-offs |
|----------|-----------|------------|
| No build step; Babel standalone in-browser | Prototyping speed, single-file deploy, easy to share | No tree-shaking, no minification, poor performance at scale, no HMR |
| Global `window` components (`Object.assign(window, {...})`) | Avoids module system complexity in single-HTML setup | No encapsulation, global namespace pollution, name collision risk |
| All state in root `App` component | Simple prop-drilling, easy to trace | Deep prop chains, hard to refactor; no centralized state management |
| Mock data in `data.jsx` | Allows full UI development without backend | No persistence, no real data flow, all CRUD is cosmetic |
| Inline styles (no CSS modules/styled-components) | Maximum flexibility, self-contained components | Difficult to override, no style reuse, massive JSX |
| `localStorage` for view/patient persistence | Simple UX for demo | Fragile, no sync, can break across versions |
| PlansView embedded as PatientView tab | Contextual meal plan editing under patient detail | Tight coupling, no standalone plans listing in sidebar |

## Separation of Concerns

**By file:**

| File | Responsibility |
|------|---------------|
| `NutriAI.html` | Entry point, App root component, auth logic, tweaks panel |
| `shell.jsx` | Navigation chrome: Rail (icon sidebar), Sidebar (patient list + nav), Topbar (breadcrumbs) |
| `data.jsx` | Static mock data (patients, ANA detail, aggregate stats) |
| `icons.jsx` | SVG icon primitives (29 icons) |
| `viz.jsx` | Data viz components (Ring, MacroRings, Sparkline, WeekBars, LineChart, StackBar, MultiLineChart) |
| `styles.css` | All styles — themes, layout, components, auth, landing, onboarding |
| `view_home.jsx` | Dashboard home view + KPI component |
| `view_patients.jsx` | Patient list (table/grid), pagination, modals (new/edit), filters, Avatar |
| `view_patient.jsx` | Patient detail (5 tabs), timeline, extraction editor, biometry, edit modal |
| `view_plans.jsx` | Meal plan editor — meals, options, food rows, totals, PDF export, extras |
| `view_foods.jsx` | Food catalog — base/preset cards, search, pagination, create modal |
| `view_insights.jsx` | Aggregate intelligence view, CarteiraChart |
| `view_landing.jsx` | Marketing landing page |
| `view_login.jsx` | Login form |
| `view_signup.jsx` | 2-step signup form |
| `view_onboarding.jsx` | 4-step onboarding wizard |
| `TASKS.md` | Project task tracker |

**Cross-cutting patterns:**
- **Colors/status**: Three tiers (`ontrack`/`warning`/`danger`) mapped to CSS variables (`--sage`/`--amber`/`--coral`).
- **Typography**: Three font families — `Inter Tight` (UI), `JetBrains Mono` (data/labels), `Instrument Serif` (headings).
- **Theming**: Light/dark via `data-theme` attribute on `<html>`, toggled by tweaks panel.
- **All text is pt-BR** — Portuguese Brazilian throughout.

## Error Handling

**Strategy:** No formal error handling. There is:
- No try/catch in component logic
- No error boundaries
- No form validation (beyond required field checks like `!name.trim()` disabling buttons)
- No API error states (no API)
- Form `onSubmit` handlers only check for empty required fields

## Cross-Cutting Concerns

**Logging:** `console.log` only — no structured logging. The app is a prototype.

**Validation:** Minimal. Input validation exists only where buttons are disabled on empty strings (e.g., edit patient name, food item name). No number range validation on numeric inputs.

**Authentication:** Cosmetic only. `handleLogin()` simply sets `isAuthenticated = true`. No token, no session, no real auth check.

**Internationalization:** All strings are hardcoded pt-BR. No i18n system.

**Accessibility:** No ARIA attributes, no keyboard navigation beyond native HTML, no focus management in modals (modals use `onClick={onClose}` on backdrop but no focus trap).

---

*Architecture analysis: 2026-04-19*