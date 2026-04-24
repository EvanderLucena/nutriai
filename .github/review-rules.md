# AI Reviewer Rules — NutriAI

## Project Context
- Brazilian nutritionist SaaS (pt-BR all UI text)
- Stack: React 18 + TypeScript + Vite + Tailwind (front), Java 21 + Spring Boot + PostgreSQL (back)
- Monorepo: `frontend/` and `backend/` directories
- Row-level tenant isolation via `nutritionistId` FK — every query MUST scope by the authenticated nutritionist

## Security Rules (CRITICAL)
- Every controller endpoint MUST have `@PreAuthorize` annotation — no endpoint without explicit auth
- Every database query MUST filter by `nutritionistId` — no unscoped queries
- Auth endpoints (`/auth/*`) are the ONLY exception to `@PreAuthorize`
- Never log or expose `passwordHash`, JWT tokens, or PII in API responses
- Signup returns `{ accessToken, user }` directly (no envelope) — all other endpoints return `{ success, data }` envelope
- Duplicate email returns HTTP 409 (not 400)

## Frontend Rules
- Hooks: always `React.useState`, `React.useEffect` (never destructure from React import in most files)
- Stores: Zustand with `partialize` for persistence — `accessToken` MUST be in partialize
- API client: axios interceptor must normalize URL prefix before `startsWith` checks
- Playwright selectors: scope to `.page .search input` (not just `.search input`) to avoid sidebar conflicts
- Onboarding: after signup, call `/auth/onboarding` API to set `onboardingCompleted: true`

## Naming Conventions
- Components: PascalCase (`HomeView`, `PatientCard`)
- Variables: camelCase (`activePatientId`, `setView`)
- Constants: UPPER_SNAKE_CASE (`PATIENTS`, `ANA`)
- CSS: kebab-case (`.card-h`, `.pq-item`)
- Files: `view_{name}.jsx`/`.tsx` for views, lowercase for modules

## Architecture Rules
- Controller → Service → Repository (never Controller → Repository)
- Frontend: View → Store → API (never View → API directly, never circular View ↔ Store)
- All API modules in `frontend/src/api/` 
- All Zustand stores in `frontend/src/stores/`

## Testing Rules
- E2E contracts: UI sends pt-BR labels, API expects enum keys (e.g., "HIPERTROFIA" not "Hipertrofia")
- E2E must test: enum rejection (sending label should return 400)
- E2E must test: error messages visible to user (no silent errors)
- E2E must test: cross-tenant isolation (nutritionist A cannot access B's data)

## LGPD Rules
- Health data is sensitive under LGPD — never hardcode PII in tests or logs
- Patient data must be scoped by nutritionist — no global queries
- All endpoints that create patients must accept consent terms

## Do NOT Flag
- Mock data patterns (in-memory data, hardcoded arrays in prototype code)
- Missing i18n (project is intentionally pt-BR only)
- Existing ESLint/Checkstyle warnings that are already tracked (complexity, max-lines)
- Test-only helpers or fixtures