# Stack Research: NutriAI

**Research Date:** 2026-04-19
**Confidence:** HIGH (backend/infra), MEDIUM (payment gateway specifics)

## Frontend Stack

> The frontend stack is largely decided (React + TypeScript + Vite + Tailwind). This section covers migration considerations and supporting libraries needed for the production version.

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| React | 19.x | UI framework | Already decided; React 19 adds server components and actions (not needed here), but 19 is current and stable | HIGH |
| TypeScript | 5.7+ | Type safety | Non-negotiable for production code; the prototype has zero types, migration will be painful but essential | HIGH |
| Vite | 6.x | Build tool / dev server | Fast HMR, native ESM, excellent React + TS support; the de facto standard replacing CRA | HIGH |
| Tailwind CSS | 4.x | Styling | Already decided; Tailwind 4 uses CSS-first config (no more `tailwind.config.js`), Oxide engine for faster builds | HIGH |
| React Router | 7.x | Client-side routing | Replaces the manual `view` state management in the prototype; `createBrowserRouter` + `RouterProvider` is the data-router pattern. RR7 is the current stable version (formerly Remix). Use in SPA mode (no SSR needed). | HIGH |
| Zustand | 5.x | State management | Replaces prop drilling; tiny bundle (~1KB), simple API, persist middleware for auth state; far simpler than Redux for this app's needs | HIGH |
| TanStack Query | 5.x | Server state / data fetching | Manages API calls, caching, background refetch, optimistic updates; eliminates manual `useEffect` + `useState` for server data; critical for patient/food/plan data | HIGH |
| React Hook Form + Zod | 7.x + 3.x | Form handling + validation | The prototype has inline form handling with `!name.trim()` checks; RHF handles complex forms (patient edit, food catalog, meal plans) cleanly; Zod provides runtime type validation + TS inference | HIGH |
| Axios | 1.x | HTTP client | Interceptors for JWT token refresh, request/response transformers, error handling; better DX than `fetch` for API-heavy apps | HIGH |
| Radix UI Primitives | latest | Accessible component primitives | For dropdown menus, modals, tooltips, and dialogs. The prototype uses `createPortal` with no a11y; Radix solves focus traps, keyboard nav, and ARIA | MEDIUM |
| Vitest + Testing Library | latest | Unit/integration testing | Zero tests in prototype; Vitest is native ESM, Vite-native; Testing Library is the React standard | HIGH |

### Frontend: What NOT to Use

| Technology | Why Avoid |
|------------|-----------|
| Redux / Redux Toolkit | Over-engineered for solo-dev SaaS; Zustand is simpler and sufficient |
| Material UI / Chakra UI | Full component libraries fight with the existing custom design system; use Radix primitives + Tailwind instead |
| SWR | TanStack Query has richer features (mutations, infinite queries, offline); stick to one data-fetching solution |
| React Query v4 | Use TanStack Query v5 (renamed); v4 is EOL |
| CSS Modules | The prototype has 1726 lines of `styles.css`; migrating to Tailwind is the plan, not creating CSS Modules |
| Emotion / styled-components | Runtime CSS-in-JS has performance overhead; Tailwind is the chosen direction |

---

