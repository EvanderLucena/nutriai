# Conventions — NutriAI

**Analysis Date:** 2026-04-19

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
All components are function components using React hooks. No class components exist in the codebase.

```jsx
function PatientView({ setView, overrideStatus }) {
  const [tab, setTab] = React.useState("today");
  // ...
  return (/* JSX */);
}
```

### State Hooks Pattern
- Use `React.useState`, `React.useMemo`, `React.useEffect`, `React.useRef` — hooks are accessed via the `React` global, NOT destructured in most files (exception: `shell.jsx` destructures at top)
- `shell.jsx` pattern: `const { useState, useEffect, useMemo, useRef } = React;`
- All other files: `React.useState()`, `React.useMemo()`, etc.

### Component Registration
Every component file ends with an `Object.assign(window, { ... })` call to register components globally:

```jsx
Object.assign(window, { HomeView, KPI });
Object.assign(window, { PatientsView, PatientTable, PatientGrid, Avatar, fakeSpark, NewPatientModal, Pagination, PAGE_SIZE, PatientMenuBtn });
Object.assign(window, { PlansView });
```

This is necessary because files are loaded via `<script type="text/babel">` tags in `NutriAI.html`.

### Prop Drilling
All state flows down from the `App` component in `NutriAI.html` via props. No context API, no state management library.

Common prop patterns:
- `setView` — passed to almost every view to switch between views
- `setActivePatientId` — passed to views that navigate to a patient
- `patients` / `setPatients` — passed where patient list mutations are needed
- `setAuthView` — passed to auth views for navigation

### Inline Styles
The predominant pattern is **inline styles via `style={{...}}` objects**, not CSS classes. The `styles.css` file provides foundational layout classes and design tokens, but most component-specific positioning, sizing, and coloring is done inline. This is a deliberate convention, not a shortcoming.

When adding new UI:
- Use CSS classes from `styles.css` for structural elements (`.card`, `.page`, `.btn`, `.chip`, `.eyebrow`, `.mono`, `.serif`, `.tnum`, etc.)
- Use inline styles for one-off positioning, spacing, grid layouts, and component-specific colors

### Conditional Rendering
Pattern: Inline ternaries and `&&` operators in JSX:

```jsx
{view === "home" && <HomeView setView={setView}/>}
{view === "patients" && <PatientsView .../>}
{newPatientOpen && <NewPatientModal onClose={() => setNewPatientOpen(false)}/>}
```

### Modal Pattern
All modals follow the same structure:
1. Fixed overlay with `position:'fixed', inset:0, background:'rgba(11,12,10,0.4)'`
2. Click overlay to close (with `e.stopPropagation()` on inner card)
3. `.card` as container with `width:'min(XXXpx, 100%)'`
4. `.card-h` header with title, spacer, close button
5. Body with `padding:'18px 20px'`
6. Footer with `borderTop`, flex-end, cancel + primary buttons

## CSS / Styling Conventions

### Custom Properties (Design Tokens)
All colors, radii, and fonts are defined as CSS custom properties in `:root` and overridden per theme:

```css
:root {
  /* Core palette */
  --ink: #0B0C0A;
  --ink-2: #161814;
  --lime: #D4FF4F;
  --lime-dim: #9CBF2B;
  --coral: #FF6B4A;
  --sage: #7FB77E;
  --sage-dim: #5A8A5A;
  --amber: #E8B84A;
  --sky: #7AB7D9;

  /* Fonts */
  --font-ui: 'Inter Tight', 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
  --font-serif: 'Instrument Serif', 'Times New Roman', serif;

  /* Radii */
  --radius-sm: 3px;
  --radius: 6px;
  --radius-lg: 10px;
}
```

### Theme Switching
Theme is controlled via `data-theme` attribute on `<html>`:

```css
[data-theme="light"] { --bg: var(--paper); --fg: #0B0C0A; ... }
[data-theme="dark"]  { --bg: #0B0C0A;   --fg: #F4F1EA; ... }
```

Dark theme overrides are done inline in CSS with `[data-theme="dark"]` selectors.

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
  - Button text: `"Novo paciente"`, `"Cancelar"`, `"Salvar"`, `"Cadastrar paciente"`
  - Labels: `"Adesão 7d"`, `"Pacientes ativos"`, `"Kcal"`, `"Prot"`, `"Gord"`
  - Statuses: `"ontrack"` → displayed as `"On-track"`, `"warning"` → `"Atenção"`, `"danger"` → `"Crítico"`
  - Section headers use `.eyebrow` uppercase styling

### Number Formatting
- Decimal separator: comma (pt-BR convention), e.g., `"1.840"` with period for thousands
- Some values use `toLocaleDateString('pt-BR')` for date formatting

## State Management Patterns

### App-Level State (in `NutriAI.html`)
All global state lives in the `App` component:
- `authView` — controls which auth screen is shown
- `isAuthenticated` — auth gate
- `view` — current main view ("home", "patients", "patient", "foods", "insights", "onboarding")
- `activePatientId` — selected patient
- `statusFilter` — patient list filter
- `patients` — patient data array (mutable via `setPatients`)
- `tweaks` — edit mode state (theme, patientStatus override)
- `sidebarOpen` — sidebar visibility

### Local State
Each view manages its own local state:
- `const [tab, setTab] = React.useState("today")` — tab selection
- `const [mode, setMode] = React.useState("table")` — view mode
- `const [filterOpen, setFilterOpen] = React.useState(false)` — filter toggles
- `const [q, setQ] = React.useState("")` — search queries
- `const [page, setPage] = React.useState(0)` — pagination

### Persistence
View state is persisted to `localStorage`:
```jsx
React.useEffect(() => {
  try { localStorage.setItem("nutriai.view", view); } catch {} 
}, [view]);
```

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

---

*Convention analysis: 2026-04-19*