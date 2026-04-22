<!-- GSD:project-start source:PROJECT.md -->
## Project

**NutriAI**

Painel clínico para nutricionistas solo (Brasil) que gerencia pacientes, planos alimentares, catálogo de alimentos e insights — com IA respondendo ao paciente via WhatsApp com base no plano alimentar. Hoje é um protótipo funcional (HTML/CSS/JS puro, React 18 via CDN, dados mockados) e precisa migrar para produção: monorepo com frontend moderno (React+TypeScript+Vite+Tailwind), backend real (Java 21+Spring Boot+PostgreSQL), e containers Docker para deploy em VPS.

**Core Value:** O nutricionista cria o plano alimentar e acompanha seus pacientes em um painel web, enquanto a IA responde ao paciente via WhatsApp usando o plano como base — tirando dúvidas e captando dados das refeições reais.

### Constraints

- **Tech stack front**: React + TypeScript + Vite + Tailwind — decisão tomada, não negociável
- **Tech stack back**: Java 21 + Spring Boot + PostgreSQL — decisão tomada, não negociável
- **WhatsApp**: Evolution API (open-source, self-hosted) como gateway desde o início
- **Deploy separado**: Monorepo pra desenvolvimento, mas cada projeto gera imagem Docker independente
- **Preservar UI**: Telas já 90% prontas visualmente — não redesenhar, só migrar estrutura
- **Isolamento**: Cada nutricionista só vê seus pacientes (sem multi-tenancy de clínica)
- **Idioma**: Tudo em pt-BR
- **LGPD**: Compliance obrigatório (dados de saúde são sensíveis)
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Runtime & Language
- JavaScript (ES2020+) — JSX via Babel in-browser transpilation. All `.jsx` files are transpiled client-side by `@babel/standalone`.
- No TypeScript, no type-checking. All code is plain JavaScript with JSX.
- Browser-only SPA. No Node.js server, no server-side rendering.
- Runs entirely in the browser as a static site — open `NutriAI.html` directly or serve from any static file server.
## UI Framework
- React 18.3.1 — loaded via CDN UMD builds (`react.development.js`, `react-dom.development.js`)
- Rendering: `ReactDOM.createRoot()` API (`NutriAI.html:174`)
- No virtual DOM optimization libraries
- All components are global functions assigned to `window` via `Object.assign(window, { ... })` at the end of each file
- No ES modules — every `.jsx` file is a `<script type="text/babel">` loaded in sequence via HTML
- No component lazy-loading — all views loaded upfront
- No React Router — view switching is done via `view` state in `App` component with conditional rendering (`if (view === "home") && <HomeView .../>`)
- `React.useState` — primary state management
- `React.useMemo` — computed/filtered data (patient lists, search, pagination)
- `React.useEffect` — side effects (localStorage, media queries, postMessage)
- `React.useRef` — DOM references (SVG chart hover, menu positioning)
- `ReactDOM.createPortal` — dropdown menus rendered to `document.body`
## State Management
- `authView` — current auth screen ("landing" | "login" | "signup" | null)
- `isAuthenticated` — boolean gate for app vs. auth flow
- `view` — current main view ("home" | "patients" | "patient" | "foods" | "insights")
- `activePatientId` — selected patient ("p1" through "p12")
- `statusFilter` — sidebar patient filter ("all" | "ontrack" | "warning" | "danger")
- `patients` — array of patient objects (mutable via `setPatients`)
- `tweaks` — edit-mode overrides (theme, patientStatus)
- `sidebarOpen` — responsive sidebar toggle
- `localStorage` for `nutriai.view` and `nutriai.patient` (read on mount, written on change)
- No other persistence — all patient data, plan data, and food catalog are in-memory only
## Styling
- Single stylesheet: `styles.css` (1726 lines)
- No CSS-in-JS, no CSS Modules, no Tailwind, no PostCSS
- Component-level styles use inline `style={{}}` objects extensively
- CSS custom properties defined in `:root` (`styles.css:2-38`)
- Theme switch via `[data-theme="light"]` and `[data-theme="dark"]` selectors
- Theme toggled by setting `document.documentElement.setAttribute("data-theme", ...)` in `App` useEffect
- `--ink` / `--ink-2` / `--ink-3` — dark foregrounds
- `--paper` / `--paper-2` / `--paper-3` — light backgrounds
- `--lime` / `--lime-dim` — brand accent (primary call-to-action, AI indicators)
- `--coral` / `--coral-dim` — danger status
- `--sage` / `--sage-dim` — success/on-track status
- `--amber` — warning status
- `--sky` — fat macro color
- `--fg` / `--fg-muted` / `--fg-subtle` — text hierarchy
- `--font-ui`: `'Inter Tight'` — primary UI font (weights 400-700)
- `--font-mono`: `'JetBrains Mono'` — data, numbers, labels (weights 400-600)
- `--font-serif`: `'Instrument Serif'` — headings, hero text (italic variant used)
- All loaded via Google Fonts CDN with `preconnect`
- Media query at `1200px` for sidebar auto-collapse (`matchMedia` + `useEffect`)
- Media queries at `900px` and `600px` for landing/auth layout changes
- No CSS Grid auto-placement for the main app — fixed widths for rail (56px) and sidebar (288px)
## Data Layer
- `PATIENTS` array — 12 mock patient objects (`data.jsx:2-15`)
- `ANA` object — detailed single-patient data with biometry, timeline, skinfolds, perimetry (`data.jsx:18-76`)
- `AGGREGATE` object — portfolio-level stats and AI-generated insights (`data.jsx:79-98`)
- `FOODS_CATALOG` array — 17 food items (12 bases + 5 presets) in `view_foods.jsx:2-74`
- `INITIAL_MEALS` / `INITIAL_OPTIONS` — meal plan structure in `view_plans.jsx:2-31`
- `INITIAL_EXTRAS` — off-plan food authorizations in `view_plans.jsx:792-798`
- Patient list updates via `setPatients()` (toggle active/inactive, edit patient fields)
- Meal plan state is local to `PlansView` via `useState` (options, meals, extras)
- No persistence of mutations — refreshing the page resets everything
- Patient status enum: `"ontrack"` | `"warning"` | `"danger"` — used for color coding everywhere
- Macro structure: `{ kcal: { target, actual }, prot: { target, actual }, carb: { target, actual }, fat: { target, actual } }`
- Timeline event kinds: `"plan"` | `"log"` | `"pending"` | `"upcoming"`
- Food types: `"base"` (per-100g nutrition) vs `"preset"` (pre-calculated portion)
## Build & Tooling
- No bundler (no Webpack, Vite, esbuild, Rollup)
- No package.json — zero npm dependencies
- No transpilation pipeline — Babel Standalone transpiles JSX in the browser at runtime
- No minification, no tree-shaking, no code splitting
- Open `NutriAI.html` in a browser → done
- File changes require only a page refresh
- No dev server required (can use any static file server or open directly)
| Library | Version | CDN | Integrity Hash |
|---------|---------|-----|----------------|
| React | 18.3.1 | unpkg.com | sha384-hD6/rw4ppMLGNu3tX5cjIb+uRZ7UkRJ6BPkLpg4hAu/6onKUg4lLsHAs9EBPT82L |
| React DOM | 18.3.1 | unpkg.com | sha384-u6aeetuaXnQ38mYT8rp6sbXaQe3NL9t+IBXmnYxwkUI2Hw4bsp2Wvmx4yRQF1uAm |
| Babel Standalone | 7.29.0 | unpkg.com | sha384-m08KidiNqLdpJqLq95G/LEi8Qvjl/xUYll3QILypMoQ65QorJ9Lvtp2RXYGBFj1y |
| Google Fonts | (latest) | fonts.googleapis.com | — |
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
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Naming Conventions
### Files
- **View files:** `view_{name}.jsx` — lowercase with underscores (e.g., `view_home.jsx`, `view_patient.jsx`, `view_foods.jsx`)
- **Shared modules:** Single-word lowercase with `.jsx` extension (e.g., `shell.jsx`, `data.jsx`, `icons.jsx`, `viz.jsx`)
- **Entry point:** `NutriAI.html` — capitalized PascalCase product name
- **Styles:** Single `styles.css` file at project root
- **Config:** `TASKS.md`, `opencode.json` at root
### Components
- **PascalCase** for all React components: `HomeView`, `PatientView`, `PlansView`, `KPI`, `Avatar`, `Topbar`, `Ring`, `Sparkline`
- **PascalCase** for icon components with `Icon` prefix: `IconHome`, `IconUsers`, `IconPlan`, `IconSearch`
- **PascalCase** for utility/UI components: `NewPatientModal`, `EditPatientModal`, `AddFoodModal`, `Pagination`
### Variables
- **camelCase** for local variables and state: `activePatientId`, `statusFilter`, `newPatientOpen`
- **UPPER_SNAKE_CASE** for constants/data: `PATIENTS`, `ANA`, `AGGREGATE`, `FOODS_CATALOG`, `FOOD_CATEGORIES`, `INITIAL_OPTIONS`, `INITIAL_MEALS`, `PAGE_SIZE`
- **camelCase** for state setters: `setView`, `setActivePatientId`, `setStatusFilter`
### CSS Classes
- **kebab-case** for all CSS classes: `.card-h`, `.card-b`, `.pq-item`, `.btn-primary`, `.landing-hero-title`
- **Abbreviated but readable:** `.pq-item` (patient quick item), `.btn` (button), `.seg` (segment control)
- **BEM-lite pattern:** Block-element without double-dashes: `.card` → `.card-h` (header), `.card-b` (body)
## Component Patterns
### Function Components Only
### State Hooks Pattern
- Use `React.useState`, `React.useMemo`, `React.useEffect`, `React.useRef` — hooks are accessed via the `React` global, NOT destructured in most files (exception: `shell.jsx` destructures at top)
- `shell.jsx` pattern: `const { useState, useEffect, useMemo, useRef } = React;`
- All other files: `React.useState()`, `React.useMemo()`, etc.
### Component Registration
### Prop Drilling
- `setView` — passed to almost every view to switch between views
- `setActivePatientId` — passed to views that navigate to a patient
- `patients` / `setPatients` — passed where patient list mutations are needed
- `setAuthView` — passed to auth views for navigation
### Inline Styles
- Use CSS classes from `styles.css` for structural elements (`.card`, `.page`, `.btn`, `.chip`, `.eyebrow`, `.mono`, `.serif`, `.tnum`, etc.)
- Use inline styles for one-off positioning, spacing, grid layouts, and component-specific colors
### Conditional Rendering
### Modal Pattern
## CSS / Styling Conventions
### Custom Properties (Design Tokens)
### Theme Switching
### Responsive Breakpoints
- **1200px:** Sidebar auto-collapses (`window.matchMedia("(max-width: 1200px)")`)
- **900px:** Landing page grid collapses to single column; auth left panel hides
- **600px:** Features grid collapses to single column; nav links hidden
### Typography Classes
- `.mono` — Monospace font (`--font-mono`) with tabular numerals
- `.tnum` — Tabular number spacing only (for alignment in tables)
- `.serif` — Serif font (`--font-serif`) for headings
- `.eyebrow` — Label style: mono, 10.5px, uppercase, letter-spacing 0.08em, muted color
### Key UI Component Classes
- `.card` / `.card-h` / `.card-b` — Card container with header/body
- `.btn` / `.btn-primary` / `.btn-secondary` / `.btn-ghost` / `.btn-ai` — Button variants
- `.chip` + `.chip.ontrack` / `.chip.warning` / `.chip.danger` / `.chip.ai` — Status badges
- `.seg` — Segmented control (theme toggle, view mode switch)
- `.divider` — Horizontal divider with label
- `.search` — Search input container
- `.pq-item` / `.pq-status` — Patient quick list items
- `.rail` / `.sidebar` / `.topbar` — App shell layout
- `.auth-page` / `.auth-field` / `.auth-input` — Auth form system
- `.onboard-*` — Onboarding step system
- `.landing-*` — Landing page system (extensive)
## Language & i18n
### UI Language
- **All UI text is in Portuguese (pt-BR)** — hard-coded in JSX strings
- No i18n framework or translation files
- Common patterns:
### Number Formatting
- Decimal separator: comma (pt-BR convention), e.g., `"1.840"` with period for thousands
- Some values use `toLocaleDateString('pt-BR')` for date formatting
## State Management Patterns
### App-Level State (in `NutriAI.html`)
- `authView` — controls which auth screen is shown
- `isAuthenticated` — auth gate
- `view` — current main view ("home", "patients", "patient", "foods", "insights", "onboarding")
- `activePatientId` — selected patient
- `statusFilter` — patient list filter
- `patients` — patient data array (mutable via `setPatients`)
- `tweaks` — edit mode state (theme, patientStatus override)
- `sidebarOpen` — sidebar visibility
### Local State
- `const [tab, setTab] = React.useState("today")` — tab selection
- `const [mode, setMode] = React.useState("table")` — view mode
- `const [filterOpen, setFilterOpen] = React.useState(false)` — filter toggles
- `const [q, setQ] = React.useState("")` — search queries
- `const [page, setPage] = React.useState(0)` — pagination
### Persistence
## Event Handler Naming
### onClick Handlers
- Inline arrow functions for simple actions: `onClick={() => setView("home")}`
- Named handlers for complex logic: `const handleLogin = () => {...}`, `const handleLogout = () => {...}`
- Modal close pattern: `onClose={() => setNewPatientOpen(false)}`
- Stop propagation: `onClick={e => e.stopPropagation()}`
### Form Handlers
- Auth forms use `onSubmit` with `e.preventDefault()`
- Input changes: `onChange={e => setEmail(e.target.value)}`
- Pattern: `const [form, setForm] = React.useState({...}); const set = (k, v) => setForm(f => ({...f, [k]: v}));`
## Typography Conventions
### Font Families
- **`--font-ui`** (`Inter Tight`): Body text, buttons, labels, form inputs
- **`--font-mono`** (`JetBrains Mono`): Data values, numbers, metrics, badges, eyebrow labels, technical annotations
- **`--font-serif`** (`Instrument Serif`): Page headings (`.serif` class), landing hero titles
### Font Sizes (Pattern Reference)
- Page title: `fontSize:34` or `36`, `fontWeight:400`, `letterSpacing:'-0.02em'` with `.serif`
- Section eyebrow: `10.5px`, uppercase, letter-spacing `0.08em` via `.eyebrow`
- Body text: `13px`–`14px` (inherited from `body`)
- Data values/metrics: `fontSize:20-34`, `fontWeight:500`, with `.mono .tnum`
- Small labels: `fontSize:9.5-11`, `.mono`, uppercase
- Input text: `fontSize:13`
## Color System
### Core Palette
| Token | Value | Usage |
|-------|-------|-------|
| `--ink` | `#0B0C0A` | Primary dark, text, buttons |
| `--lime` | `#D4FF4F` | Brand accent, AI indicator |
| `--lime-dim` | `#9CBF2B` | Dimmed lime for dark bg accents |
| `--sage` | `#7FB77E` | Success/on-track status |
| `--sage-dim` | `#5A8A5A` | Dimmed sage for protein colors |
| `--amber` | `#E8B84A` | Warning/attention status |
| `--coral` | `#FF6B4A` | Danger/critical status |
| `--sky` | `#7AB7D9` | Fat macro color |
### Semantic Colors (theme-aware)
| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--bg` | `var(--paper)` | `#0B0C0A` | Page background |
| `--surface` | `#FEFCF6` | `#121410` | Card background |
| `--surface-2` | `var(--paper-2)` | `#1A1D17` | Hover/secondary surface |
| `--border` | `#D8D2C1` | `#2A2E26` | Borders |
| `--border-2` | `#C5BEA9` | `#3A3F35` | Emphasized borders |
| `--fg` | `#0B0C0A` | `#F4F1EA` | Primary text |
| `--fg-muted` | `#6B6F62` | `#9A9C8E` | Secondary text |
| `--fg-subtle` | `#9A9C8E` | `#6B6F62` | Tertiary text |
| `--ink-contrast` | `#0B0C0A` | `#F4F1EA` | High-contrast text |
### Status Colors
| Status | Variable | Color |
|--------|----------|-------|
| On-track | `var(--sage)` | Green |
| Warning | `var(--amber)` | Amber |
| Danger | `var(--coral)` | Red-orange |
| AI/Extracted | `var(--lime-dim)`/`var(--lime)` | Lime |
### Macro Colors (hard-coded)
- **Kcal:** `var(--ink-contrast)` (primary text color)
- **Protein:** `var(--sage)`/`var(--sage-dim)`
- **Carbohydrate:** `var(--amber)`/`#A0801F` (dark amber)
- **Fat:** `var(--sky)`
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## High-Level Architecture
- **Public flows** (landing, login, signup, onboarding) — unauthenticated
- **Authenticated panel** (home, patients, patient detail, plans, foods, insights) — behind auth guard
## Component Tree
```
```
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
- `isAuthenticated` starts `false`. When `false`, `authView` determines which public view renders.
- `handleLogin()` / `setAuthAndView('home')` sets `isAuthenticated = true` and switches to the panel.
- `handleLogout()` resets to `isAuthenticated = false`, `authView = "landing"`.
- `Rail` buttons call `setView(id)` to switch top-level views.
- `Sidebar` patient items call `setActivePatientId(id); setView("patient")` to open a specific patient.
- `PatientView` has its own `tab` state (`"today"` | `"plan"` | `"biometry"` | `"insights"` | `"history"`) for sub-navigation.
- View and active patient ID are persisted to `localStorage` (`nutriai.view`, `nutriai.patient`).
- Responsive: `window.matchMedia("(max-width: 1200px)")` auto-collapses sidebar.
- Manual: `window._sidebarToggle()` exposed via `useEffect`, called by `Topbar` hamburger button.
## Data Flow
- `PATIENTS` — array of 12 patient objects
- `ANA` — deep detail object for the focused patient (p1)
- `AGGREGATE` — portfolio-level statistics and alerts
```
```
- `HomeView` ← `patients`, `setView`, `setActivePatientId`
- `PatientsView` ← `patients`, `setPatients`, `setView`, `setActivePatientId`
- `PatientView` ← `setView`, `overrideStatus` (from tweaks)
- `PlansView` ← `setView`
- `FoodsView` ← `setView`
- `InsightsView` ← `setView`, `setActivePatientId`
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
- **Colors/status**: Three tiers (`ontrack`/`warning`/`danger`) mapped to CSS variables (`--sage`/`--amber`/`--coral`).
- **Typography**: Three font families — `Inter Tight` (UI), `JetBrains Mono` (data/labels), `Instrument Serif` (headings).
- **Theming**: Light/dark via `data-theme` attribute on `<html>`, toggled by tweaks panel.
- **All text is pt-BR** — Portuguese Brazilian throughout.
## Error Handling
- No try/catch in component logic
- No error boundaries
- No form validation (beyond required field checks like `!name.trim()` disabling buttons)
- No API error states (no API)
- Form `onSubmit` handlers only check for empty required fields
## Cross-Cutting Concerns
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.OpenCode/skills/`, `.agents/skills/`, `.cursor/skills/`, or `.github/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using edit, write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