## Backend Stack

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Java | 21 LTS | Runtime | Already decided; Java 21 is the current LTS with virtual threads, sealed classes, pattern matching; long-term support to 2031+ | HIGH |
| Spring Boot | 3.5.x | Application framework | Already decided; Spring Boot 3.5 is current stable (as of April 2026). Requires Java 17+, works with Java 21. Spring Boot 4.0 is in milestone but not production-ready. | HIGH |
| Spring Web | 6.2.x | REST API | Included via `spring-boot-starter-web`; embedded Tomcat, Jackson JSON serialization | HIGH |
| Spring Security | 6.4.x | Authentication & authorization | JWT-based auth, endpoint protection, CORS, CSRF configuration; standard for Spring Boot production apps | HIGH |
| Spring Data JPA | 3.5.x | Data access layer | Repository abstraction, pagination, derived queries; eliminates boilerplate DAO code | HIGH |
| Hibernate | 6.6.x | ORM | Included transitively via Spring Data JPA; maps entities to PostgreSQL tables | HIGH |
| Flyway | 10.x | Database migrations | Versioned SQL migrations (V1__Description.sql pattern); Spring Boot auto-configuration; superior to Liquibase for pure SQL projects — simpler, less XML | HIGH |
| Spring Validation | 6.2.x | Request validation | `@Valid`, `@NotNull`, `@Size`, `@Pattern` annotations on DTOs; integrates with Spring Web controller method validation | HIGH |
| SpringDoc OpenAPI | 2.8.x | API documentation | Generates Swagger UI from Spring controllers; replaces springfox (dead); auto-configures with Spring Boot 3.x; `/swagger-ui.html` endpoint | MEDIUM |
| jjwt (io.jsonwebtoken) | 0.12.x | JWT token creation/validation | Industry standard for Java JWT; supports HS256/RS256, claims, expiration; pairs with Spring Security filter chain | HIGH |
| Spring Boot Actuator | 3.5.x | Health checks & metrics | Production monitoring, `/health` endpoint, Prometheus metrics; essential for VPS deployment | HIGH |
| Lombok | latest | Boilerplate reduction | `@Data`, `@Builder`, `@Slf4j` annotations; reduces entity/DTO verbosity; standard in Java/Spring projects | MEDIUM |

### Backend: What NOT to Use

| Technology | Why Avoid |
|------------|-----------|
| Spring Boot 4.0 | In milestone/preview; not production-ready. Stick to 3.5.x stable |
| Liquibase | Overkill for this project; Flyway's plain SQL migrations are simpler and more debuggable. Liquibase's XML/YAML format is harder to review in PRs |
| MyBatis | JPA/Hibernate is more productive for CRUD-heavy apps; MyBatis adds SQL mapping XML complexity without benefit here |
| Spring WebFlux (Reactive) | The app is CRUD + WebSocket webhooks, not a high-concurrency streaming pipeline. WebFlux adds complexity without benefit at 10-20 nutritionist scale |
| MapStruct | For a solo-dev project, manual mappers or Lombok `@Builder` patterns are simpler. MapStruct adds annotation processing complexity for marginal benefit |
| kotlinx.serialization | Not relevant; this is Java, not Kotlin |

---

## Database

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| PostgreSQL | 17.x | Primary database | Already decided; best OSS relational DB for this use case; excellent JSON support (for WhatsApp message logs), robust indexing, full-text search for food catalog | HIGH |
| pgvector extension | 0.7.x | Vector similarity search (future) | Optional; could enable AI-powered food search similarity later; installs as PostgreSQL extension | LOW (future) |
| HikariCP | 6.x | Connection pooling | Default pool in Spring Boot; production-grade, battle-tested; configure max pool size, connection timeout, idle timeout | HIGH |

### Database Schema Considerations

**Core entities (initial schema):**
- `nutritionist` — login credentials, plan tier,WhatsApp number
- `patient` — belongs to nutritionist; biometric data, status
- `meal_plan` — belongs to patient; date range,meal slots
- `meal` — belongs to meal_plan; time of day, description
- `food_item` — per-100g base data + portioned presets
- `plan_food` — junction table connecting food to meals with quantities
- `biometric_record` — weight, BMI, body fat %, per-visit timeline
- `whatsapp_conversation` — message logs between patient and AI
- `subscription` — plan tier, status, Stripe/pagarme reference, trial dates

**Key design decisions:**
- All tables have `tenant_id = nutritionist_id` for row-level isolation (not multi-tenant at DB level — each nutritionist sees only their data via application-layer filtering)
- `uuid` primary keys (not auto-increment integers) for security and distributed compatibility
- `created_at`, `updated_at` timestamps on all entities via Hibernate `@PrePersist`/`@PreUpdate`
- Soft delete (`deleted_at`) on patient records (LGPD compliance — data retention policy)
- JSONB column on `whatsapp_conversation` for flexible message metadata

**Backup strategy:**
- `pg_dump` daily cron to `/backups` volume
- WAL archiving for point-in-time recovery
- Restore testing monthly

---

## WhatsApp Integration

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Evolution API | 2.3.x | WhatsApp gateway (self-hosted) | Already decided; open-source, runs as Docker container; provides REST API for sending/receiving messages via Baileys (WhatsApp Web protocol) | HIGH |
| Baileys | 6.x (bundled) | WhatsApp Web protocol | Bundled inside Evolution API; no direct dependency to manage; Evolution API wraps Baileys with instance management and REST endpoints | HIGH |

