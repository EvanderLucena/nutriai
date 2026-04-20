---
phase: 02-frontend-migration
reviewed: 2026-04-20T12:00:00Z
depth: standard
files_reviewed: 42
files_reviewed_list:
  - frontend/src/App.tsx
  - frontend/src/main.tsx
  - frontend/src/vite-env.d.ts
  - frontend/src/api/client.ts
  - frontend/src/api/types.ts
  - frontend/src/data/patients.ts
  - frontend/src/data/ana.ts
  - frontend/src/data/aggregate.ts
  - frontend/src/data/foods.ts
  - frontend/src/data/index.ts
  - frontend/src/stores/authStore.ts
  - frontend/src/stores/navigationStore.ts
  - frontend/src/stores/themeStore.ts
  - frontend/src/hooks/usePublicTheme.ts
  - frontend/src/hooks/useRouteSync.ts
  - frontend/src/hooks/useTheme.ts
  - frontend/src/types/patient.ts
  - frontend/src/types/food.ts
  - frontend/src/types/plan.ts
  - frontend/src/types/biometry.ts
  - frontend/src/types/index.ts
  - frontend/src/lib/utils.ts
  - frontend/src/components/icons/index.tsx
  - frontend/src/components/KPI.tsx
  - frontend/src/components/viz/Ring.tsx
  - frontend/src/components/viz/MacroRings.tsx
  - frontend/src/components/viz/Sparkline.tsx
  - frontend/src/components/viz/WeekBars.tsx
  - frontend/src/components/viz/LineChart.tsx
  - frontend/src/components/viz/StackBar.tsx
  - frontend/src/components/viz/index.ts
  - frontend/src/components/shell/AppShell.tsx
  - frontend/src/components/shell/Rail.tsx
  - frontend/src/components/shell/Sidebar.tsx
  - frontend/src/components/shell/Topbar.tsx
  - frontend/src/components/patient/index.ts
  - frontend/src/components/patients/index.ts
  - frontend/src/components/plan/index.ts
  - frontend/src/components/plan/PlanFoodRow.tsx
  - frontend/src/components/plan/OptionTab.tsx
  - frontend/src/components/plan/AddFoodModal.tsx
  - frontend/src/components/plan/EditFoodModal.tsx
  - frontend/src/components/plan/AddMealModal.tsx
  - frontend/src/components/plan/ExtrasSection.tsx
  - frontend/src/components/ui/Button.tsx
  - frontend/src/components/ui/Card.tsx
  - frontend/src/components/ui/Input.tsx
  - frontend/src/components/ui/Modal.tsx
  - frontend/src/views/HomeView.tsx
  - frontend/src/views/PatientsView.tsx
  - frontend/src/views/PatientView.tsx
  - frontend/src/views/PlansView.tsx
  - frontend/src/views/FoodsView.tsx
  - frontend/src/views/InsightsView.tsx
  - frontend/src/views/LandingView.tsx
  - frontend/src/views/LoginView.tsx
  - frontend/src/views/SignupView.tsx
  - frontend/src/views/OnboardingView.tsx
  - frontend/src/styles/globals.css
  - frontend/src/test-setup.ts
  - frontend/src/views/PlansView.test.tsx
  - frontend/src/views/LoginView.test.tsx
findings:
  critical: 1
  warning: 5
  info: 4
  total: 10
status: issues_found
---

# Phase 02: Code Review Report

**Reviewed:** 2026-04-20T12:00:00Z
**Depth:** standard
**Files Reviewed:** 42
**Status:** issues_found

## Summary

Reviewed all 42 source files in `frontend/src/` that were migrated as part of the React+TypeScript+Vite+Tailwind frontend migration (Phase 2). The migration is structurally sound — Zustand stores, React Router, TypeScript types, and component organization all follow good patterns. However, one **critical XSS vulnerability** was found in the PDF export, along with several warnings around auth security and data handling.

Key concerns:
1. **Critical XSS** in `PlansView.tsx` PDF export via unsanitized string interpolation into `document.write()`
2. **Weak authentication** — localStorage token of `'true'` is trivially forgeable and provides no real auth
3. Several state synchronization issues between zustand stores and React Router that could cause stale UI

## Critical Issues

### CR-01: XSS via document.write with Unsanitized User Input

