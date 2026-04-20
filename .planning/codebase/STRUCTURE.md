# Structure — NutriAI

**Analysis Date:** 2026-04-19

## File Inventory

| File | Lines | Purpose | Key Exports |
|------|-------|---------|-------------|
| `NutriAI.html` | 177 | HTML entry point, App root component, auth router, tweaks panel | `App` |
| `shell.jsx` | 155 | Navigation chrome: Rail, Sidebar, Topbar | `Rail`, `Sidebar`, `Topbar` |
| `data.jsx` | 100 | Mock data constants | `PATIENTS`, `ANA`, `AGGREGATE` |
| `icons.jsx` | 42 | SVG icon primitives | `Icon`, `IconHome`, `IconUsers`, `IconPlan`, `IconInsight`, `IconBell`, `IconSettings`, `IconSearch`, `IconPlus`, `IconChevronR`, `IconChevronD`, `IconSparkle`, `IconWhatsapp`, `IconClock`, `IconTrend`, `IconMeal`, `IconScale`, `IconEdit`, `IconFilter`, `IconDots`, `IconAlert`, `IconCheck`, `IconX`, `IconArrowR`, `IconCalendar`, `IconDrop`, `IconTrash`, `IconArchive`, `IconDownload` |
| `viz.jsx` | 211 | Data visualization components | `Ring`, `MacroRings`, `Sparkline`, `WeekBars`, `LineChart`, `StackBar` |
| `styles.css` | 1726 | Complete stylesheet (themes, layout, all views) | N/A |
| `view_home.jsx` | 104 | Dashboard home view | `HomeView`, `KPI` |
| `view_patients.jsx` | 554 | Patient list, table/grid, pagination, modals, Avatar | `PatientsView`, `PatientTable`, `PatientGrid`, `Avatar`, `fakeSpark`, `NewPatientModal`, `Pagination`, `PAGE_SIZE`, `PatientMenuBtn` |
| `view_patient.jsx` | 944 | Patient detail (5 tabs), timeline, extraction editor, biometry charts | `PatientView`, `Timeline`, `EditPatientModal`, `MultiLineChart` |
| `view_plans.jsx` | 884 | Meal plan editor — meals, options, food rows, totals, PDF export | `PlansView` |
| `view_foods.jsx` | 340 | Food catalog view, search, create modal | `FoodsView`, `FOODS_CATALOG`, `FOOD_CATEGORIES` |
| `view_insights.jsx` | 180 | Aggregate intelligence dashboard | `InsightsView` |
| `view_landing.jsx` | 499 | Marketing landing page | `LandingView` |
| `view_login.jsx` | 93 | Login form | `LoginView` |
| `view_signup.jsx` | 142 | 2-step signup form | `SignupView` |
| `view_onboarding.jsx` | 163 | 4-step onboarding wizard | `OnboardingView` |
| `TASKS.md` | 114 | Project task tracker | N/A |

## Module Dependencies

**Load order** (from `NutriAI.html` script tags):

```
1. icons.jsx        → depends on: React (global)
2. data.jsx         → depends on: nothing (pure data)
3. viz.jsx          → depends on: React (global)
4. shell.jsx        → depends on: React, icons.jsx
5. view_landing.jsx → depends on: React, icons.jsx
6. view_login.jsx   → depends on: React, icons.jsx
7. view_signup.jsx  → depends on: React, icons.jsx
8. view_onboarding.jsx → depends on: React, icons.jsx
9. view_home.jsx    → depends on: React, data.jsx, viz.jsx, view_patients.jsx (Avatar, Pagination)
10. view_patients.jsx → depends on: React, data.jsx, icons.jsx, viz.jsx
11. view_patient.jsx → depends on: React, data.jsx, icons.jsx, viz.jsx, view_plans.jsx (PlansView)
12. view_plans.jsx  → depends on: React, icons.jsx, view_foods.jsx (FOODS_CATALOG)
13. view_foods.jsx  → depends on: React, icons.jsx, data.jsx
14. view_insights.jsx → depends on: React, data.jsx, viz.jsx
15. App (inline)    → depends on: all views, shell, data, icons
```