### Evolution API Integration Pattern

**Architecture:** The Spring Boot backend communicates with Evolution API via REST. No direct Baileys integration in the Java code.

**Instance Management:**
- One Evolution API instance per WhatsApp number (initially: 1 shared number for all nutritionists)
- Create instance: `POST /instance/create` with `integration: "WHATSAPP-BAILEYS"`
- Connect instance: `GET /instance/connect/{instanceName}` → returns QR code for WhatsApp Web pairing
- Webhook configuration: Register backend endpoint as webhook URL on instance creation

**Message Flow (Patient → AI → Patient):**
1. Patient sends WhatsApp message
2. Evolution API webhook fires `POST` to backend `/api/webhook/whatsapp`
3. Backend routes message to patient's nutritionist context
4. AI processes message against meal plan data
5. Backend sends response via `POST /message/sendText/{instanceName}` to Evolution API
6. Evolution API delivers message to patient's WhatsApp

**Supported message types:**
- Text messages: `POST /message/sendText/{instanceName}`
- Media messages (images of meals): `POST /message/sendMedia/{instanceName}` — supports image, video, document, audio
- The AI should handle both text input ("comi um prato de frango") and image input (photos of meals)

**Webhook events to subscribe:**
- `MESSAGES_UPSERT` — new incoming messages
- `MESSAGES_UPDATE` — message status updates (delivered, read)
- `CONNECTION_UPDATE` — instance connection status changes

**Evolution API Docker setup:** Already defined in project; runs alongside PostgreSQL and backend in docker-compose.

### WhatsApp: What NOT to Use

| Technology | Why Avoid |
|------------|-----------|
| Official WhatsApp Business API | Requires Meta approval (lengthy process), costs per conversation, strict template rules for proactive messages; Evolution API with Baileys is free and more flexible for a solo SaaS |
| Twilio WhatsApp | Per-message costs add up (R$0.08+ per message); self-hosted Evolution API is free; Twilio doesn't offer advantage for Brazilian-only deployment |
| Chat-API / WA-API | Closed source, paid, uncertain longevity; Evolution API is open-source with 7.9k GitHub stars and active community |

---

## Payment Processing

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Stripe | API 2026 | Payment gateway | Best-in-class subscription billing API; Pix support in Brazil (1.19%); credit card (3.99% + R$0.39); excellent SDK for Java; webhook-based subscription lifecycle; world-class documentation | HIGH |

### Payment Gateway Comparison for Brazilian Market

| Criterion | Stripe | Pagar.me | Mercado Pago |
|-----------|--------|----------|---------------|
| **Pix fees** | 1.19% | ~2.99% | ~0.99% (promo) → 1.99% |
| **Credit card (national)** | 3.99% + R$0.39 | ~3.79% + R$0.39 | ~3.99% + R$0.39 |
| **Subscription billing API** | Best in class; native recurring, trials, proration, dunning | Has subscription API (plans + invoices); less mature | Assinaturas API exists; less flexible |
| **Webhook reliability** | Industry gold standard | Good | Adequate |
| **Java SDK** | Official `stripe-java` | No official Java SDK (REST API only) | Official SDK (Java) but less maintained |
| **Dashboard UX** | Excellent, in English | Good, in Portuguese | Good, in Portuguese |
| **Brazilian payment methods** | Pix, credit cards, boleto | Pix, credit, boleto, débito | Pix, credit, boleto, débito, Pix parcelado |
| **Onboarding speed** | Fast (business registration required) | Fast (Stone ecosystem) | Fast (Mercado Libre ecosystem) |
| **Anti-fraud** | Stripe Radar (built-in) | Built-in antifraud | Built-in antifraud |
| **Support in pt-BR** | No (English only) | Yes | Yes |
| **LGPD compliance** | Yes (global standard) | Yes (Brazilian company) | Yes (Brazilian company) |

### Recommendation: Stripe with Pix as primary

