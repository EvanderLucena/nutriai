# Phase 02 — UI Review

**Audited:** 2026-04-20
**Baseline:** Abstract 6-pillar standards (no UI-SPEC.md exists)
**Screenshots:** Captured (desktop, mobile, tablet) from dev server at localhost:5173

---

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | 3/4 | All text in pt-BR with domain-specific labels; one generic empty state; no generic "Submit"/"OK" buttons |
| 2. Visuals | 3/4 | Strong visual hierarchy with serif/mono/eyebrow system; icon-only buttons lack `aria-label` attributes |
| 3. Color | 3/4 | Design token system well-migrated; 2 hardcoded hex colors outside tokens (`#A0801F`, `#D4FF4F`) |
| 4. Typography | 3/4 | Comprehensive type scale with 3 font families; more sizes/weights than abstract standards recommend, justified by clinical context |
| 5. Spacing | 2/4 | Pervasive arbitrary pixel values via inline styles; no spacing scale adopted from Tailwind |
| 6. Experience Design | 2/4 | No loading states, no error boundaries, no confirmation for meal deletion; empty/destructive states partially covered |

**Overall: 16/24**

---

## Top 3 Priority Fixes

1. **No loading states anywhere** — Data fetches will block UI with no visual feedback when backend is connected — Add skeleton screens to HomeView (KPI cards, timeline), PatientView (macro rings, timeline), and PlansView (meal cards); use React.Suspense boundaries at route level.

2. **No ErrorBoundary component** — Any render error crashes the entire app with no recovery UI — Create an `ErrorBoundary` class component wrapping each `<Route>` element in App.tsx; show a pt-BR error message ("Algo deu errado") with retry button.

3. **Hardcoded colors outside design token system** — `#A0801F` (carb amber) and `#D4FF4F` (lime in SVGs) bypass theme system, breaking dark mode — Add `--amber-dark` / `--lime-svg` tokens to `globals.css` `:root` and `[data-theme="dark"]` blocks; replace hardcoded hex references with `var()` calls.

---

## Detailed Findings

### Pillar 1: Copywriting (3/4)

**Strengths:**
- All UI text is in pt-BR, consistent with the project locale requirement
- Button labels are context-specific and domain-appropriate: "Entrar", "Continuar", "Criar conta", "Cancelar", "Salvar", "Exportar PDF", "Adicionar refeição", "Excluir alimento"
- No generic "Submit", "OK", or "Click Here" buttons found
- Error messages use pt-BR: "Preencha todos os campos." (LoginView), "Preencha o CRN, regional e aceite os termos." (SignupView)
- Destructive action confirmation uses pt-BR: "Tem certeza que deseja excluir...?" (FoodsView)

**Issues:**
- FoodsView search empty state: "Nenhum alimento bate com esse filtro." — functional but could be more helpful (e.g., suggesting broadening the search or switching categories)
- Sidebar patient filter empty state: "Nenhum paciente neste filtro." — adequate but brief
- No form validation error messages for email format, CRN format, etc. — only empty-field checks exist

### Pillar 2: Visuals (3/4)

**Strengths:**
- Clear visual hierarchy on all views: `.serif` headings (Instrument Serif) → `.eyebrow` labels (JetBrains Mono, uppercase) → body text (Inter Tight) → secondary text (muted)
- Strong focal points: large mono data values on HomeView KPIs and PatientView macros; lime accent on AI badges
- Status colors (`--sage`/`--amber`/`--coral`) provide immediate visual differentiation for patient health states
- Sidebar patient list with status dots provides quick visual scanning
- Modal overlays dim background appropriately

**Issues:**
- Rail icon buttons use `title` attributes but lack `aria-label` (accessibility gap):
  - `Rail.tsx`: `title="Ajustes"`, `title="NutriAI"`, `title="Home"`, etc. — should add `aria-label` matching the `title`
- Sidebar toggle button: `title="Alternar painel lateral"` — should also have `aria-label`
- Theme toggle button: `title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}` — should also have `aria-label`
- No visible focus indicators on icon buttons (keyboard navigation concern)

### Pillar 3: Color (3/4)