**Dependency graph (simplified):**

```
NutriAI.html
  ├─ React 18 CDN
  ├─ ReactDOM 18 CDN
  ├─ Babel standalone CDN
  ├─ styles.css
  ├─ icons.jsx ──┐
  ├─ data.jsx    │
  ├─ viz.jsx ────┤
  ├─ shell.jsx ──┤
  ├─ view_landing.jsx   ┤
  ├─ view_login.jsx      ┤
  ├─ view_signup.jsx     ┤
  ├─ view_onboarding.jsx ┤
  ├─ view_home.jsx ──────┤
  ├─ view_patients.jsx ──┤
  ├─ view_patient.jsx ───┤── view_plans.jsx ── view_foods.jsx (FOODS_CATALOG)
  ├─ view_plans.jsx ─────┘
  ├─ view_foods.jsx
  ├─ view_insights.jsx
  └─ <script> App component (inline)
```

All components register on `window` via `Object.assign(window, {...})` at the end of each file, making them globally available to downstream scripts.

## Entry Points

**HTML entry:** `NutriAI.html` — loads everything.

**Script loading order** is critical and must match the dependency chain. Babel standalone processes `<script type="text/babel">` tags sequentially.

**App initialization flow:**
1. Browser loads `NutriAI.html`
2. React 18 + ReactDOM 18 loaded from unpkg CDN
3. Babel standalone loaded from unpkg CDN
4. `styles.css` linked
5. Each `.jsx` file loaded and transpiled in order
6. Inline `<script>` block: `App()` component rendered to `<div id="root">`

**No hot reload.** Any change requires manual page refresh.

## Public vs Authenticated Views

### Public Views (unauthenticated)

| File | View Name | Route State | Purpose |
|------|-----------|-------------|---------|
| `view_landing.jsx` | `LandingView` | `authView="landing"` | Marketing homepage with pricing, features, FAQ |
| `view_login.jsx` | `LoginView` | `authView="login"` | Email/password login + Google OAuth button |
| `view_signup.jsx` | `SignupView` | `authView="signup"` | 2-step registration (personal info → professional profile) |
| `view_onboarding.jsx` | `OnboardingView` | `view="onboarding"` | 4-step onboarding wizard post-signup |

### Authenticated Views (panel)

| File | View Name | Route State | Purpose |
|------|-----------|-------------|---------|
| `view_home.jsx` | `HomeView` | `view="home"` | Dashboard — KPIs, recent activity, patient grid |
| `view_patients.jsx` | `PatientsView` | `view="patients"` | Patient list with table/grid modes, filters, CRUD |
| `view_patient.jsx` | `PatientView` | `view="patient"` | Patient detail with 5 tabs (today, plan, biometry, insights, history) |
| `view_plans.jsx` | `PlansView` | Tab in PatientView | Meal plan editor — meals, options, foods, PDF export |
| `view_foods.jsx` | `FoodsView` | `view="foods"` | Food catalog — base/preset items, search, pagination |
| `view_insights.jsx` | `InsightsView` | `view="insights"` | Aggregate portfolio intelligence, trends chart |

### Shared Navigation Shell

| File | Components | Purpose |
|------|------------|---------|
| `shell.jsx` | `Rail`, `Sidebar`, `Topbar` | Persistent navigation chrome for authenticated views |

## Data Model

### PATIENTS (`data.jsx`)

```javascript
// Array of 12 patient summary objects
{
  id: "p1",                    // Unique patient ID
  name: "Ana Beatriz Lopes",  // Full name
  initials: "AL",              // Avatar initials
  age: 34,                     // Age in years
  objective: "Hipertrofia",   // Clinical goal
  status: "ontrack",          // "ontrack" | "warning" | "danger"
  adherence: 92,               // 7-day adherence percentage
  weight: 64.2,                // Current weight (kg)
  weightDelta: +0.3,           // Weight change (kg)
  tag: "04 semanas"            // Duration label
}
```

### ANA (`data.jsx`) — Detailed patient object