**Rationale:**
1. **Subscription billing is core to NutriAI's business model** — Stripe Billing is the most mature subscription engine available. It handles trials, upgrades/downgrades, proration, failed payment retries (Smart Retries), and customer portal natively. Pagar.me and Mercado Pago have subscription features but they're less flexible and less battle-tested.

2. **Pix is now the dominant payment method in Brazil** — Stripe supports Pix at 1.19%, competitive with Pagar.me. The patient nutritionists who are NutriAI's customers are comfortable with Pix.

3. **Developer experience matters for a solo developer** — Stripe's Java SDK, comprehensive webhooks, idempotency keys, and test mode are significantly better. When you're the only engineer, every hour debugging payment issues counts.

4. **Webhook architecture aligns with the rest of the stack** — Evolution API also uses webhooks. Having both payment and WhatsApp events flow through the same webhook → event processing pattern simplifies the architecture.

5. **pt-BR support is the main downside** — Dashboard is in English, support is English-only. For a solo Brazilian developer who reads English, this is acceptable. If the target audience required Portuguese dashboard, Pagar.me would be the fallback.

6. **Boleto support** — Stripe charges R$3.45 per boleto paid. For an R$99-199/month SaaS, credit card and Pix are the primary methods; boleto is optional/nice-to-have.

### Stripe Integration Architecture

- **Customer creation:** When nutritionist signs up → create Stripe Customer
- **Subscription flow:** Checkout Session (Stripe-hosted) or custom Stripe Elements form → Customer subscribes to plan → Webhook confirms `customer.subscription.created`
- **Trial:** 30-day free trial via Stripe's `trial_end` parameter
- **Plan changes:** Upgrade/downgrade via Stripe's subscription item update + proration
- **Cancellation:** Mark `cancel_at_period_end=true`; webhook `customer.subscription.deleted` triggers access revocation
- **Webhook signature verification:** All webhook payloads verified with Stripe's signature header before processing

### Payment: What NOT to Use

| Technology | Why Avoid |
|------------|-----------|
| Mercado Pago | Their subscription API is less mature; aggressive upselling to merchant's customers; complex SDK; vendor lock-in to Mercado Libre ecosystem |
| Pagar.me (as primary) | No official Java SDK means more boilerplate; subscription features work but are less developer-friendly than Stripe Billing. Could be a backup option in the future |
| PagSeguro | Legacy platform, outdated API, poor developer experience |
| Wirecard/Moov | Discontinued in Brazil |

---

## DevOps & Infrastructure

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Docker | 27.x | Containerization | Already decided; each service (frontend Nginx, backend, PostgreSQL, Evolution API) runs in its own container | HIGH |
| Docker Compose | 2.x | Local development orchestration | Single `docker-compose.yml` to spin up all 4 services; defines networks, volumes, and service dependencies | HIGH |
| GitHub Actions | N/A | CI/CD | Build & test on push to main; deploy to VPS on release/tag; already decided | HIGH |
| Nginx | 1.27.x | Reverse proxy + static frontend | Serves the Vite-built React SPA as static files; reverse-proxies `/api/*` to Spring Boot; terminates SSL; already decided | HIGH |
| Let's Encrypt / Certbot | latest | SSL/TLS certificates | Free, auto-renewing TLS certificates via Certbot + Nginx; required for LGPD and Stripe HTTPS requirement | HIGH |
| Hetzner Cloud / DigitalOcean | N/A | VPS hosting | Already decided; R$40-80/month VPS is sufficient for initial scale; Hetzner is cheaper per spec, DigitalOcean has better UX | HIGH |

### Docker Architecture

```
docker-compose.yml (production)
├── app (Nginx — serves React SPA + reverse proxy /api → backend:8080)
├── backend (Spring Boot JAR — port 8080)
├── postgres (PostgreSQL 17 — port 5432, volume-mounted data)
└── evolution-api (Evolution API — port 8085)
```

**Deployment flow:**
1. `git push` to `main` branch
2. GitHub Actions builds frontend (`npm run build`) and backend (`./gradlew bootJar`)
3. Docker images built and pushed to Docker Hub or GitHub Container Registry
4. SSH into VPS, `docker compose pull && docker compose up -d`
5. (Later: automated via GitHub Actions SSH deployment step)

### DevOps: What NOT to Use

