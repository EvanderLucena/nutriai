# Stack — NutriAI

**Analysis Date:** 2026-04-19

## Runtime & Language

**Primary:**
- JavaScript (ES2020+) — JSX via Babel in-browser transpilation. All `.jsx` files are transpiled client-side by `@babel/standalone`.
- No TypeScript, no type-checking. All code is plain JavaScript with JSX.

**Runtime:**
- Browser-only SPA. No Node.js server, no server-side rendering.
- Runs entirely in the browser as a static site — open `NutriAI.html` directly or serve from any static file server.

## UI Framework

**Core:**
- React 18.3.1 — loaded via CDN UMD builds (`react.development.js`, `react-dom.development.js`)
- Rendering: `ReactDOM.createRoot()` API (`NutriAI.html:174`)
- No virtual DOM optimization libraries

**Component Architecture:**
- All components are global functions assigned to `window` via `Object.assign(window, { ... })` at the end of each file
- No ES modules — every `.jsx` file is a `<script type="text/babel">` loaded in sequence via HTML
- No component lazy-loading — all views loaded upfront
- No React Router — view switching is done via `view` state in `App` component with conditional rendering (`if (view === "home") && <HomeView .../>`)

**Key React APIs Used:**
- `React.useState` — primary state management
- `React.useMemo` — computed/filtered data (patient lists, search, pagination)
- `React.useEffect` — side effects (localStorage, media queries, postMessage)
- `React.useRef` — DOM references (SVG chart hover, menu positioning)
- `ReactDOM.createPortal` — dropdown menus rendered to `document.body`

## State Management

**Approach: Prop drilling (no global store)**

All state lives in the `App` component (`NutriAI.html:39-171`) and is passed down via props:

```
App state → props → Rail, Sidebar, Topbar, *View components
```

**Key state variables in App:**
- `authView` — current auth screen ("landing" | "login" | "signup" | null)
- `isAuthenticated` — boolean gate for app vs. auth flow
- `view` — current main view ("home" | "patients" | "patient" | "foods" | "insights")
- `activePatientId` — selected patient ("p1" through "p12")
- `statusFilter` — sidebar patient filter ("all" | "ontrack" | "warning" | "danger")
- `patients` — array of patient objects (mutable via `setPatients`)
- `tweaks` — edit-mode overrides (theme, patientStatus)
- `sidebarOpen` — responsive sidebar toggle

**State persistence:**
- `localStorage` for `nutriai.view` and `nutriai.patient` (read on mount, written on change)
- No other persistence — all patient data, plan data, and food catalog are in-memory only

**No Redux, Zustand, Context API, or other state libraries used.** All state is `useState` + prop drilling.

## Styling

**Approach: Single CSS file with CSS custom properties**

- Single stylesheet: `styles.css` (1726 lines)
- No CSS-in-JS, no CSS Modules, no Tailwind, no PostCSS
- Component-level styles use inline `style={{}}` objects extensively

**Design Token System:**
- CSS custom properties defined in `:root` (`styles.css:2-38`)
- Theme switch via `[data-theme="light"]` and `[data-theme="dark"]` selectors
- Theme toggled by setting `document.documentElement.setAttribute("data-theme", ...)` in `App` useEffect

**Color Palette (CSS custom properties):**
- `--ink` / `--ink-2` / `--ink-3` — dark foregrounds
- `--paper` / `--paper-2` / `--paper-3` — light backgrounds
- `--lime` / `--lime-dim` — brand accent (primary call-to-action, AI indicators)
- `--coral` / `--coral-dim` — danger status
- `--sage` / `--sage-dim` — success/on-track status
- `--amber` — warning status
- `--sky` — fat macro color
- `--fg` / `--fg-muted` / `--fg-subtle` — text hierarchy

**Typography:**
- `--font-ui`: `'Inter Tight'` — primary UI font (weights 400-700)
- `--font-mono`: `'JetBrains Mono'` — data, numbers, labels (weights 400-600)
- `--font-serif`: `'Instrument Serif'` — headings, hero text (italic variant used)
- All loaded via Google Fonts CDN with `preconnect`

**Responsive:**
- Media query at `1200px` for sidebar auto-collapse (`matchMedia` + `useEffect`)
- Media queries at `900px` and `600px` for landing/auth layout changes
- No CSS Grid auto-placement for the main app — fixed widths for rail (56px) and sidebar (288px)

## Data Layer

**Approach: Hardcoded mock data in global constants**

- `PATIENTS` array — 12 mock patient objects (`data.jsx:2-15`)
- `ANA` object — detailed single-patient data with biometry, timeline, skinfolds, perimetry (`data.jsx:18-76`)
- `AGGREGATE` object — portfolio-level stats and AI-generated insights (`data.jsx:79-98`)
- `FOODS_CATALOG` array — 17 food items (12 bases + 5 presets) in `view_foods.jsx:2-74`
- `INITIAL_MEALS` / `INITIAL_OPTIONS` — meal plan structure in `view_plans.jsx:2-31`
- `INITIAL_EXTRAS` — off-plan food authorizations in `view_plans.jsx:792-798`

**No API calls, no fetch, no WebSocket, no real-time data.** All data is static and in-memory.