```javascript
{
  id, name, initials, age, sex, height, objective, since, status, adherence,
  whatsapp,                       // Phone number (optional)
  macrosToday: {                   // Daily macro tracking
    kcal: { target, actual },
    prot: { target, actual },
    carb: { target, actual },
    fat:  { target, actual }
  },
  biometry: [{                    // Append-only assessment records
    date, method, weight, fat, lean, water, visceral, bmr
  }],
  skinfolds: {                    // Pollock 7-fold protocol
    date, method,
    folds: [{ name, value }]      // mm measurements
  },
  perimetry: {                    // Circumference measurements
    date,
    measures: [{ name, value, delta }]
  },
  weekAdherence: [],              // Array of 7 day adherence percentages
  weekMacroFill: [],             // Array of 7 day macro fill ratios
  timeline: [{                    // Meal timeline entries
    time, meal, label, kind,      // "plan" | "log" | "pending" | "upcoming"
    items: [],                    // Food item strings
    macros: { kcal, prot, carb, fat },
    status,                       // "ontrack" | "warning" | "danger" | "pending"
    adherence,                    // percentage or null
    aiNote,                       // optional AI-generated note
    hasMessage,                   // boolean
    offPlan                       // boolean (true if not in plan)
  }],
  aiSummary: ""                   // AI-generated text summary
}
```

### AGGREGATE (`data.jsx`)

```javascript
{
  active: 48,           // Total active patients
  onTrack: 31,          // On-track count
  warning: 12,           // Warning count
  danger: 5,             // Danger count
  avgAdherence: 82,     // Average adherence %
  avgAdherenceWoW: +3,  // Week-over-week change
  avgRetention: 87,      // Average retention %
  alerts: [{ level, patient, text, ts }],
  patterns: [{ title, body }]
}
```

### FOODS_CATALOG (`view_foods.jsx`)

```javascript
// Base food items
{
  id: "f1",
  type: "base",           // "base" | "preset"
  name: "Arroz integral cozido",
  category: "Carboidrato",
  per100: { kcal, prot, carb, fat, fiber },
  portions: [{ name, grams }],
  used: 38                // Times used in plans
}

// Preset food items
{
  id: "p1",
  type: "preset",
  name: "Frango desfiado · 100g",
  category: "Proteína",
  portionLabel: "100g · pronto",
  grams: 100,
  nutrition: { kcal, prot, carb, fat },
  basedOn: "Frango desfiado cozido",
  used: 44
}
```

### INITIAL_MEALS (`view_plans.jsx`)

```javascript
{
  id: "almoco",
  label: "Almoço",
  time: "12:30",
  kcal: 620, prot: 45, carb: 62, fat: 20
}
```

### INITIAL_OPTIONS (`view_plans.jsx`)

```javascript
{
  name: "Opção 1 · Clássico",
  items: [{ food, qty, prep, kcal, prot, carb, fat }]
}
```

## Icon System

All icons are defined in `icons.jsx` as React components using a shared `Icon` base component:

```jsx
const Icon = ({ d, size = 16, children, fill = "none", ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...rest}>
    {d ? <path d={d} /> : children}
  </svg>
);
```

**29 icons exported:** IconHome, IconUsers, IconPlan, IconInsight, IconBell, IconSettings, IconSearch, IconPlus, IconChevronR, IconChevronD, IconSparkle, IconWhatsapp, IconClock, IconTrend, IconMeal, IconScale, IconEdit, IconFilter, IconDots, IconAlert, IconCheck, IconX, IconArrowR, IconCalendar, IconDrop, IconTrash, IconArchive, IconDownload

**Pattern:** Each icon is a function component that spreads `props` into `Icon`, using either the `d` prop (path data string) or `children` (multiple path elements).

**Styling:** All icons use `stroke="currentColor"` and `strokeWidth="1.5"` for a hairline feel consistent with the design system.

## CSS Organization

`styles.css` (1726 lines) is organized in these major sections:

