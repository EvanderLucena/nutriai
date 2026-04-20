# Integrations — NutriAI

**Analysis Date:** 2026-04-19

## External Services

| Service | Purpose | Status | Auth Method |
|---------|---------|--------|-------------|
| Google Fonts | Web font delivery (Inter Tight, JetBrains Mono, Instrument Serif) | **Active** | None (public CDN) |
| unpkg CDN | React, React DOM, Babel Standalone library hosting | **Active** | None (public CDN) |
| Google OAuth | Login button in `LoginView` | **UI only, not wired** | Button rendered but no OAuth SDK — clicking it submits the login form as-is |
| WhatsApp Business API | Patient communication and AI food extraction | **Conceptual / Mock** | No SDK, no API calls — referenced in UI copy and data model only |

## Third-Party Libraries

| Library | Purpose | Where Used |
|---------|---------|------------|
| React 18.3.1 (UMD) | Component rendering, state management, hooks | Global — every `.jsx` file |
| React DOM 18.3.1 (UMD) | DOM rendering, `createRoot`, `createPortal` | `NutriAI.html` (mount), `view_patients.jsx` (portals) |
| Babel Standalone 7.29.0 | In-browser JSX → JS transpilation | `NutriAI.html` — all `<script type="text/babel">` blocks |
| Google Fonts — Inter Tight | Primary sans-serif UI font | All views via `--font-ui` CSS variable |
| Google Fonts — JetBrains Mono | Monospace data/number font | All views via `--font-mono` CSS variable |
| Google Fonts — Instrument Serif | Serif heading font | All views via `--font-serif` CSS variable |

**Notable absence of common libraries:**
- No chart library (D3, Recharts, Chart.js) — all visualizations are hand-coded SVG
- No CSS framework (Tailwind, Bootstrap) — all styling is custom CSS + inline styles
- No form library (Formik, React Hook Form) — all forms use raw `useState` + `onChange`
- No routing library (React Router) — routing is `if/switch` on `view` state
- No date library (date-fns, Day.js, Moment) — dates are hard-coded strings
- No HTTP client (Axios, Fetch wrapper) — no API calls exist
- No state management (Redux, Zustand, Jotai) — pure `useState` + prop drilling
- No animation library (Framer Motion) — CSS transitions only

## Data Sources

**All data is mock/static — no live data sources.**

| Data Source | Type | File | Content |
|-------------|------|------|---------|
| `PATIENTS` | Array constant | `data.jsx:2-15` | 12 mock patients with name, age, objective, status, adherence, weight, weightDelta |
| `ANA` | Object constant | `data.jsx:18-76` | Detailed single-patient data: biometry (4 assessments), skinfolds (Pollock 7), perimetry, weekAdherence, timeline (6 meals), aiSummary |
| `AGGREGATE` | Object constant | `data.jsx:79-98` | Portfolio stats: active/ontrack/warning/danger counts, avgAdherence, alerts (4), patterns (3) |
| `FOODS_CATALOG` | Array constant | `view_foods.jsx:2-74` | 17 food items — 12 "base" (per-100g) + 5 "preset" (pre-portioned) |
| `INITIAL_MEALS` | Array constant | `view_plans.jsx:24-31` | 6 meal slots with id, label, time, macro targets |
| `INITIAL_OPTIONS` | Array constant | `view_plans.jsx:2-22` | 3 meal options (Clássico, Peixe, Vegetariano) with food items and macros |
| `INITIAL_EXTRAS` | Array constant | `view_plans.jsx:792-798` | 5 off-plan items (beer, chocolate, açaí, pizza, wine) with AI guidance notes |
| `MOCK_HISTORY` | Array constant | `view_patient.jsx:652-674` | 4 days of historical food logs for History tab |

**Data generation helpers:**
- `fakeSpark(end)` in `view_patients.jsx:543-552` — generates random 7-point sparkline values anchored to a target endpoint
- `CarteiraChart` in `view_insights.jsx:80-85` — generates 12-week mock data with `Math.sin()` oscillation

## Authentication

**Approach: Client-side mock authentication, no real auth**

- `isAuthenticated` boolean state in `App` component (`NutriAI.html:41`)
- `authView` state controls which auth screen is displayed ("landing" | "login" | "signup" | null)
- `setAuthView()` switches between auth flows; `handleLogin()` / `handleLogout()` toggle `isAuthenticated`

**Login flow (`view_login.jsx`):**
- Email + password form with basic validation (non-empty check)
- "Remember me" checkbox (stored in state, not persisted)
- "Continue with Google" button renders Google "G" logo SVG but **no actual OAuth implementation** — clicking it would submit the form normally
- "Forgot password" link is a dead `href="#"`
- On submit: sets `view` to "home" and `isAuthenticated` to `true` — no credential verification

**Signup flow (`view_signup.jsx`):**
- 2-step form: Step 1 (name, email, password) → Step 2 (CRN number, CRN region UF, specialty, WhatsApp, LGPD terms checkbox)
- On completion: `setView('onboarding')` — no account creation, no API call
- CRN regional selector lists all 27 Brazilian UF codes