| Technology | Why Avoid |
|------------|-----------|
| Kubernetes | Massive overkill for 1 VPS with 4 containers; adds 10x operational complexity |
| Terraform | For a single VPS, a simple `docker-compose.yml` + bash deploy script is sufficient; Terraform adds state management overhead |
| AWS / GCP / Azure | NutriAI doesn't need managed services at this scale; VPS + Docker is simpler and 5-10x cheaper for a solo SaaS at 10-200 users |
| Jenkins | GitHub Actions is free for public repos, easier to configure, and cloud-native |
| PM2 / Systemd | Docker manages process lifecycle; no need for additional process managers |

---

## Authentication

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Spring Security | 6.4.x | Auth framework | Already decided; standard for Spring Boot; provides filter chain, method security, CSRF/CORS config | HIGH |
| jjwt (io.jsonwebtoken) | 0.12.x | JWT library | Create and validate JWTs; supports HS256 (symmetric) for simplicity; RS256 (asymmetric) for multi-service later | HIGH |
| BCrypt | (via Spring Security) | Password hashing | `PasswordEncoder` default in Spring Security; adaptive cost factor; industry standard | HIGH |

### Authentication Architecture

**Flow:**
1. Nutritionist registers via `POST /api/auth/register` → Spring Security creates user with BCrypt-hashed password
2. Nutritionist logs in via `POST /api/auth/login` → validate credentials → return `{ accessToken, refreshToken }`
3. Frontend stores `accessToken` in Zustand (persisted to `localStorage`) and `refreshToken` in `httpOnly` cookie
4. All API requests include `Authorization: Bearer <accessToken>` header
5. On 401 response, frontend attempts refresh via `POST /api/auth/refresh` → new access token
6. On logout or expired refresh → clear tokens, redirect to login

**Token design:**
- Access token: JWT, 15-minute expiry, contains `{sub: userId, email, role}`
- Refresh token: opaque/random UUID, 30-day expiry, stored in DB with user reference
- Rotation: new refresh token issued on each refresh request (refresh token rotation prevents replay)

**Password reset (Phase 2):**
- Generate reset token → email link via SMTP (or WhatsApp message via Evolution API)
- Token expires in 1 hour
- Not in current scope but architecture should support it

### Auth: What NOT to Use

| Technology | Why Avoid |
|------------|-----------|
| OAuth2 / Social Login | Not in scope for MVP; adds Google/Facebook dependency; solo nutritionists don't need social login |
| Keycloak | Overkill for a single-tenant application; 500MB+ memory footprint on VPS; Spring Security + JWT is simpler |
| Auth0 / Supabase Auth | Adds external dependency and cost; JWT in-house is simpler for this scale |
| Session-based auth (server-side sessions) | Doesn't work well with separate frontend hosting (Vercel) + backend (VPS); JWT is stateless and works across deployment boundaries |

---

## Supporting Libraries

### Backend Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| ModelMapper / MapStruct | latest | Entity ↔ DTO mapping | Phase 2; manual mapping with Lombok `@Builder` is simpler for Phase 1 |
| Spring Boot Starter Mail | 3.5.x | Email sending (password reset, notifications) | Phase 2 (notifications); not needed initially |
| Spring Boot Starter Validation | 3.5.x | Bean validation (`@Valid`, `@NotNull`) | Immediately; included in `spring-boot-starter-web` |
| Jackson Module: Java 8 Date/Time | 2.18.x | Proper ISO-8601 date serialization | Included in Spring Boot; essential for `LocalDate`/`LocalDateTime` in JSON APIs |
| Liquibase | N/A | Database migration alternative | NOT using; Flyway is the choice |
| PostgreSQL JDBC Driver | 42.7.x | JDBC driver for PostgreSQL | Default in Spring Boot; no version override needed |
| Springfox | N/A | Swagger generation | DEPRECATED; use SpringDoc OpenAPI instead |

