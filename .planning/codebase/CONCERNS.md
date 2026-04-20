# Concerns — NutriAI

**Analysis Date:** 2026-04-19

---

## Security Concerns

| Concern | Severity | Location | Recommendation |
|---------|----------|----------|----------------|
| No authentication — `handleLogin` just sets `isAuthenticated=true` with no credentials check | Critical | `NutriAI.html` lines 50-54 | Implement real auth (JWT, session, OAuth). Never trust client-side state for auth decisions. |
| Password input accepted but never validated against any backend | Critical | `view_login.jsx` lines 7-15 | Validate against server-side auth. Current code lets any email+password through. |
| Signup form collects CRN, WhatsApp number, and email but never sends to any backend | Critical | `view_signup.jsx` lines 1-28 | Connect to backend API. Sensitive professional data (CRN, WhatsApp) must be transmitted securely and stored server-side. |
| No HTTPS enforcement or Content Security Policy headers | High | `NutriAI.html` | Add CSP headers, enforce HTTPS. App handles health data (LGPD applies). |
| PostMessage listener accepts messages from any origin (`"*"`) | Medium | `NutriAI.html` lines 89-98 | Restrict `postMessage` origin to trusted parent. Current `*` allows any origin to manipulate state. |
| Patient health data (biometry, weights, conditions) stored in plaintext global variables | High | `data.jsx` lines 1-100 | Never store PHI in client-side JavaScript. All patient data must be encrypted at rest and in transit on a backend. |
| No input sanitization on any form field | Medium | `view_signup.jsx`, `view_patients.jsx`, `view_patient.jsx` | Sanitize all user inputs before rendering. XSS risk via innerHTML-like patterns with React state. |
| localStorage used for view/patient persistence with no encryption | Low | `NutriAI.html` lines 74-83 | Encrypt or avoid storing identifiers in localStorage. Currently stores `nutriai.view` and `nutriai.patient`. |

---

## Performance Concerns

| Concern | Severity | Location | Recommendation |
|---------|----------|----------|----------------|
| Entire app loads via Babel in-browser transpilation at runtime | Critical | `NutriAI.html` line 13 (`@babel/standalone`) | Pre-compile JSX in a build step. Babel standalone adds ~1.5MB and transpiles every file on each page load. |
| 13 separate `<script type="text/babel">` files loaded sequentially | High | `NutriAI.html` lines 18-31 | Bundle and minify scripts. Sequential script tags block rendering. |
| React dev build used (`react.development.js`) in production markup | High | `NutriAI.html` line 11 | Switch to `react.production.min.js` and `react-dom.production.min.js`. Dev build includes extra warnings and is significantly larger. |
| All mock data (patients, foods catalog) loaded as global constants on every page | Medium | `data.jsx`, `view_foods.jsx` lines 2-74 | Paginate data server-side. 12 patients and 17 food items is fine now, but approach won't scale. |
| SVG chart re-renders on every mouse move with `setHover` state updates | Medium | `view_patient.jsx` lines 793-801 (MultiLineChart), `view_insights.jsx` lines 101-111 (CarteiraChart), `viz.jsx` lines 137-146 (LineChart) | Throttle `mousemove` handlers or use `React.memo` / `useCallback` to prevent excessive re-renders on chart hover. |
| `fakeSpark()` generates random sparkline data on every render | Medium | `view_patients.jsx` lines 543-552 | Cache sparkline data or compute once in `useMemo`. Currently generates new random values every render causing flicker. |
| No lazy loading or code splitting — all views loaded upfront | Medium | `NutriAI.html` lines 18-31 | Use React.lazy + Suspense or dynamic imports. Landing, login, signup, onboarding don't need the full app bundle. |
| Inline styles everywhere (thousands of `style={{...}}` objects) | Low | Every view file | Extract common styles to CSS classes. Inline style objects create new objects on every render. |

---

## Maintainability Concerns