**File:** `frontend/src/views/PlansView.tsx:184-189`
**Issue:** The `exportPDF` function interpolates meal plan data strings directly into an HTML template written via `document.write()` to a new window. Fields like `it.food`, `it.qty`, `it.prep`, `o.name`, `m.label`, `m.time`, and `planTitle` are embedded in HTML without any sanitization. A user entering `<script>alert(1)</script>` as a food name would execute arbitrary JavaScript in the context of the opened window. Even though this is client-side only, it allows cookie theft / credential exfiltration if the attacker can control food names.

```tsx
// Line 184 — it.food, it.qty, it.prep all unsanitized
const rows = o.items.map((it) => `<li><strong>${it.food}</strong>${it.qty ? ' · ' + it.qty : ''}${it.prep && it.prep !== '-' ? ' <span class="prep">(' + it.prep + ')</span>' : ''}</li>`).join('');
// Line 189 — planTitle and mealBlocks directly injected
win.document.write(`...<title>${planTitle}</title>...<h1>${planTitle}</h1>...${mealBlocks}...`);
```

**Fix:** Use `textContent`/DOM APIs instead of string interpolation, or sanitize all dynamic values before embedding in HTML. The safest approach is to build the document using DOM methods:
```tsx
const exportPDF = () => {
  const win = window.open('', '_blank');
  if (!win) return;
  const doc = win.document;
  doc.open();
  doc.write('<!DOCTYPE html><html><head><meta charset="utf-8">');
  // Use DOM method for title
  doc.write(`<title></title><style>...</style></head><body>`);
  const h1 = doc.createElement('h1');
  h1.textContent = planTitle; // Safe — textContent escapes HTML
  doc.body.appendChild(h1);
  // ... build remaining DOM with createElement + textContent
  doc.close();
  win.focus();
  setTimeout(() => win.print(), 400);
};
```
Or at minimum, create a `sanitizeHtml` utility that escapes `&`, `<`, `>`, `"`, `'` before interpolation.

## Warnings

### WR-01: Trivially Forgeable Authentication

**File:** `frontend/src/stores/authStore.ts:14-17`
**Issue:** Authentication state is stored as the string `'true'` in `localStorage` under the key `nutriai.auth`. Any user can open DevTools and set `localStorage.setItem('nutriai.auth', 'true')` to bypass auth entirely. This provides zero security — it's a placeholder, but it should at minimum store an opaque token rather than a boolean string, and the auth guard in `App.tsx` should validate it (even if the backend doesn't exist yet).

**Fix:** Replace with a token-based approach even for the mock phase:
```ts
login: (token: string) => {
  localStorage.setItem('nutriai.token', token);
  set({ isAuthenticated: true, authView: null });
},
```
This way the architecture is ready for Phase 3 real auth, and the value isn't trivially guessable.

### WR-02: Zustand Store / React Router State Desync

**File:** `frontend/src/stores/navigationStore.ts:33-34` and `frontend/src/hooks/useRouteSync.ts`
**Issue:** Navigation state is maintained in both zustand (`useNavigationStore`) and React Router (`useLocation`/`navigate`). Components like `HomeView.tsx` call both `setActivePatientId(id)`, `setView('patient')`, AND `navigate('/patient/' + id)`. If the store update and the route change get out of sync (e.g., browser back/forward), the UI may show stale data. The `useRouteSync` hook syncs route→store on mount, but not store→route, creating a potential one-way desync.

**Fix:** Consider making React Router the single source of truth for navigation, using URL params for active patient ID (`/patient/:id`), and deriving view from the route rather than maintaining a parallel zustand state. At minimum, add a `popstate` listener that syncs browser back/forward to the store.

### WR-03: PDF Export Hardcoded Patient Name

**File:** `frontend/src/views/PlansView.tsx:189`
**Issue:** The `exportPDF` function hardcodes `"Ana Beatriz L."` as the patient name in the exported PDF metadata. This should be dynamic based on the currently selected patient, not a static string.

```tsx
win.document.write(`...<div class="meta">Ana Beatriz L. · ${new Date().toLocaleDateString('pt-BR')} · NutriAI</div>...`);
```

**Fix:** Receive patient name as a prop or derive it from the route/store:
```tsx
const patientName = '...'; // from props or navigation store
win.document.write(`...<div class="meta">${sanitizeHtml(patientName)} · ${new Date().toLocaleDateString('pt-BR')} · NutriAI</div>...`);
```

### WR-04: Missing `activePatientId` Guard in PatientView