| Lines | Section | Purpose |
|-------|---------|---------|
| 1–38 | `:root` variables | Core palette, accents, semantic tokens, radii, fonts |
| 40–70 | `[data-theme]` themes | Light and dark theme definitions |
| 72–81 | Base resets | Box-sizing, body, scrollbar, typography classes |
| 83–97 | Utility classes | `.eyebrow`, `.mono`, `.serif`, `.tnum`, scrollbar |
| 98–290 | App shell | `.app`, `.rail`, `.sidebar`, `.search`, navigation, patient quick list |
| 293–330 | Main area | `.main`, `.topbar`, `.crumbs`, `.sidebar-toggle`, `.date-chip` |
| 334–496 | Buttons & controls | `.btn`, `.btn-ghost`, `.btn-secondary`, `.btn-primary`, `.btn-ai`, `.seg`, `.toggle` |
| 498–497 | Page & cards | `.page`, `.card`, `.card-h`, `.card-b`, `.chip`, `.divider` |
| 432–496 | Tweaks panel | `.tweaks`, `.tweaks-h`, `.tweaks-b` |
| 500–1244 | Landing page | Nav, hero, steps, mockups, features, privacy, pricing, FAQ, CTA, footer |
| 1246–1473 | Auth pages | Login/signup split layout, form fields, OAuth button |
| 1475–1702 | Onboarding | Steps, cards, options, plan preview, invite link, success state |
| 1704–1726 | Responsive | `@media` breakpoints for 900px and 600px |

**CSS custom properties used throughout:**
- **Colors:** `--ink`, `--paper`, `--fg`, `--fg-muted`, `--fg-subtle`, `--lime`, `--lime-dim`, `--coral`, `--coral-dim`, `--sage`, `--sage-dim`, `--amber`, `--sky`
- **Surfaces:** `--bg`, `--bg-2`, `--bg-3`, `--surface`, `--surface-2`, `--border`, `--border-2`
- **Fonts:** `--font-ui` (Inter Tight), `--font-mono` (JetBrains Mono), `--font-serif` (Instrument Serif)
- **Radii:** `--radius-sm` (3px), `--radius` (6px), `--radius-lg` (10px)

**Theming approach:** `[data-theme="light"]` and `[data-theme="dark"]` selectors override CSS variables. Some components use explicit `[data-theme="dark"]` overrides for edge cases (like `.nav-item.active`, `.btn-primary`, chip colors).

## Where to Add New Code

**New view (authenticated):**
1. Create `view_<name>.jsx` in project root
2. Define the component function referencing existing patterns (Topbar crumbs, page container)
3. Export via `Object.assign(window, { <Name>View })`
4. Add `<script type="text/babel" src="view_<name>.jsx"></script>` to `NutriAI.html` BEFORE the inline App script
5. Add a conditional render block in `App`'s return: `{view === "<name>" && <<Name>View setView={setView} .../>}`
6. Add the nav item to `Rail`'s `items` array in `shell.jsx`
7. Add the sidebar nav item in `Sidebar`'s nav list

**New view (public/unauthenticated):**
1. Create `view_<name>.jsx` in project root
2. Same export pattern
3. Add script tag to HTML
4. Add `authView` case in `App`'s conditional rendering block
5. Add navigation link/button in existing auth views

**New component (shared):**
1. Define in the most relevant view file or create a new shared file
2. Export via `Object.assign(window, { ComponentName })`
3. Add script tag if new file
4. Import by referencing the global name in JSX

**New data:**
1. Add to `data.jsx` or to the relevant view's local constants
2. If shared across views, use `data.jsx` and export via `Object.assign(window, ...)`

**New icon:**
1. Add to `icons.jsx` following the `Icon` base component pattern
2. Add to the `Object.assign(window, {...})` export block

**New CSS:**
1. Add to `styles.css` in the appropriate section
2. Or add inline styles following the existing pattern (majority of component styles are inline)

## Special Directories

| Directory | Purpose | Generated | Committed |
|-----------|---------|-----------|-----------|
| `.planning/codebase/` | GSD codebase analysis documents | No | Yes |
| `.planning/` | GSD project planning | No | Yes |
| `.claude/` | Claude agent config | No | Yes |

**No `node_modules/`** — no npm/bun dependency installation.
**No `dist/` or `build/`** — no build output.
**No `__tests__/`** — no test infrastructure.

---

*Structure analysis: 2026-04-19*