| Concern | Severity | Location | Recommendation |
|---------|----------|----------|----------------|
| No component library — every view is a single monolithic function (500-900+ lines) | High | `view_patient.jsx` (944 lines), `view_plans.jsx` (884 lines), `view_patients.jsx` (554 lines) | Break into smaller components. PatientView alone contains TodayTab, BiometryTab, InsightsTab, HistoryTab, Timeline, ExtractionEditor, EditPatientModal, etc — all in one file. |
| All components attached to `window` global — no module system | High | Every file ends with `Object.assign(window, {...})` | Use ES modules (`import`/`export`) with a bundler. Global scope pollution makes dependency tracking impossible. |
| No TypeScript — all props untyped, data shapes implicit | High | All `.jsx` files | Add TypeScript or at minimum JSDoc types. Props like `{ setView, setActivePatientId, showAISummary, overrideStatus }` are undocumented and can be misused. |
| Shared state lives entirely in `App` component and passed deep through props | Medium | `NutriAI.html` lines 39-171 | Use React Context or a state manager. Prop drilling 4+ levels deep (App → PatientsView → PaginatedPatients → PatientTable → PatientMenuBtn) is fragile. |
| No routing library — view switching is manual string comparison | Medium | `NutriAI.html` lines 114-141 | Use React Router or similar. URL doesn't change, no browser history, no deep linking. |
| CSS file is 1726 lines with no methodology or separation | Medium | `styles.css` | Split into component-scoped CSS modules or separate files per view. Single monolith CSS is hard to navigate and prone to conflicts. |
| Duplicate component patterns — `Pagination` defined twice, `Field`/`PatField`/`BioField` near-identical | Medium | `view_patients.jsx` line 213 (Pagination), `view_foods.jsx` line 80 (FoodsPagination), `view_patient.jsx` line 572 (BioField), `view_patients.jsx` line 375 (PatField), `view_foods.jsx` line 311 (Field) | Extract shared components into a `components/` directory. Three different "field" components doing nearly the same thing. |
| `window._sidebarToggle` as global side-effect for communication | Low | `NutriAI.html` lines 70-72, `shell.jsx` line 134 | Use React state lifting or callbacks instead of globals. Currently `Topbar` calls `window._sidebarToggle()` directly. |
| No error boundaries — any component crash takes down the entire app | Low | `NutriAI.html` line 174 | Add `ErrorBoundary` components around view-level sections to isolate failures. |

---

## Accessibility Concerns