## Anti-Stall Protocol

When executing tasks, if the same operation fails 3 times in a row (compilation error, test failure, or repeated tool error), you MUST:

1. **STOP retrying the same approach** — the strategy is wrong, not the attempt
2. **Diagnose the root cause** — read error output carefully, check dependencies, verify config
3. **Try an alternative approach** — different test strategy, different dependency version, different file structure
4. **Report status to the user within 4 tool calls of detecting the stall** — even if unresolved

Never spend more than 5 consecutive tool calls on the same failing operation without surfacing the issue.

### Mandatory Verify Gates

- After creating or modifying a test: compile checks MUST pass before marking task done
- After modifying source code: `./gradlew compileJava` (backend) or `npx tsc --noEmit` (frontend) MUST pass before moving on
- After completing a task: the relevant test suite MUST pass before declaring success
- If a verify gate fails 3 times: switch to alternative approach per anti-stall rule above

## Process Management (Windows)

**NEVER** use `./gradlew bootRun` — it blocks the shell and causes tool timeouts.

**NEVER** chain `Start-Sleep` after `Start-Process` — it blocks the tool call.

### Starting the backend (correct pattern — use Spring Boot directly)

```powershell
# Step 1: Start with Gradle (DevTools enables hot-reload)
cd C:\Users\evand\Documents\NutriAI\backend && ./gradlew bootRun

# — OR — if you need a standalone jar:
./gradlew bootJar
Start-Process -FilePath "C:\Program Files\Eclipse Adoptium\jdk-21.0.3.9-hotspot\bin\java.exe" `
  -ArgumentList "-jar","C:\Users\evand\Documents\NutriAI\backend\build\libs\nutriai-api-0.1.0.jar" `
  -RedirectStandardOutput "C:\Users\evand\Documents\NutriAI\backend\stdout.log" `
  -RedirectStandardError "C:\Users\evand\Documents\NutriAI\backend\stderr.log" `
  -WindowStyle Hidden

# Step 2: SEPARATE tool call to verify it's up
curl -s http://localhost:8080/api/v1/health
```

