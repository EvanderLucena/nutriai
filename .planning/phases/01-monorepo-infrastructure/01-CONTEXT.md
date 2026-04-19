# Phase 1: Monorepo & Infrastructure - Context

**Gathered:** 2026-04-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Setting up a reproducible development environment where all services boot together. The developer clones the repo, runs `docker-compose up`, and gets frontend (Vite dev server), backend (Spring Boot), and PostgreSQL running with hot reload. Evolution API is deferred to Phase 7. Success is a health endpoint confirming backend+DB connection and frontend serving with HMR.

</domain>

<decisions>
## Implementation Decisions

### Project structure
- **D-01:** Flat monorepo layout: `/frontend` (React+TS+Vite), `/backend` (Spring Boot), `/docker` (compose files, Dockerfiles), `/scripts` (dev/build/deploy scripts), root `.env.example`
- **D-02:** Product name: NutriAI (placeholder, may change later)
- **D-03:** Java package base: `com.nutriai.api`

### Backend skeleton
- **D-04:** Layered architecture — packages by layer: `com.nutriai.api.controller`, `.service`, `.repository`, `.model`, `.config`, `.dto`, `.exception`
- **D-05:** Minimal schema for Phase 1 — create UserRole enum + Nutritionist placeholder entity + Flyway migration. Full entities come in later phases (Patient in Phase 4, etc.)
- **D-06:** REST API with versioning: `/api/v1/` prefix on all endpoints
- **D-07:** Flyway for database migrations — versioned SQL scripts in `src/main/resources/db/migration/`
- **D-08:** Global exception handler via `@ControllerAdvice` — standardized error response shape: `{error, message, timestamp, path}`
- **D-09:** Rich health endpoint: `GET /api/v1/health` returns `{status: "UP", timestamp, version, db: "connected"}` — confirms PostgreSQL connectivity
- **D-10:** Core Spring Boot starters only: Spring Web, Spring Data JPA, PostgreSQL Driver, Flyway, Lombok, Validation. Spring Security + JWT deferred to Phase 3.

### Frontend setup
- **D-11:** Flat-by-type folder structure: `/src/components`, `/src/views`, `/src/hooks`, `/src/lib`, `/src/types` — organized by file type, simple and scalable for this app size
- **D-12:** State management: React Context for auth + Zustand for global client state (patient list, active tab, etc.). Server state (API data) will use TanStack Query when needed in later phases.
- **D-13:** React Router v7 for client-side routing — replaces the prototype's view state conditional rendering
- **D-14:** Axios as HTTP client — with interceptor setup for auth token and error handling, though real API calls come in later phases
- **D-15:** Custom Tailwind theme tokens — map existing CSS custom properties (--lime, --coral, --sage, --amber, --sky, light/dark themes) to Tailwind theme extensions. Preserves visual identity from prototype.
- **D-16:** Small component library in Phase 1: Button, Input, Card, Modal based on prototype design. Foundation for Phase 2 migration.

### Docker & dev env
- **D-17:** Core services only in docker-compose: frontend (Vite dev server), backend (Spring Boot), PostgreSQL. Evolution API deferred to Phase 7.
- **D-18:** Shell scripts in `/scripts`: `dev.sh` (starts everything), `setup.sh` (first-time setup), `logs.sh` (follow logs), `down.sh` (tear down)
- **D-19:** Config via `.env.example` + `application.yml` with defaults + env var overrides. Docker Compose reads `.env`, Spring Boot reads `application.yml` with env var overrides.
- **D-20:** Hot reload on both frontend and backend: Vite HMR via volume mount for frontend, Spring DevTools auto-restart for backend
- **D-21:** Default ports: Frontend 5173, Backend 8080, PostgreSQL 5432
- **D-22:** PostgreSQL initialized with named Docker volume for data persistence + optional seed script in `/scripts`