| Concern | Severity | Location | Recommendation |
|---------|----------|----------|----------------|
| No ARIA labels on interactive elements (buttons, menus, cards) | High | All view files | Add `aria-label` to icon buttons, menu triggers, card actions. Many buttons use only icons with no text alternative (e.g., `<button>...<IconDots/></button>`). |
| Color-only status indicators — adherence bars and dot indicators rely solely on color | High | `view_patients.jsx` lines 458-464 (StackBar), `shell.jsx` lines 86-107 (status filter dots) | Add text alternatives or patterns alongside color. Currently sage/amber/coral is the only differentiation. |
| No keyboard navigation for dropdown menus and context menus | Medium | `view_patients.jsx` lines 251-329 (PatientMenuBtn), `view_plans.jsx` lines 398-489 (PlanFoodRow menu) | Add `role="menu"`, keyboard arrow navigation, Escape to close, and focus trapping. |
| Modal dialogs lack focus trap and ARIA role | Medium | `view_patients.jsx` line 334 (NewPatientModal), `view_plans.jsx` line 582 (EditFoodModal), `view_patient.jsx` line 516 (NewBiometryModal) | Add `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, and focus trap. Currently Tab key escapes modals. |
| SVG charts have no screen reader text alternatives | Medium | `viz.jsx`, `view_patient.jsx` (MultiLineChart), `view_insights.jsx` (CarteiraChart) | Add `role="img"` and `aria-label` with data summaries to all SVG charts. |
| No skip-nav or landmark regions | Medium | `NutriAI.html`, `shell.jsx` | Add `<nav>`, `<main>`, `<header>` landmarks and skip navigation link. |
| Font size minimum is 9px (multiple `.eyebrow` and `.mono` instances) | Low | Multiple files, e.g., `view_patient.jsx` line 323 (fontSize 9.5) | WCAG requires minimum 12px for readability. Several labels use 9-10px text. |

---

## Scalability Concerns

| Concern | Severity | Location | Recommendation |
|---------|----------|----------|----------------|
| All data is hardcoded in JSX files — no API integration whatsoever | Critical | `data.jsx` (patients, ANA, AGGREGATE), `view_foods.jsx` (FOODS_CATALOG), `view_plans.jsx` (INITIAL_OPTIONS, INITIAL_MEALS) | Build API layer before any deployment. All clinical data, plans, and food catalog must come from a backend. |
| No database — state resets on every page refresh (except view & activePatientId in localStorage) | Critical | `NutriAI.html` lines 74-83 | Persist all state changes (patient edits, plan changes, new patients) to a backend database. |
| File structure is flat — all `.jsx` files in root directory with no separation | High | Root directory listing | Organize into `components/`, `views/`, `data/`, `utils/` directories. A 17-file root directory is unmaintainable as the app grows. |
| No build pipeline (no bundler, no transpiler, no minifier) | High | Project root (no `package.json`, no build config) | Add Vite or similar. Current approach of Babel standalone + `<script>` tags is not production-ready. |
| No server at all — pure client-side static files | High | Entire project | Need a backend (Node, Python, etc.) for auth, data persistence, API, and secure patient data handling. |
| Hardcoded professional data in `shell.jsx` ("Dra. Helena Viana · CRN-3 24781") | Medium | `shell.jsx` lines 29, 58 | Make professional identity dynamic from auth context. Current hardcoded values only work for one demo user. |

---

## Data / Privacy Concerns

| Concern | Severity | Location | Recommendation |
|---------|----------|----------|----------------|
| Mock patient data includes realistic health data (weight, body fat, biometrics, dietary restrictions) | High | `data.jsx` lines 1-100 | Remove all realistic patient data before any public deployment. LGPD strictly regulates health data handling. |
| Landing page claims "Servidor em São Paulo, dados criptografados, conforme LGPD" but no such infrastructure exists | High | `view_landing.jsx` lines 459-462 | Either build the claimed infrastructure or remove the claim. Current state violates LGPD truth-in-advertising requirements. |
| No consent mechanism for data processing — signup asks for terms acceptance but there are no actual terms | Medium | `view_signup.jsx` lines 121-123 (`<a href="#">Termos de Uso</a>`) | Link to actual terms documents and implement consent tracking. `<a href="#">` links to nothing. |
| WhatsApp number format displayed without privacy masking | Medium | `view_onboarding.jsx` line 119 | Never display full contact numbers. Mask or use invitation links instead. |
| AI conversation mockup in landing page includes realistic patient dialogue about disordered eating behavior | Medium | `view_landing.jsx` lines 64-81 | Consider whether the Xtudo scenario normalizes disordered eating. It's well-intentioned (harm reduction) but could be triggering without content warnings. |

---

## Technical Debt

| Item | Impact | Priority |
|------|--------|----------|
| Global state via `window` objects — no module imports between files | All components are coupled to load order and global names. Renaming a component requires changes in `Object.assign(window, ...)` and every consumer. | High |
| No test files exist anywhere in the project | Zero test coverage for clinical data handling, plan calculations, patient editing flows, or auth logic. | High |
| `NutriAI.html` contains inline `<script>` block (lines 33-175) with App component and all state logic | Critical application state (auth, view, patients, tweaks, sidebar) is in the HTML file, cannot be tested or linted independently. | High |
| Plan food items edited inline with controlled inputs but `replaceItem` sets `dirty` to `false` instead of `true` | Bug: after editing a food item, the "unsaved changes" indicator shows as saved. Line at `view_plans.jsx` line 69: `setDirty(false)` should be `markDirty()`. | Medium |
| History tab date filtering is disconnected — `displayed` always equals `MOCK_HISTORY` regardless of `dateFrom`/`dateTo` | `view_patient.jsx` line 679: `const displayed = MOCK_HISTORY; // in real app, filter by dateFrom/dateTo` — date range UI exists but does nothing. | Medium |
| `NewPatientModal` collects form data but "Cadastrar" button just calls `onClose` | `view_patients.jsx` line 368: `<button className="btn btn-primary" onClick={onClose}>` — no form submission logic. Patient is never actually created. | Medium |
| `CreateFoodModal` has no form state management at all | `view_foods.jsx` lines 272-308: All form fields are uncontrolled. Clicking "Salvar no catálogo" just closes the modal with no data collection. | Medium |
| `ExtractionEditor` changes are never persisted | `view_patient.jsx` line 363: "Salvar correção" button calls `onClose` without saving any changes. The editor collects data but discards it. | Medium |
| `EditFoodModal` in `view_foods.jsx` "Edit" button on food cards doesn't open any modal | `view_foods.jsx` lines 196, 240: `<button style={{color:'var(--fg-subtle)'}}><IconDots size={14}/></button>` — button has no `onClick` handler. | Medium |
| `remember` state in LoginView is unused | `view_login.jsx` line 4: `const [remember, setRemember] = React.useState(false)` — state is set but never read or sent to any backend. | Low |
| `showAISummary` prop passed to HomeView and PatientView but never used | `view_home.jsx` line 2, `view_patient.jsx` line 2 — prop is destructured but never referenced in component logic. | Low |
| `planTitle` in PlansView has unsaved changes tracking (`dirty`) but "Salvar" just sets `dirty(false)` with no persistence | `view_plans.jsx` line 223: `<button ... onClick={()=>setDirty(false)}>` — no API call, no persistence. | Medium |
| Export PDF opens a new window and builds HTML string via template literals | `view_plans.jsx` lines 107-168: `window.open('')` + string concatenation. No sanitization of user-controlled data in HTML context (potential XSS in `planTitle`). | High |