### Killing the backend

```powershell
Get-Process java -ErrorAction SilentlyContinue | Stop-Process -Force
```

### Checking logs

```powershell
Get-Content C:\Users\evand\Documents\NutriAI\backend\stdout.log -Tail 30
Get-Content C:\Users\evand\Documents\NutriAI\backend\stderr.log -Tail 10
```

### Key rules
1. `Start-Process` = immediate return, no waiting
2. Health check = always a **separate** tool call
3. `./gradlew bootJar` = ok (builds then exits), but `./gradlew bootRun` = FORBIDDEN
4. If backend isn't ready on first health check, just retry in the next tool call

## Testing Standards

Every phase must include tests as part of the "Done" criteria. No phase is complete without:

### Frontend (Vitest + Testing Library)
- **Unit tests** for stores (`*.test.ts`) — state transitions, error handling, async flows
- **Component tests** for views (`*.test.tsx`) — rendering, user interactions, form validation
- Run: `npm test` (vitest run) or `npm run test:watch` (watch mode)

### Backend (JUnit 5 + Mockito)
- **Unit tests** for services and controllers — business logic, validation, auth
- Run: `./gradlew test` (from backend/)

### E2E (Playwright) — REGRA DE QUALIDADE
E2E tests MUST be written with the critical eye of a SENIOR QA engineer. Every spec must:
1. **Validate page renders without crashes** — every page must load without React errors; no `if (isVisible)` guards that silently skip assertions
2. **Assert API contract** — verify response shape matches frontend types (no envelope mismatch like `response.data` vs `response.data.data`)
3. **Test all form validations** — required fields, min/max lengths, invalid inputs, error messages
4. **Test auth guards** — unauthenticated users redirected, unauthorized resources blocked
5. **Test CRUD flows** — create, read, update, delete with real API calls
6. **Test edge cases** — empty states, pagination boundaries, concurrent actions, network errors
7. **Test accessibility basics** — visible labels, focusable elements, no layout breaks
8. **Never skip assertions** — use `expect` not `if+skip`; fail fast on unexpected states
- Requires backend + frontend running
- Run: `npm run test:e2e` (from frontend/)

### Verify Gates
- After modifying frontend: `npx tsc --noEmit` must pass
- After modifying backend: `./gradlew compileJava` must pass
- After completing a task: relevant test suite must pass



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-OpenCode-profile` -- do not edit manually.
<!-- GSD:profile-end -->
