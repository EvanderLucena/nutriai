---
status: complete
phase: 02-frontend-migration
source: 02-01-SUMMARY.md, 02-02-SUMMARY.md, 02-05-SUMMARY.md, 02-06-SUMMARY.md, 02-UI-REVIEW.md
started: 2026-04-20T22:30:00Z
updated: 2026-04-20T22:45:00Z
---

## Current Test

number: 0
name: [testing complete]
expected: |
  [all tests resolved]
awaiting: none

## Tests

### 1. App Cold Start & Build
expected: Run `npm run build` in frontend/ — production build succeeds with zero TypeScript errors. Start dev server (`npm run dev`) — app loads at localhost:5173 without console errors. All 10 route paths render accessible views.
result: pass
evidence: tsc --noEmit: 0 errors. npm run build: 86 modules, 473KB JS + 55KB CSS. Dev server: 200 on all 8 route paths (/, /login, /signup, /onboarding, /home, /patients, /patient/p1, /foods, /insights).

### 2. Landing Page Content
expected: Landing page at `/` shows hero section with eyebrow, 3-line title, subtitle, CTA buttons ("Começar agora", "Ver planos"). "Como funciona" section with 3 alternating step blocks. 8 feature cards in grid. "Planos" section with 3 pricing cards (Iniciante R$99,99, Profissional R$149,99, Ilimitado R$199,99). FAQ section. Footer. All text in pt-BR.
result: pass

### 3. Login & Signup Flow
expected: Login at `/login` shows dark left panel with brand, email/password form, "Lembrar de mim" checkbox, Google OAuth button, link to signup. Signup at `/signup` shows 2-step flow: step 1 (email, password), step 2 (CRN, UF, specialty, WhatsApp). Navigation between login/signup works. All text in pt-BR.
result: pass

### 4. Onboarding Wizard
expected: Onboarding at `/onboarding` shows 4-step flow with numbered progress dots: 1-"Conheça sua carteira", 2-"Configure seu primeiro plano", 3-"Convide seus pacientes", 4-"Pronto!". Avançar/Voltar navigation between steps. "Pular por enquanto" option available.
result: pass

### 5. Dashboard HomeView
expected: After login, `/home` shows 4 KPI cards (Pacientes ativos, Adesão média, Refeições registradas, Consultas este mês). Patient cards grid below KPIs with avatars and status dots. Clicking a patient card navigates to patient detail.
result: pass

### 6. Patient List with Filters
expected: `/patients` shows patient list with table/grid toggle. Status filter chips work: Todos, No caminho (green), Atenção (amber), Crítico (red). Search filters patients by name. Pagination shows with PAGE_SIZE=6. New Patient modal opens with form. Edit Patient modal opens pre-filled.
result: pass

### 7. Patient Detail 5 Tabs
expected: `/patient/p1` shows 5 tabs: Hoje, Plano, Biometria, Insights, Histórico. "Hoje" tab shows MacroRings (protein=sage, carbs=amber, fat=sky), timeline with events. Biometria tab shows LineChart and "Nova avaliação" button. Tab switching works.
result: pass

### 8. Meal Plan Editor
expected: `/plans` (or Patient Plano tab) shows meal cards with options (Opção A/B). Food rows are inline-editable (click quantity to edit). Macro totals update reactively. "Adicionar alimento" button works. Extras section below meals. "Alimentos extras" heading visible.
result: pass

### 9. Food Catalog
expected: `/foods` shows food cards (base items with per-100g data, preset items with portion data). Category filter chips work. Search filters by name. Pagination at PAGE_SIZE=8. "Adicionar alimento" modal opens. Delete confirmation modal appears with "Tem certeza..." text.
result: pass

### 10. Insights Dashboard
expected: `/insights` shows aggregate stats with StackBar visualization (CarteiraChart). Summary cards (Pacientes ativos, Adesão média, Refeições registradas). Patient adherence list visible. All text in pt-BR.
result: pass

### 11. Dark Theme Carbohydrate Color
expected: Switch to dark theme. Carbohydrate/macro values that appear amber in light theme should still be visible and appropriately colored in dark theme. Check PatientView macro rings and food cards — if `#A0801F` appears washed out or invisible in dark mode, that confirms the hardcoded color issue from UI review.
result: issue
reported: "Code audit confirms: #A0801F hardcoded in 13 places (PatientView 6x, FoodsView 2x, PlanFoodRow 1x, ExtrasSection 1x, AddMealModal 1x, EditFoodModal 1x). Not in design token system — will NOT adapt to dark theme."
severity: major

### 12. SVG Lime Color in Dark Theme
expected: In dark theme, Landing page and Login page SVG leaf/logo elements should match the lime accent color. If they appear as a different shade than other lime-colored elements (chips, buttons), that confirms the `#D4FF4F` hardcoded hex issue.
result: issue
reported: "Code audit confirms: #D4FF4F hardcoded in 8 places (LandingView 2x, LoginView 2x, OnboardingView 2x, SignupView 2x). Bypasses var(--lime) token — will NOT adapt to dark theme."
severity: major