### OpenCode's Discretion
- Exact Spring Boot project structure (config classes, base entity patterns)
- Vite configuration details (plugins, build options)
- Dockerfile specifics (base images, layer caching)
- .gitignore contents
- Exact Tailwind config syntax
- ESM/CJS module format for scripts
- Linting/formatting config (ESLint, Prettier)
- Test framework selection (JUnit for backend, Vitest for frontend)

</decisions>

<canonical_refs>
## Canonical References

### Project requirements
- `.planning/REQUIREMENTS.md` — INFRA-01, INFRA-03, INFRA-04 are the requirements for this phase
- `.planning/ROADMAP.md` §Phase 1 — Success criteria and phase boundary
- `.planning/PROJECT.md` — Tech stack constraints (React+TS+Vite+Tailwind locked, Java 21+Spring Boot+PostgreSQL locked, monorepo with scripts no Turborepo locked)

### Existing prototype (migration source)
- `.planning/codebase/STACK.md` — Current prototype technology stack and patterns
- `.planning/codebase/ARCHITECTURE.md` — Component tree, data flow, routing patterns
- `.planning/codebase/CONVENTIONS.md` — CSS custom properties, naming conventions, typography system
- `.planning/codebase/STRUCTURE.md` — File inventory and dependency graph

### Research
- `.planning/research/STACK.md` — Recommended versions and libraries for the production stack
- `.planning/research/ARCHITECTURE.md` — Backend and frontend architecture patterns

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `styles.css` (1726 lines) — Complete design system with CSS custom properties (--lime, --coral, --sage, --amber, --sky), light/dark theme tokens, typography scales, component classes. This is the visual source of truth for Phase 2 migration.
- `icons.jsx` (29 SVG icon components) — Will need TypeScript migration but SVGs are reusable as-is
- `viz.jsx` (Ring, MacroRings, Sparkline, WeekBars, LineChart, StackBar) — Data visualization primitives, reusable with TypeScript adaptation
- `data.jsx` (PATIENTS, ANA, AGGREGATE) — Mock data structure defines the domain model shapes

### Established Patterns
- CSS custom properties with light/dark theme via `[data-theme]` attribute on `<html>` — must be preserved in Tailwind migration
- Status system: `"ontrack"` | `"warning"` | `"danger"` with mapped CSS variables — will carry to backend enums
- Macro structure: `{kcal: {target, actual}, prot: {target, actual}, carb: {target, actual}, fat: {target, actual}}` — informs Nutritionist/Patient/Plan entity design
- All UI text in pt-BR — continues in production

### Integration Points
- Backend health endpoint (`/api/v1/health`) must be callable from frontend Axios setup
- Flyway migration path must start from empty schema and build up incrementally
- Docker Compose networking: frontend container needs to reach backend:8080, backend needs to reach postgresql:5432

</code_context>

<specifics>
## Specific Ideas

- Flat monorepo (no Turborepo/Nx) — organized with directories and scripts
- Package base `com.nutriai.api` — layered structure, not domain-driven
- NutriAI is a placeholder name — may change, but `nutriai` in package/Docker naming is fine for now
- Named Docker volumes for PostgreSQL — data persists across container restarts
- Shell scripts for dev workflow — more ergonomic than raw docker-compose commands

</specifics>

<deferred>
## Deferred Ideas

- Evolution API container — deferred to Phase 7 (WhatsApp Intelligence) since it's not needed until then
- Spring Security + JWT setup — deferred to Phase 3 (Authentication & Onboarding)
- TanStack Query integration — deferred to Phase 2+ when real API calls start
- Full entity model (Patient, MealPlan, Food, etc.) — each entity belongs to its respective phase
- Production Dockerfiles (multi-stage builds) — Phase 10 (CI/CD & Deployment)
- Payment gateway integration (Stripe vs Pagar.me) — Phase 8 (Billing)

</deferred>

---

*Phase: 01-monorepo-infrastructure*
*Context gathered: 2026-04-19*