**Onboarding flow (`view_onboarding.jsx`):**
- 4 steps: introduce patient list → configure first plan → invite patients via WhatsApp link → done
- WhatsApp invite link format: `wa.me/{number}?text={message}` — template only
- "Skip for now" button bypasses to `setView('home')`

**No real authentication provider. No JWT, no session, no cookie-based auth. The app trusts the client.**

## Browser APIs Used

| API | Purpose | Where Used |
|-----|---------|------------|
| `localStorage` | Persist `nutriai.view` (current view) and `nutriai.patient` (active patient ID) across page reloads | `NutriAI.html:75-83` |
| `window.matchMedia` | Detect `max-width: 1200px` breakpoint for sidebar auto-collapse | `NutriAI.html:61-67` |
| `window.postMessage` | Communicate with parent frame for edit-mode toggling (`__activate_edit_mode`, `__deactivate_edit_mode`, `__edit_mode_set_keys`, `__edit_mode_available`) | `NutriAI.html:85-104` |
| `document.documentElement.setAttribute` | Toggle `data-theme` attribute for light/dark mode | `NutriAI.html:86-88` |
| `document.body` (portal) | Portal target for dropdown menus via `ReactDOM.createPortal()` | `view_patients.jsx:306-327` |
| `window.open()` + `window.print()` | PDF export — opens new window with generated HTML and triggers print dialog | `view_plans.jsx:107-169` |
| `window._sidebarToggle` | Global function exposed for sidebar toggle from Topbar button | `NutriAI.html:70-72` |
| `window.getComputedStyle` / `getBoundingClientRect` | Menu positioning calculations for dropdown overlays | `view_patients.jsx:269-270` |
| `Date` | `new Date().toLocaleDateString('pt-BR')` in PDF export | `view_plans.jsx:162` |

## Planned Integrations

Based on `TASKS.md` and product roadmaps:

| Integration | Priority | Notes |
|-------------|----------|-------|
| WhatsApp Business API | P0 (core product) | AI conversations with patients, food extraction from messages. Referenced throughout UI copy but no implementation. Requires backend. |
| AI/NLP Service | P0 (core product) | Meal extraction from natural language. Referenced as "IA" in UI. No implementation — all AI summaries are hand-written mock data. |
| Google OAuth | P1 | Button exists in `LoginView` (`view_login.jsx:79-82`) but no SDK or flow wired. |
| Payment Gateway | P1 | Checkout + post-checkout for subscription billing (Iniciante R$99,99 / Profissional R$149,99 / Ilimitado R$199,99). Pricing UI exists but no Stripe/MercadoPago integration. |
| Email service | P2 | Password recovery, notifications. "Forgot password" link exists but dead. |
| Push notification service | P2 | In-app/email/push alerts mentioned in P2 roadmap. |
| TACO (Brazilian food database) import | Deferred | Import Brazilian food composition table into catalog. Marked "out of scope for now" in `TASKS.md:15`. |
| CSV import | P1 | Patient import via CSV mentioned in onboarding (`view_onboarding.jsx:56-64`). No implementation yet. |
| LGPD-compliant data storage | P1 | FAQ claims "servidor em São Paulo, dados criptografados, conforme LGPD" — but no backend exists yet. |

## Environment Configuration

**Required env vars:** None — no environment variables, no `.env` files.

**Configurable state:**
- `TWEAK_DEFAULTS` block in `NutriAI.html:34-37` with `/*EDITMODE-BEGIN*/` markers — allows external editor to override theme and patientStatus defaults
- `data-theme` attribute on `<html>` element — controls light/dark mode ("light" | "dark")

**Secrets location:** None. No secrets, credentials, or API keys in the codebase.

## Webhooks & Callbacks

**Incoming:**
- `window.postMessage` listener for edit-mode messages from parent frame (`NutriAI.html:85-98`)
  - `__activate_edit_mode` → shows tweaks panel
  - `__deactivate_edit_mode` → hides tweaks panel

**Outgoing:**
- `window.parent.postMessage` — sends `__edit_mode_available` on mount (announces tweakability)
- `window.parent.postMessage` — sends `__edit_mode_set_keys` when tweak values change (syncs state to editor)

## WhatsApp Integration (Conceptual)

The entire product is designed around a WhatsApp-based workflow, but **no integration exists in code**:

- **Patient-facing:** Patients send food reports via WhatsApp to an AI agent
- **AI extraction:** The AI extracts structured meal data from conversations and surfaces it in the panel
- **Nutritionist-facing:** The nutritionist sees only extracted data, never the original conversation
- **AI response principles (from landing page):**
  1. Always consults the patient's meal plan before responding
  2. Harm reduction approach (e.g., modifying an off-plan choice rather than forbidding it)
  3. Flexible diet, not rigid
  4. Nutritionist sees results, not conversations

These are product principles embedded in `view_landing.jsx` but have **zero technical implementation** — all "AI" data in the panel is manually authored mock content.

---

*Integration audit: 2026-04-19*