**Design token usage (positive):**
- `text-primary`/`bg-primary`/`border-primary`: 0 occurrences — project uses semantic tokens (`--fg`, `--surface`, `--border`, etc.) instead, which is correct
- Full light/dark theme system with `[data-theme="light"]` and `[data-theme="dark"]` selectors in `globals.css`
- Status colors (`--sage`, `--amber`, `--coral`, `--lime`) used consistently via CSS classes (`.chip.ontrack`, `.chip.warning`, `.chip.danger`, `.chip.ai`)
- Accent color (`--lime`/`--lime-dim`) used sparingly and intentionally: AI indicators, active states, brand moments

**Hardcoded color issues:**
- `#A0801F` — dark amber used for carbohydrate macro color in PatientView (6 occurrences: lines 133, 159, 223, 264, 306, 349) and FoodsView (2 occurrences: lines 189, 237). This color is NOT in the design token system and will NOT adapt to dark theme.
- `#D4FF4F` — lime green used in LandingView and LoginView SVG `<path>` elements. Should reference `var(--lime)` or a CSS class instead.
- `#0B0C0A` — ink color in LandingView SVG (equals `var(--ink)` — should use the token)
- `#fff` — used for white text in FoodsView and PatientsView toggle modals. Acceptable for contrast on colored backgrounds but could use `var(--ink-contrast)` or a dedicated token.
- `#111`, `#888` — used in PlansView's PDF-export HTML string. Acceptable in print context (no CSS variable access in generated HTML).

**Recommendation:** Add `--amber-dark: #A0801F` and `--amber-dark-dark: #C4961F` tokens for carb color with dark-mode variant. Create a CSS class `.text-carb` referencing this token. For SVG colors, use `style={{ fill: 'var(--lime)' }}` instead of hardcoded hex.

### Pillar 4: Typography (3/4)

**Font families in use (exceeds abstract threshold but justified):**
- `Inter Tight` (var `--font-ui`) — body text, buttons, form inputs
- `JetBrains Mono` (var `--font-mono`) — data values, metrics, eyebrow labels (`.mono`, `.tnum`)
- `Instrument Serif` (var `--font-serif`) — page headings, hero text (`.serif`)

**Font sizes via inline styles (exceeds 4-size threshold):**
- `10px`, `10.5px`, `11px`, `12px`, `12.5px`, `13px`, `13.5px`, `14px`, `15px`, `16px`, `20px`, `22px`, `24px`, `26px`, `32px`, `34px`, `36px`, `44px`, `52px`
- Approximately 19 distinct sizes across all views

**Font weights via inline styles:**
- `400` (normal/regular), `500` (medium), `600` (semibold) — 3 weights, just above the 2-weight threshold

**CSS class-based typography (good):**
- `.eyebrow` — label style: 10.5px, uppercase, letter-spacing 0.08em, mono
- `.mono` — monospace font with tabular numerals
- `.tnum` — tabular number spacing
- `.serif` — serif font for headings

**Assessment:** The type scale is large but coherent — it serves a data-dense clinical dashboard where macro values, KPIs, labels, body text, and headings each need distinct treatment. This is a deliberate design decision carried from the prototype, not accidental variation. The migration preserved it faithfully.

**Minor issues:**
- `13.5px` and `12.5px` are unusual sizes; consider rounding to `13px`/`12px` or `14px`/`13px`
- Inline `style={{ fontSize: XX }}` is pervasive (100+ occurrences) rather than CSS classes or Tailwind utilities — this is a migration artifact that could be consolidated in a future refactor pass

### Pillar 5: Spacing (2/4)

**Tailwind spacing class usage:** Extremely minimal. The project uses inline `style={{ padding, margin, gap }}` objects almost exclusively.

**Representative spacing patterns (all via inline styles):**
- `padding: '12px 18px'`, `padding: '6px 0'`, `padding: '16px 18px'`, `padding: '24px'`
- `marginBottom: 20`, `marginBottom: 16`, `marginBottom: 24`, `marginBottom: 32`
- `gap: 8`, `gap: 14`, `gap: 16`, `gap: 24`
- Arbitrary values throughout: `padding-top: 48px`, `padding-left: 288px`