**File:** `frontend/src/views/PatientView.tsx:12`
**Issue:** `PatientView` initializes state with `{ ...ANA }` unconditionally, but doesn't use the `activePatientId` from the URL or navigation store to select the correct patient. It always shows ANA's data regardless of which patient was clicked. The route `/patient/:id` is set up in `App.tsx` but the `:id` param is never read.

```tsx
const [patientData, setPatientData] = useState<DetailedPatient>({ ...ANA });
// Should be: const { id } = useParams(); const patient = PATIENTS.find(p => p.id === id) ?? ANA;
```

**Fix:** Use `useParams()` from React Router to get the `:id` parameter and look up the correct patient:
```tsx
import { useParams } from 'react-router';
// ...
const { id } = useParams();
const basePatient = PATIENTS.find(p => p.id === id);
// If we have detailed data for this patient, use it; otherwise fall back to ANA for demo
const [patientData, setPatientData] = useState<DetailedPatient>({ ...ANA });
```

### WR-05: Credit Card Data Handled in Component State Without PCI Awareness

**File:** `frontend/src/views/OnboardingView.tsx:70`
**Issue:** The onboarding form collects credit card number, CVV, expiry, and CPF in React component state. While this is a mock/prototype and no real payment gateway exists, the pattern establishes a dangerous precedent. Card data is held in plain React state and never cleared from memory after "submission." The CVV is stored as a string in state — even in a mock, this creates a pattern that could be copy-pasted into production code.

```tsx
const [payment, setPayment] = useState({ name: '', cpf: '', card: '', expiry: '', cvv: '' });
```

**Fix:** Add a clear comment marking this as mock-only and ensure the state is cleared after step transitions. For production (Phase 3+), replace this entirely with a Stripe/Braintree tokenization element that never lets the card data touch React state:
```tsx
// MOCK ONLY — In production, use Stripe Elements / Payment Element
// Card data must NEVER be handled in client JS state
const [payment, setPayment] = useState({ name: '', cpf: '', card: '', expiry: '', cvv: '' });
```
And clear sensitive fields after step 6:
```tsx
const goHome = () => {
  setPayment({ name: '', cpf: '', card: '', expiry: '', cvv: '' }); // Clear sensitive data
  login();
  navigate('/home');
};
```

## Info

### IN-01: Unused `remember` State in LoginView

**File:** `frontend/src/views/LoginView.tsx:8`
**Issue:** The `remember` checkbox state (`remember` / `setRemember`) is tracked but never used — no "remember me" functionality is implemented, and the value doesn't affect localStorage or auth persistence.

**Fix:** Either implement remember-me functionality (e.g., persist email in localStorage when checked) or remove the state and checkbox if not needed for this phase.

### IN-02: Hardcoded `#A0801F` Color in HomeView

**File:** `frontend/src/views/HomeView.tsx:58`
**Issue:** One instance of the hardcoded hex `#A0801F` remains (for carbohydrate amber color in the "danger" status branch of PatientCard). While most files were updated in plan 7 to use `var(--carb)`, this instance was missed:
```tsx
color: p.status === 'ontrack' ? 'var(--sage-dim)' : p.status === 'warning' ? '#A0801F' : 'var(--coral-dim)',
```
Should be `'var(--carb)'` for consistency and dark theme support.

**Fix:** Replace `'#A0801F'` with `'var(--carb)'` on line 58.

### IN-03: Empty `href="#"` Links (Accessibility SEO Concerns)

**Files:** `frontend/src/views/LandingView.tsx:503-506`, `frontend/src/views/LoginView.tsx:77`, `frontend/src/views/SignupView.tsx:136`
**Issue:** Multiple `<a href="#">` links that navigate nowhere (Terms, Privacy, LGPD, FAQ links). These cause an unwanted scroll-to-top on click and are inaccessible. This is acceptable for a prototype/migration phase but should use `<button type="button">` or proper routes in production.

**Fix:** Either replace with `<button type="button" className="...">` for interactive elements that don't navigate, or wire to actual routes when content pages exist.

### IN-04: TODO Comment in API Client

**File:** `frontend/src/api/client.ts:18`
**Issue:** A `// TODO: Phase 3 — attach JWT token from auth store` comment with commented-out code exists. This is expected as a Phase 3 marker, but should be tracked.

**Fix:** Acceptable as-is; track for Phase 3 implementation.

---

_Reviewed: 2026-04-20T12:00:00Z_
_Reviewer: OpenCode (gsd-code-reviewer)_
_Depth: standard_