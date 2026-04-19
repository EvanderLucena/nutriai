# Phase 1: Monorepo & Infrastructure - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-19
**Phase:** 01-monorepo-infrastructure
**Areas discussed:** Project structure, Backend skeleton, Frontend setup, Docker & dev env

---

## Project structure

| Option | Description | Selected |
|--------|-------------|----------|
| Flat monorepo | /frontend, /backend, /docker, /scripts, root .env.example | ✓ |
| Monorepo with workspaces | Turborepo/Nx with package management | |
| Polyrepo | Separate repos per service | |

**User's choice:** Flat monorepo
**Notes:** No Turborepo/Nx. Simple directory structure with scripts. NutriAI as placeholder name. Package base com.nutriai.api.

---

## Backend skeleton

### Architecture approach

| Option | Description | Selected |
|--------|-------------|----------|
| Layered | Packages by layer (controller, service, repository) | ✓ |
| Domain-driven | Packages by domain (patient.controller, patient.service) | |
| Hybrid | Domain packages with layer sub-packages | |

**User's choice:** Layered (com.nutriai.api.controller, .service, .repository, etc.)
**Notes:** Classic Spring pattern, easy to navigate for a solo developer.

### Entity initialization strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal schema | UserRole + Nutritionist placeholder + Flyway migration | ✓ |
| Full schema upfront | All entities (Patient, MealPlan, Food, etc.) from the start | |

**User's choice:** Minimal schema
**Notes:** Each entity belongs to its phase. Start minimal, expand incrementally.

### API style

| Option | Description | Selected |
|--------|-------------|----------|
| REST versioned | /api/v1/patients, /api/v1/auth | ✓ |
| REST flat | /patients, /auth — no versioning | |

**User's choice:** REST versioned with /api/v1/ prefix

### Database migrations

| Option | Description | Selected |
|--------|-------------|----------|
| Flyway | Versioned SQL scripts in db/migration | ✓ |
| Liquibase | YAML/XML changelogs with rollback support | |

**User's choice:** Flyway
**Notes:** Native Spring Boot support, simpler for SQL-first workflow.

### Error handling

| Option | Description | Selected |
|--------|-------------|----------|
| Global exception handler | @ControllerAdvice with {error, message, timestamp, path} shape | ✓ |
| Per-controller handling | Try/catch in each controller method | |

**User's choice:** Global exception handler
**Notes:** Consistent error shape for frontend consumption.

### Health endpoint

| Option | Description | Selected |
|--------|-------------|----------|
| Rich health endpoint | GET /api/v1/health with status, timestamp, version, DB connection check | ✓ |
| Simple 200 OK | Bare status without dependency checks | |

**User's choice:** Rich health endpoint
**Notes:** Confirms PostgreSQL connectivity per success criterion #2.

### Spring Boot dependencies

| Option | Description | Selected |
|--------|-------------|----------|
| Core starters only | Spring Web, Data JPA, PostgreSQL Driver, Flyway, Lombok, Validation | ✓ |
| Core + Security early | Include Spring Security + JWT in Phase 1 | |

**User's choice:** Core starters only
**Notes:** Security + JWT deferred to Phase 3 (Authentication & Onboarding).

---

## Frontend setup

### Folder structure

| Option | Description | Selected |
|--------|-------------|----------|
| Flat-by-type | /src/components, /src/views, /src/hooks, /src/lib, /src/types | ✓ |
| Feature-based | /src/features/auth, /src/features/patients, etc. | |

**User's choice:** Flat-by-type
**Notes:** Simple and scalable for this app size.

### State management

| Option | Description | Selected |
|--------|-------------|----------|
| Context + Zustand | React Context for auth, Zustand for client state | ✓ |
| React Query + Zustand | TanStack Query for server state, Zustand for client state | |
| Context only | No external state lib, React Context + custom hooks | |

**User's choice:** Context + Zustand
**Notes:** TanStack Query will be added later when real API calls start.

### Routing

| Option | Description | Selected |
|--------|-------------|----------|
| React Router v7 | File-based or config-based routing, standard for React SPAs | ✓ |
| TanStack Router | Type-safe routes, smaller ecosystem | |
| Defer routing | Keep prototype conditional rendering for now | |

**User's choice:** React Router v7