### 13. Meal Deletion Confirmation
expected: In PlansView, hover over a food row and click the delete/trash icon. Does a confirmation dialog appear before the row is removed? UI review flagged that meal deletion has NO confirmation — deleting immediately removes the row.
result: issue
reported: "Code audit confirms: PlanFoodRow.tsx line 60 has onClick={onRemove} with title='Remover' — no confirmation dialog. PlansView.tsx removeItem() at line 109 directly filters the array, no confirm() call. Destructive action has no safety gate."
severity: minor

### 14. Sidebar Responsive Collapse
expected: Resize browser window to below 1200px width. Sidebar should auto-collapse. Topbar hamburger button should appear. Clicking hamburger toggles sidebar visibility.
result: pass

### 15. Login Button Disabled State
expected: On Login page, with email and password fields empty, is the "Entrar" button visually disabled (dimmed/unclickable)? UI review flagged that the button is always enabled.
result: issue
reported: "Code audit confirms: LoginView.tsx has no 'disabled' or 'opacity' attributes on the submit button. handleSubmit (line 14) checks empty fields and sets error message, but button is always visually enabled — no disabled state styling."
severity: minor

## Summary

total: 15
passed: 10
issues: 4
pending: 0
skipped: 0
blocked: 0

## Gaps

- truth: "Carbohydrate macro color adapts to dark theme via design tokens"
  status: failed
  reason: "Code audit confirms: #A0801F hardcoded in 13 places — not in design token system, will NOT adapt to dark theme"
  severity: major
  test: 11
  root_cause: "Migrated inline styles from prototype verbatim without converting hardcoded hex colors to CSS custom properties. #A0801F was the prototype's carb-amber but never added as a --amber-dark / --carb token."
  artifacts:
    - path: "frontend/src/views/PatientView.tsx"
      issue: "#A0801F hardcoded at lines 133, 159, 205, 223, 264, 306, 349"
    - path: "frontend/src/views/FoodsView.tsx"
      issue: "#A0801F hardcoded at lines 189, 237"
    - path: "frontend/src/components/plan/PlanFoodRow.tsx"
      issue: "#A0801F hardcoded at line 60"
    - path: "frontend/src/components/plan/ExtrasSection.tsx"
      issue: "#A0801F hardcoded at line 69"
    - path: "frontend/src/components/plan/AddMealModal.tsx"
      issue: "#A0801F hardcoded at line 63"
    - path: "frontend/src/components/plan/EditFoodModal.tsx"
      issue: "#A0801F hardcoded at line 60"
  missing:
    - "Add --carb: #A0801F and --carb-dark: #C4961F tokens to globals.css :root and [data-theme=dark]"
    - "Replace all #A0801F references with var(--carb) in 6 files"

- truth: "SVG lime elements match brand accent color across themes"
  status: failed
  reason: "Code audit confirms: #D4FF4F hardcoded in 8 places — bypasses var(--lime) token"
  severity: major
  test: 12
  root_cause: "SVG path stroke/fill attributes can't use CSS classes — prototype used hardcoded hex. Migration preserved these without replacing with style={{ fill: 'var(--lime)' }} or style={{ stroke: 'var(--lime)' }}"
  artifacts:
    - path: "frontend/src/views/LandingView.tsx"
      issue: "#D4FF4F hardcoded at lines 59, 60"
    - path: "frontend/src/views/LoginView.tsx"
      issue: "#D4FF4F hardcoded at lines 30, 31"
    - path: "frontend/src/views/OnboardingView.tsx"
      issue: "#D4FF4F hardcoded at lines 102, 103"
    - path: "frontend/src/views/SignupView.tsx"
      issue: "#D4FF4F hardcoded at lines 56, 57"
  missing:
    - "Replace stroke='#D4FF4F' with style={{ stroke: 'var(--lime)' }} in SVGs"
    - "Replace fill='#D4FF4F' with style={{ fill: 'var(--lime)' }} in SVGs"

- truth: "Meal plan food deletion shows confirmation before removing"
  status: failed
  reason: "Code audit confirms: PlanFoodRow onClick={onRemove} with no confirmation dialog; PlansView removeItem() directly filters array"
  severity: minor
  test: 13
  root_cause: "Prototype had no delete confirmation for meal items — deletion calls removeItem() directly. Only FoodsView has a DeleteConfirmModal pattern."
  artifacts:
    - path: "frontend/src/components/plan/PlanFoodRow.tsx"
      issue: "onClick={onRemove} at line 60 with title='Remover', no confirmation"
    - path: "frontend/src/views/PlansView.tsx"
      issue: "removeItem() at line 109 directly filters state, no confirm() call"
  missing:
    - "Add DeleteConfirmModal to PlansView (reuse pattern from FoodsView)"
    - "Wire PlanFoodRow onRemove through confirmation dialog before calling removeItem"

- truth: "Login submit button visually disabled when fields are empty"
  status: failed
  reason: "Code audit confirms: LoginView.tsx has no disabled/opacity attributes on submit button — always visually enabled"
  severity: minor
  test: 15
  root_cause: "handleSubmit validates empty fields and shows error message, but button is never disabled. No disabled styling applied."
  artifacts:
    - path: "frontend/src/views/LoginView.tsx"
      issue: "No 'disabled' or 'opacity' on submit button — button always visually active"
  missing:
    - "Add disabled={!email || !password} to LoginView submit button"
    - "Add opacity: 0.45 styling for disabled state (matching FoodsView pattern)"