---

## Dependency Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| React 18.3.1 loaded from unpkg.com (CDN) — no integrity guarantee beyond SRI hashes | App breaks if CDN is down, SRI only protects against tampering not availability. Also pinned to specific version, no easy upgrade path. | Self-host React and Babel, or better yet, add a build pipeline that bundles dependencies. |
| Babel Standalone 7.29.0 loaded from CDN | Runtime transpilation is slow, adds ~1.5MB, and pins the project to Babel's CDN availability. Not viable for production. | Remove Babel standalone. Use Vite or webpack to pre-compile JSX. |
| Google Fonts (Inter Tight, JetBrains Mono, Instrument Serif) loaded from fonts.googleapis.com | Privacy concern for LGPD — Google Fonts tracks users via IP. Also a render-blocking dependency. | Self-host fonts. Download the font files and serve locally. |
| No `package.json`, `package-lock.json`, or any dependency management | Cannot reproduce build, cannot track vulnerabilities, cannot update dependencies systematically. | Initialize npm/yarn project with proper dependency declarations. |
| All data dependencies are self-contained (no external APIs) | Currently safe but means there's zero infrastructure for real data flows. Migrating off mock data requires building everything from scratch. | Design API contracts early and incrementally replace mock data with API calls. |

---

## Incomplete / Placeholder Code

- **Login has no auth verification** — `view_login.jsx` line 14: `setView('home')` on any form submit. No credential validation.

- **Signup form data is discarded** — `view_signup.jsx` lines 26-27: On step 2 submit, calls `setView('onboarding')`. No data is persisted or sent.

- **NewPatientModal has no form submission** — `view_patients.jsx` line 368: `<button className="btn btn-primary" onClick={onClose}>` — closes without creating patient.

- **CreateFoodModal collects nothing** — `view_foods.jsx` lines 272-308: Uncontrolled form fields, "Salvar" just closes.

- **EditFoodModal in FoodsView is unreachable** — `view_foods.jsx` lines 196, 240: `<IconDots>` button has no click handler.

- **History tab date filtering is a no-op** — `view_patient.jsx` line 679: `const displayed = MOCK_HISTORY; // in real app, filter...`

- **ExtractionEditor "Salvar correção" discards changes** — `view_patient.jsx` line 363: `<button ... onClick={onClose}>` — no save logic.

- **"Esqueci minha senha" link goes nowhere** — `view_login.jsx` line 70: `<a href="#">Esqueci minha senha</a>`

- **Terms of Use and Privacy Policy links go nowhere** — `view_signup.jsx` line 123: `<a href="#">Termos de Uso</a>` and `<a href="#">Política de Privacidade</a>`

- **Google OAuth button has no handler** — `view_login.jsx` line 79: `<button className="btn btn-secondary auth-oauth">Continuar com Google</button>` — no `onClick`.

- **Onboarding "Adicionar pacientes" shows options but does nothing** — `view_onboarding.jsx` lines 46-66: Buttons just advance steps, no actual data collection.

- **Onboarding "Copiar link" button has no copy logic** — `view_onboarding.jsx` line 121: Copy WhatsApp link button triggers nothing.

- **Export PDF uses unsanitized `planTitle` in HTML** — `view_plans.jsx` line 139: `<title>${planTitle}</title>` — XSS vector if title contains HTML.

- **Settings button in Rail does nothing** — `shell.jsx` line 28: `<button className="rail-btn" title="Ajustes"><IconSettings size={18}/></button>` — no `onClick`.

- **`page` state in HomeView shadows pagination** — `view_home.jsx` lines 5-7: `const [page, setPage]` with `PAGE_SIZE` and `patients` prop, but `PAGE_SIZE` from `view_patients.jsx` is global via `window`. This coupling is fragile.

- **`remember` checkbox state in LoginView is unused** — `view_login.jsx` line 4: `const [remember, setRemember]` — state is set but never consumed.

- **`showAISummary` prop is passed but never used** — `view_home.jsx` line 2, `view_patient.jsx` line 2

- **TASKS.md documents P1/P2 items as incomplete** — `TASKS.md` lines 73-87: Admin panel, billing, settings, patient invitation, password recovery, notifications, checkout all listed as undone.

---

*Concerns analysis: 2026-04-19*