### HTTP client

| Option | Description | Selected |
|--------|-------------|----------|
| Axios | With interceptor for auth token + error handling | ✓ |
| Native fetch | Zero dependency, more boilerplate | |
| Setup only | Create Axios base but no real calls yet | |

**User's choice:** Axios
**Notes:** Base setup in Phase 1 (interceptors, types), real calls in later phases.

### Tailwind color mapping

| Option | Description | Selected |
|--------|-------------|----------|
| Custom theme tokens | Map --lime, --coral, --sage etc. to Tailwind theme extensions | ✓ |
| Standard Tailwind colors | Use default Tailwind palette, redesign UI | |
| Utility-only Tailwind | Tailwind for layout only, colors stay as CSS custom properties | |

**User's choice:** Custom theme tokens
**Notes:** Preserves visual identity from the prototype. Light/dark theme via CSS custom properties continues.

### Component library

| Option | Description | Selected |
|--------|-------------|----------|
| Small component library | Button, Input, Card, Modal based on prototype | ✓ |
| No base components | Each view builds from scratch with Tailwind | |
| shadcn/ui | Pre-built component library, may not match existing design | |

**User's choice:** Small component library
**Notes:** Foundation components (Button, Input, Card, Modal) ported from prototype design. Expands in Phase 2.

---

## Docker & dev env

### Docker Compose services

| Option | Description | Selected |
|--------|-------------|----------|
| Core only | Frontend, backend, PostgreSQL. Evolution API in Phase 7 | ✓ |
| Full stack | Include Evolution API container from the start | |

**User's choice:** Core only (3 services)
**Notes:** Evolution API is not used until Phase 7, so deferring it avoids unnecessary complexity.

### Dev scripts

| Option | Description | Selected |
|--------|-------------|----------|
| Shell scripts | /scripts with dev.sh, setup.sh, logs.sh, down.sh | ✓ |
| npm scripts | Root package.json with npm run dev, etc. | |
| Raw docker-compose | Only docker-compose commands, documented in README | |

**User's choice:** Shell scripts
**Notes:** More ergonomic for daily development workflow.

### Environment config

| Option | Description | Selected |
|--------|-------------|----------|
| .env.example + application.yml | .env for Docker, application.yml with defaults + env overrides | ✓ |
| All env vars, no yml defaults | Replace entire application.yml with env vars | |

**User's choice:** .env.example + application.yml
**Notes:** Spring Boot convention. application.yml provides sensible defaults, env vars override.

### Hot reload

| Option | Description | Selected |
|--------|-------------|----------|
| Hot reload both | Vite HMR + Spring DevTools auto-restart | ✓ |
| Frontend hot, backend manual | Vite HMR, manual docker-compose restart for backend | |

**User's choice:** Hot reload both

### Ports

| Option | Description | Selected |
|--------|-------------|----------|
| Default ports | Frontend: 5173, Backend: 8080, PostgreSQL: 5432 | ✓ |
| Port 3000 for frontend | Frontend: 3000, Backend: 8080, PostgreSQL: 5432 | |

**User's choice:** Default ports

### PostgreSQL initialization

| Option | Description | Selected |
|--------|-------------|----------|
| Named volume + seed script | Docker named volume with optional /scripts seed | ✓ |
| Bind mount local | ./data/pg bind mount, more visible but permission issues | |

**User's choice:** Named volume + seed script

---

## OpenCode's Discretion

- Exact Spring Boot project structure (config classes, base entity patterns)
- Vite configuration details (plugins, build options)
- Dockerfile specifics (base images, layer caching)
- .gitignore contents
- Exact Tailwind config syntax
- ESM/CJS module format for scripts
- Linting/formatting config (ESLint, Prettier)
- Test framework selection (JUnit for backend, Vitest for frontend)

## Deferred Ideas

- Evolution API container — Phase 7 (WhatsApp Intelligence)
- Spring Security + JWT — Phase 3 (Authentication & Onboarding)
- TanStack Query integration — Phase 2+ (Frontend Migration)
- Full entity model — each entity in its respective phase
- Production Dockerfiles (multi-stage builds) — Phase 10 (CI/CD & Deployment)
- Payment gateway (Stripe vs Pagar.me) — Phase 8 (Billing)