**Data mutation:**
- Patient list updates via `setPatients()` (toggle active/inactive, edit patient fields)
- Meal plan state is local to `PlansView` via `useState` (options, meals, extras)
- No persistence of mutations — refreshing the page resets everything

**Data model patterns:**
- Patient status enum: `"ontrack"` | `"warning"` | `"danger"` — used for color coding everywhere
- Macro structure: `{ kcal: { target, actual }, prot: { target, actual }, carb: { target, actual }, fat: { target, actual } }`
- Timeline event kinds: `"plan"` | `"log"` | `"pending"` | `"upcoming"`
- Food types: `"base"` (per-100g nutrition) vs `"preset"` (pre-calculated portion)

## Build & Tooling

**Build: None**

- No bundler (no Webpack, Vite, esbuild, Rollup)
- No package.json — zero npm dependencies
- No transpilation pipeline — Babel Standalone transpiles JSX in the browser at runtime
- No minification, no tree-shaking, no code splitting

**Dev workflow:**
- Open `NutriAI.html` in a browser → done
- File changes require only a page refresh
- No dev server required (can use any static file server or open directly)

**CDN Dependencies (loaded in `NutriAI.html`):**

| Library | Version | CDN | Integrity Hash |
|---------|---------|-----|----------------|
| React | 18.3.1 | unpkg.com | sha384-hD6/rw4ppMLGNu3tX5cjIb+uRZ7UkRJ6BPkLpg4hAu/6onKUg4lLsHAs9EBPT82L |
| React DOM | 18.3.1 | unpkg.com | sha384-u6aeetuaXnQ38mYT8rp6sbXaQe3NL9t+IBXmnYxwkUI2Hw4bsp2Wvmx4yRQF1uAm |
| Babel Standalone | 7.29.0 | unpkg.com | sha384-m08KidiNqLdpJqLq95G/LEi8Qvjl/xUYll3QILypMoQ65QorJ9Lvtp2RXYGBFj1y |
| Google Fonts | (latest) | fonts.googleapis.com | — |

**Script Load Order (critical):**
```
1. icons.jsx     — Icon components (no dependencies)
2. data.jsx      — Mock data constants (no dependencies)
3. viz.jsx       — Chart/visualization components (depends on React)
4. shell.jsx     — Rail, Sidebar, Topbar (depends on icons, data)
5. view_landing.jsx  — LandingView (depends on React)
6. view_login.jsx    — LoginView
7. view_signup.jsx   — SignupView
8. view_onboarding.jsx — OnboardingView
9. view_home.jsx     — HomeView, KPI (depends on data, viz, shell)
10. view_patients.jsx — PatientsView, PatientTable, PatientGrid (depends on data, viz, shell)
11. view_patient.jsx — PatientView, Timeline, Biometry tabs (depends on data, viz, shell)
12. view_plans.jsx   — PlansView, food editor (depends on icons, data)
13. view_foods.jsx   — FoodsView, food catalog (depends on icons)
14. view_insights.jsx — InsightsView (depends on data, viz)
```

**Edit Mode / Live Tweaks:**
- Hidden tweaks panel toggled via `window.postMessage` protocol
- `__activate_edit_mode` / `__deactivate_edit_mode` messages control visibility
- Tweak values (theme, patientStatus) sent to parent via `__edit_mode_set_keys` message
- `TWEAK_DEFAULTS` block with `/*EDITMODE-BEGIN*/` / `/*EDITMODE-END*/` markers for external editor integration

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| react | 18.3.1 (CDN UMD) | UI framework — component rendering, state, effects |
| react-dom | 18.3.1 (CDN UMD) | DOM rendering via `createRoot` API |
| @babel/standalone | 7.29.0 (CDN) | In-browser JSX transpilation for `<script type="text/babel">` |
| Google Fonts — Inter Tight | (latest) | Primary UI typeface (400-700 weights) |
| Google Fonts — JetBrains Mono | (latest) | Monospace for data/numbers (400-600 weights) |
| Google Fonts — Instrument Serif | (latest) | Serif for headings (regular + italic) |

## Key Technical Patterns

**Global component registration:**
Every file exports components via `Object.assign(window, { ComponentName })`. This is required because there are no ES modules — all scripts share the global scope.

**Inline styling:**
Heavy use of `style={{}}` objects on JSX elements. CSS classes are used for structural layout (`.app`, `.sidebar`, `.card`) while visual customization is inline. No CSS-in-JS library.

**SVG data visualization:**
All charts (Sparkline, LineChart, MultiLineChart, Ring, MacroRings, WeekBars, StackBar, CarteiraChart) are hand-coded SVG in React components (`viz.jsx`, `view_patient.jsx`, `view_insights.jsx`). No chart library (no D3, Recharts, Chart.js).

**PDF export:**
`PlansView` includes an `exportPDF()` function that opens a `window.open()` with generated HTML and calls `window.print()` — a browser-native print-to-PDF approach. No PDF library.

**Portals for dropdowns:**
`PatientMenuBtn` uses `ReactDOM.createPortal()` to render dropdown menus attached to `document.body` to avoid clipping issues.

---

*Stack analysis: 2026-04-19*