**No spacing scale adopted:**
- Tailwind provides a spacing scale (`p-2` = 8px, `p-3` = 12px, `p-4` = 16px, etc.) but it is not used
- Values like `14px`, `18px`, `288px`, `34px` are not on the Tailwind scale
- This is a deliberate migration choice: the CSS was ported verbatim from the prototype to preserve pixel-perfect fidelity
- The project's `globals.css` does not define CSS custom properties for spacing

**Impact:**
- Maintenance burden: Changing padding on all cards requires finding and replacing inline values across 15+ view files
- Inconsistency risk: `12px 18px` vs `16px 18px` vs `12px 16px` patterns appear in similar card contexts with no scale reference
- No spacing consistency guarantee across future components

**Recommendation:** Define a spacing scale in `globals.css` (e.g., `--space-1: 4px`, `--space-2: 8px`, `--space-3: 12px`, `--space-4: 16px`, `--space-6: 24px`, `--space-8: 32px`) and gradually migrate inline values to use these tokens. New components should use Tailwind spacing classes.

### Pillar 6: Experience Design (2/4)

**Loading states: 0/4 coverage**
- No skeleton screens anywhere in the application
- No spinner or loading indicator components
- No React.Suspense boundaries
- Current data is synchronous (mock) — when backend connects, all views will appear frozen during fetch
- Critical views needing loading states: HomeView (KPIs, events, alerts), PatientView (macro data, timeline, biometry), PlansView (meal plan), FoodsView (catalog), InsightsView (aggregate data)

**Error boundaries: 0/4 coverage**
- No `ErrorBoundary` component exists
- No `try/catch` in component logic
- Form validation only checks for empty required fields: `!name.trim()`, `!email.trim()`
- No API error states (no API yet, but will need them)

**Empty states: 2/4 coverage**
- ✅ FoodsView: "Nenhum alimento bate com esse filtro." (search empty state)
- ✅ Sidebar: "Nenhum paciente neste filtro." (filter empty state)
- ✅ OnboardingView: handles `patients.length === 0` for first-run experience
- ❌ HomeView: no empty state for events/alerts when no data exists
- ❌ PatientView: no empty state for timeline or biometry tabs
- ❌ PlansView: no empty state for meal plan (always has mock data)

**Destructive action confirmation: 2/3 coverage**
- ✅ FoodsView: `DeleteConfirmModal` with "Tem certeza que deseja excluir este alimento?"
- ✅ PatientsView: `TogglePatientModal` for activate/deactivate with confirmation
- ❌ PlansView: Meal deletion has NO confirmation — clicking delete icon immediately removes a meal row

**Disabled states: 2/4 coverage**
- ✅ SignupView: "Criar conta" button disabled when form is invalid (opacity change)
- ✅ FoodsView: Create button disabled when food name is empty (opacity 0.45)
- ✅ PatientsView: Pagination buttons disabled with opacity 0.35
- ❌ LoginView: "Entrar" button always enabled (could disable when email/password empty)
- ❌ PlansView: No disabled state for save/export actions

---

## Files Audited

**CSS:**
- `frontend/src/styles/globals.css` (~1963 lines)

**TypeScript/React:**
- `frontend/src/App.tsx`
- `frontend/src/main.tsx`
- `frontend/src/components/shell/Rail.tsx`
- `frontend/src/components/shell/Sidebar.tsx`
- `frontend/src/components/shell/Topbar.tsx`
- `frontend/src/views/HomeView.tsx`
- `frontend/src/views/PatientsView.tsx`
- `frontend/src/views/PatientView.tsx`
- `frontend/src/views/PlansView.tsx`
- `frontend/src/views/FoodsView.tsx`
- `frontend/src/views/LandingView.tsx`
- `frontend/src/views/LoginView.tsx`
- `frontend/src/views/SignupView.tsx`
- `frontend/src/views/OnboardingView.tsx`
- `frontend/src/views/InsightsView.tsx`

**Screenshots:**
- `.planning/ui-reviews/02-20260420-081829/desktop.png`
- `.planning/ui-reviews/02-20260420-081829/mobile.png`
- `.planning/ui-reviews/02-20260420-081829/tablet.png`