### Frontend Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@tanstack/react-query` | 5.x | Server state management | Immediately; replaces manual fetch + useState for all API calls |
| `zod` | 3.x | Runtime type validation | Immediately; form schemas, API response validation |
| `react-hook-form` | 7.x | Form state management | Immediately; patient forms, food catalog, meal plan editor |
| `@radix-ui/react-*` | latest | Accessible UI primitives | Immediately; dialogs, dropdowns, tooltips |
| `clsx` + `tailwind-merge` | latest | Class name utilities | Immediately; dynamic Tailwind class composition without conflicts |
| `date-fns` | 4.x | Date formatting/manipulation | Phase 2; initially use Intl.DateTimeFormat for pt-BR dates |
| `recharts` | 2.x | Chart library | Phase 2; initially preserve hand-coded SVG visualizations from prototype |
| `i18next` | latest | Internationalization | NOT needed; app is pt-BR only per requirements |

---

## Installation

### Backend (Spring Boot) — `build.gradle`

```gradle
plugins {
    id 'java'
    id 'org.springframework.boot' version '3.5.13'
    id 'io.spring.dependency-management' version '1.1.7'
}

group = 'com.nutriai'
version = '0.1.0'

java {
    sourceCompatibility = '21'
}

dependencies {
    // Core
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
    implementation 'org.springframework.boot:spring-boot-starter-security'
    implementation 'org.springframework.boot:spring-boot-starter-validation'
    implementation 'org.springframework.boot:spring-boot-starter-actuator'
    
    // Database
    runtimeOnly 'org.postgresql:postgresql'
    implementation 'org.flywaydb:flyway-core'
    implementation 'org.flywaydb:flyway-database-postgresql'
    
    // Auth
    implementation 'io.jsonwebtoken:jjwt-api:0.12.6'
    runtimeOnly 'io.jsonwebtoken:jjwt-impl:0.12.6'
    runtimeOnly 'io.jsonwebtoken:jjwt-jackson:0.12.6'
    
    // API Documentation
    implementation 'org.springdoc:springdoc-openapi-starter-webmvc-ui:2.8.0'
    
    // Payments
    implementation 'com.stripe:stripe-java:28.x.x'
    
    // Utilities
    compileOnly 'org.projectlombok:lombok'
    annotationProcessor 'org.projectlombok:lombok'
    
    // Testing
    testImplementation 'org.springframework.boot:spring-boot-starter-test'
    testImplementation 'org.springframework.security:spring-security-test'
    testImplementation 'com.h2database:h2' // In-memory DB for tests
}
```

### Frontend — `package.json` (key dependencies)

```json
{
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router": "^7.6.0",
    "@tanstack/react-query": "^5.70.0",
    "zustand": "^5.0.0",
    "axios": "^1.7.0",
    "react-hook-form": "^7.55.0",
    "@hookform/resolvers": "^3.9.0",
    "zod": "^3.24.0",
    "@radix-ui/react-dialog": "^1.1.0",
    "@radix-ui/react-dropdown-menu": "^2.1.0",
    "@radix-ui/react-tooltip": "^1.1.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^3.0.0"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "vite": "^6.2.0",
    "@vitejs/plugin-react": "^4.4.0",
    "tailwindcss": "^4.1.0",
    "@tailwindcss/vite": "^4.1.0",
    "vitest": "^3.1.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/jest-dom": "^6.6.0"
  }
}
```

---

## Sources

- Spring Boot 3.5.x: https://spring.io/projects/spring-boot (verified current LTS, April 2026)
- SpringDoc OpenAPI: https://springdoc.org/ (verified compatibility with Spring Boot 3.x)
- Evolution API v2.3: https://github.com/EvolutionAPI/evolution-api (7.9k stars, active, verified 2026-04)
- Flyway: https://flywaydb.org/ (verified Spring Boot auto-configuration support)
- Zustand 5.x: https://github.com/pmndrs/zustand (verified API, persist middleware)
- React Router 7.x: https://reactrouter.com/ (verified data router pattern with createBrowserRouter)
- Stripe Brazil pricing: https://stripe.com/br/pricing (verified 2026-04: 3.99% + R$0.39 cards, 1.19% Pix)
- Pagar.me: https://pagar.me/ (verified active, Stone subsidiary, V5 API)
- Mercado Pago: https://www.mercadopago.com.br/developers/pt/docs (verified active)
- HikariCP: Spring Boot default connection pool (verified)
- jjwt: https://github.com/jwtk/jjwt (verified 0.12.x current)
- TanStack Query 5: https://tanstack.com/query/latest (verified React Query v5)

---

*Stack research: 2026-04-19*