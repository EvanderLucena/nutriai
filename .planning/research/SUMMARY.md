# Project Research Summary

**Project:** NutriAI
**Domain:** Clinical nutrition SaaS for solo nutritionists (Brazilian market)
**Researched:** 2026-04-19
**Confidence:** HIGH

## Executive Summary

NutriAI is a clinical nutrition SaaS targeting solo nutricionistas in Brazil — a market led by Dietbox (12+ years, ~R$92/month) with no competitor offering AI-driven WhatsApp conversations with patients. The product's core differentiator is a WhatsApp AI loop: patients chat naturally about meals, AI extracts structured nutritional data, and the nutritionist sees summarized adherence insights. Experts build this type of clinical SaaS with a monolithic Spring Boot backend, React SPA frontend, PostgreSQL for relational data, and self-hosted Evolution API for WhatsApp gateway — exactly the stack recommended by all four research streams.

The recommended approach is an incremental migration from the existing single-file React CDN prototype to a Vite+TypeScript+Tailwind frontend paired with a Spring Boot 3.5 backend, connected via REST+JWT — preserving 100% of the existing UI during migration while adding real API integration layer by layer. The WhatsApp AI integration is the hardest technical risk (webhook reliability, AI context isolation, message type handling) and must be architected for per-nutricionista Evolution API instances from day one, even if initially running a single shared instance. LGPD compliance for health data is non-negotiable and must be baked into schema design from Phase 2 onward.

Key risks include: (1) the migration from a global-scope prototype to modular ES imports — a half-converted hybrid is worse than either pure approach; (2) data isolation gaps where one nutritionist could see another's patient data if nutritionist_id filtering is missing on even a single query; (3) the payment gateway choice — Stripe research recommends it for superior subscription APIs, but PITFALLS research flags that PIX-first Brazilian users may struggle, and this conflict needs an explicit decision before Phase 5.

## Key Findings

### Recommended Stack

The stack is well-defined with HIGH confidence across frontend, backend, and infrastructure layers. The only notable conflict is between STACK.md (recommends Stripe for subscriptions) and PITFALLS.md (recommends Pagar.me for Brazilian market fit). Both are well-argued; this needs an explicit product decision before payment implementation.

**Core technologies:**

| Layer | Technology | Purpose | Why |
|-------|-----------|---------|-----|
| Frontend | React 19 + TypeScript 5.7 | UI framework + type safety | Already prototyped; essential for production; TS eliminates prototype's zero-type debt |
| Frontend | Vite 6 + Tailwind 4 | Build + styling | Fast HMR, CSS-first config, matches prototype's custom theme tokens |
| Frontend | TanStack Query 5 | Server state / data fetching | Replaces manual useEffect+useState; critical for patient/plan API data |
| Frontend | React Hook Form + Zod | Forms + validation | Complex clinical forms need validation; Zod gives runtime + TS types |
| Frontend | React Router 7 | Client routing | Replaces prototype's state-based `view` switching |
| Backend | Java 21 + Spring Boot 3.5 | Application framework | LTS to 2031+, virtual threads, current stable Spring Boot |
| Backend | Spring Data JPA + Flyway | Data access + migrations | Repository pattern; versioned SQL migrations from day one |
| Backend | Spring Security + jjwt | Auth | JWT stateless auth; per-nutricionista isolation via filter chain |
| Backend | SpringDoc OpenAPI | API docs | Swagger UI for API contract visibility |
| Database | PostgreSQL 17 | Primary datastore | JSONB for semi-structured data; full-text search for food catalog |
| WhatsApp | Evolution API 2.3 (Docker) | WhatsApp gateway | Self-hosted, open-source, REST API, per-instance isolation |
| Payments | Stripe OR Pagar.me | Subscription billing | ⚠️ CONFLICT — needs decision (see below) |
| DevOps | Docker Compose + Nginx + GitHub Actions | Deployment | Single VPS, 4 containers, SSL via Certbot |

**⚠️ Payment gateway conflict:** STACK.md recommends Stripe (superior Java SDK, better subscription API, Pix at 1.19%). PITFALLS.md recommends Pagar.me (Brazilian-native, PIX+boleto+parcelamento, pt-BR support). **Recommendation: Use Stripe for MVP** — its subscription lifecycle management and Java SDK will save solo-dev time. Add Pagar.me later if Brazilian payment method coverage becomes a blocker. The architecture already uses webhook processing for both Evolution API and Stripe, so adding Pagar.me as a secondary gateway is feasible.

### Expected Features

Full feature breakdown in [FEATURES.md](FEATURES.md).

**Must have (P0 — no launch without these):**
- Email/password auth with JWT sessions — baseline SaaS entry
- Patient CRUD with list/detail/views and status filtering — core clinical workflow
- Meal plan editor with food catalog and macro calculation — primary product function
- Biometric assessment recording with timeline charts — clinical necessity
- Dashboard KPIs (active patients, adherence, trends) — practitioner's home screen
- WhatsApp connection via Evolution API — core differentiator, must work reliably
- AI conversation with meal extraction — the unique value proposition
- Meal timeline (AI + manual entries) — proves the WhatsApp loop works
- LGPD consent flows — legal requirement for health data in Brazil
- Stripe/Pagar.me subscription billing with 3 tiers — revenue

**Should have (P1 — important for retention):**
- Password reset flow — users expect this from day one for a paid product
- Plan duplication/copy — nutritionists copy plans across patients constantly
- AI clinical summaries for nutritionist — reduces reading every message
- AI conversation review panel — builds trust, allows clinical intervention
- Patient status auto-inference from adherence — AI value add
- Adherence-to-biometry correlation — unique data only NutriAI has
- Template meal plans library — saves time for common objectives

**Defer (v2+):**
- PDF export of meal plans
- Global notifications (email/push)
- Admin panel for platform
- Photo-based biometry (very complex)
- Patient mobile app (WhatsApp replaces this)
- PWA offline mode
- CRN validation API integration
- Shopping list generation

### Architecture Approach

The system uses a monorepo with four deployable containers (Nginx/SPA, Spring Boot, PostgreSQL, Evolution API) orchestrated by Docker Compose on a single VPS. The backend is the single authority — the frontend never calls Evolution API or Stripe directly. Data isolation uses application-level `nutritionist_id` column filtering on every tenant-owned entity, not schema-per-tenant or PostgreSQL RLS (too complex for solo practitioner scale). The frontend uses React Query for server state, React Context for auth, and component-local useState for UI state — no Redux or global store needed at this scale.

**Major components:**
1. **Frontend SPA** — React 19 + TypeScript + Vite + Tailwind, client-side routing via React Router 7, builds to static files served by Nginx
2. **Spring Boot API** — Feature-based packages (auth, patient, plan, food, biometry, whatsapp, subscription, insight), JWT filter chain, per-nutricionista query scoping
3. **PostgreSQL Database** — Single instance, UUID primary keys, JSONB for semi-structured data (food portions, meal items), Flyway migrations, `deleted_at` for soft delete
4. **Evolution API (WhatsApp Gateway)** — Per-nutricionista instances, webhook-based message routing, backend proxies all Evolution API calls
5. **AI Provider Integration** — Backend builds context (patient plan + recent meals + nutritionist guidelines), calls LLM for structured extraction, persists meal logs

### Critical Pitfalls

Full 31-pitfall catalog in [PITFALLS.md](PITFALLS.md). Top 5:

1. **Big Bang Rewrite** — Do NOT rewrite from scratch. Migrate the 14 JSX files incrementally: make them buildable with Vite first, then add TypeScript, then connect the API. Preserve 100% of existing UI before changing behavior. Phase 1 must produce a working build, not a blank project.

2. **Missing `nutritionist_id` on tenant data** — Every query on patient, plan, meal, biometry, and conversation tables MUST include `WHERE nutritionist_id = ?`. Missing this on even one endpoint means nutritionist A sees nutritionist B's patient data — a critical LGPD and trust violation. Add it in schema design, not retroactively.

3. **WhatsApp webhook idempotency** — Evolution API delivers webhooks fire-and-forget. Without message ID deduplication, the same patient message triggers duplicate AI responses and duplicate meal log entries. Design the webhook handler as thin (return 200 immediately, process async) from day one.

4. **CSS theme token loss during Tailwind migration** — The prototype has a well-designed system with `--ink`, `--lime`, `--coral` etc. for light/dark modes. Map ALL custom properties to Tailwind config BEFORE migrating components. Dark mode must work identically in the new codebase.

5. **Health data without LGPD safeguards** — Patient weight, body fat, dietary restrictions, and eating behavior are "dados pessoais sensíveis" under LGPD Art. 5/II and Art. 11. Encrypt at rest (pgcrypto or column-level), collect specific consent per processing purpose, implement soft delete and data export, and never ship realistic mock patient data in source code.

## Implications for Roadmap

Based on the combined research, the following phase structure is recommended. The ordering is driven by dependency chains (auth before CRUD, patients before plans, plans before WhatsApp AI) and by pitfall avoidance (schema design before data migration, webhook patterns before AI integration).

### Phase 1: Foundation & Migration

**Rationale:** Everything depends on project structure and auth. The prototype's 14 JSX files must become a buildable Vite+TS project with proper ES modules before any feature work begins. This is the highest-risk phase for migration pitfalls.

**Delivers:** Working monorepo with Docker Compose, frontend build pipeline, backend skeleton with Flyway + Spring Security + JWT auth, PostgreSQL with initial migrations, all prototype UI preserved in new build, error boundaries.

**Addresses:** Auth (P0), migration pitfalls #1-7, #22-24, #26, #31

**Key stack:** Vite 6, React 19, TypeScript 5.7, Tailwind 4, Spring Boot 3.5, PostgreSQL 17, Docker Compose, Nginx, Flyway

**Avoids pitfalls:** Big Bang Rewrite (migrate incrementally), Window globals (#2), CSS token loss (#4), Babel/Vite errors (#5), external fonts (#7), Docker health checks (#22), secrets (#23), no error boundaries (#26), bundle size (#31)

### Phase 2: Core Domain — Patients, Plans, Biometry

**Rationale:** The clinical core (patients, food catalog, meal plans, biometry) is the foundation everything else builds on. WhatsApp AI context needs meal plan data. Dashboard KPIs need patient data. No feature works without CRUD.

**Delivers:** Nutritionist profile CRUD, Patient CRUD with list/detail/status, Food catalog with search and categories, Meal plan editor with macro calculations, Biometric recording with timeline, Dashboard KPIs, CRN validation on signup, tenant isolation on every query, API contracts (OpenAPI), monetary values in centavos.

**Addresses features:** Patient CRUD (P0), Meal plan editor (P0), Biometry (P0), Dashboard KPIs (P0), Food catalog (P0), CRN validation (P1)

**Uses:** Spring Data JPA, Flyway (V2-V5 migrations), TanStack Query (frontend data layer), React Hook Form + Zod (form validation)

**Implements:** Backend packages: nutritionist, patient, plan, food, biometry, insight

**Avoids pitfalls:** Tenant isolation (#9), N+1 queries (#10), CRN validation (#11), API design (#25), float monetary values (#18), health data encryption (#19), consent records (#20), monolithic patient API (#27), concurrent updates (#28), food search indexing (#30)

### Phase 3: WhatsApp Intelligence

**Rationale:** This is NutriAI's core differentiator and the most technically complex phase. It depends on patient data (Phase 2) for AI context. Must be architected correctly from the start — webhook idempotency, per-nutricionista instance routing, async processing.

**Delivers:** Evolution API instance creation and QR pairing, webhook receiver with deduplication, AI service with context building (patient plan + recent meals + nutritionist guidelines), meal log extraction from WhatsApp messages, AI response delivery back to patient, timeline frontend showing WhatsApp-collected data, media message handling (images acknowledged even if not analyzed), connection status monitoring.

**Addresses features:** WhatsApp connection (P0), AI conversation (P0), Meal timeline (P0), AI summaries (P1), Conversation review panel (P1)

**Uses:** Evolution API (Docker), Spring Boot @Async, AI Provider API (OpenAI or equivalent), Axios for Evolution API client

**Implements:** Backend packages: whatsapp, conversation

**Avoids pitfalls:** Shared instance architecture (#12), webhook idempotency (#13), disconnection monitoring (#14), media messages dropped (#15), blocking message processing (#29)

### Phase 4: Billing & Subscriptions

**Rationale:** Revenue requires working billing. This must come after the core product is functional — there's nothing to sell if patients, plans, and WhatsApp don't work. The 30-day trial means users get value before hitting the paywall.

**Delivers:** Stripe setup (products, prices, checkout session), subscription lifecycle (trial → active → past due → canceled → expired), webhook handler for Stripe events, plan enforcement (patient limits per tier), subscription UI (plan selection, status, upgrade/downgrade), dunning flow (grace period, retry, notification), PIX and credit card support.

**Addresses features:** Billing (P0), Patient limit enforcement (P0), Usage-based upgrade nudges (P1)

**Uses:** Stripe Java SDK, Spring Boot webhook handler, Stripe Checkout (hosted)

**Implements:** Backend packages: subscription (StripeService, StripeWebhookController)

**Avoids pitfalls:** Wrong payment gateway (#16 — use Stripe per STACK recommendation), dunning flow (#17), monetary values (#18 already addressed in Phase 2)

### Phase 5: LGPD Compliance & Polish

**Rationale:** Legal requirements for health data processing in Brazil must be in place before real patients use the product. Consent management and data subject rights are not optional for a health SaaS.

**Delivers:** Privacy policy and terms of use (legally reviewed), LGPD consent collection (separate consents for terms, health data, WhatsApp AI processing), consent versioning and withdrawal, data export (LGPD Art. 18 V), soft delete and anonymization, WhatsApp data auto-expiry, landing page (migrated from prototype), onboarding flow (connected to real signup + WhatsApp setup), CI/CD pipeline (GitHub Actions → VPS).

**Addresses features:** LGPD consent (P0), Data deletion/anonymization (P0), Data portability (P0), Password reset (P1), Template meal plans (P1)

**Avoids pitfalls:** Unencrypted health data (#19 — addressed in schema), invalid consent (#20), no deletion strategy (#21)

### Phase Ordering Rationale

- **Phase 1 must come first** because the migration from CDN React to Vite+TS is the single highest-risk technical task. All other phases depend on having a buildable project.
- **Phase 2 before Phase 3** because WhatsApp AI needs patient data, meal plans, and food catalog to build meaningful context. AI responses without plan data are generic chatbot outputs.
- **Phase 3 before Phase 4** because billing a broken product has no point. The 30-day trial window gives phase 3 time to solidify.
- **Phase 5 last** because LGPD consent flows can be added to existing auth/signup screens, but the data model and isolation must be correct first (built into phases 2-3).

### Research Flags

Phases likely needing deeper research during planning:

- **Phase 3 (WhatsApp Intelligence):** Complex integration — Evolution API documentation varies in quality, AI prompt engineering for Portuguese nutrition context has no established patterns, message deduplication and async processing patterns need careful design. Allocate `/gsd-research-phase` here.
- **Phase 4 (Billing):** The Stripe vs Pagar.me decision is unresolved. Stripe PIX support details, Brazilian tax invoice requirements (Nota Fiscal), and the dunning flow specifics need research. Allocate `/gsd-research-phase` here.
- **Phase 5 (LGPD):** Legal text for terms and privacy policy, Health Data Impact Report (RIPD) requirements, and exact consent specification need legal review beyond what code research provides.

Phases with standard patterns (skip detailed research):

- **Phase 1 (Foundation):** Vite+TS migration, Docker Compose, Spring Boot skeleton, JWT auth — all well-documented, standard patterns.
- **Phase 2 (Core Domain):** CRUD with Spring Data JPA, food catalog search, meal plan editor — standard SaaS patterns, extensive documentation.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All technologies verified as current stable (April 2026). Official docs and multiple sources confirm compatibility. Only conflict is Stripe vs Pagar.me. |
| Features | HIGH | Based on direct competitor analysis (Dietbox verified), prototype codebase analysis, and PROJECT.md requirements. P0/P1/P2 prioritization is clear. |
| Architecture | HIGH | Spring Boot + React + PostgreSQL patterns are mature and well-documented. Evolution API integration pattern is clear from their GitHub docs. MEDIUM confidence on Evolution API specifics (webhook reliability, scaling behavior). |
| Pitfalls | HIGH | 31 pitfalls identified from codebase analysis, architecture review, and domain knowledge. Prevention strategies are specific and actionable. Some (WhatsApp disconnection, AI context isolation) can only be fully validated during implementation. |

**Overall confidence:** HIGH

### Gaps to Address

- **Payment gateway decision:** STACK.md recommends Stripe (better Java SDK, superior subscription API), PITFALLS.md recommends Pagar.me (Brazilian-native, PIX+boleto). Decision needed before Phase 4 planning. Research should evaluate: Stripe's current PIX support completeness, Pagar.me's Java integration maturity, and whether solo-developer DX outweighs Brazilian payment preferences.
- **AI provider selection:** No specific LLM provider is chosen. GPT-4o, Claude, or a local model each have different cost, latency, and Portuguese language quality tradeoffs. This affects Phase 3 cost model and response latency.
- **Evolution API scaling limits:** Research covers single-instance architecture. The exact scaling limits (concurrent connections per instance, messages per minute) need validation during Phase 3.
- **LGPD legal text:** Privacy policy and terms of use need legal review by a Brazilian lawyer specializing in LGPD. Code research cannot produce legally binding documents.
- **Nota Fiscal requirements:** Brazilian SaaS may need to issue electronic invoices (NFS-e) for subscription payments. This varies by municipality and wasn't covered in research.

## Sources

### Primary (HIGH confidence)
- Spring Boot 3.5.x official docs — framework patterns, security configuration
- PostgreSQL 17 docs — JSONB, full-text search, pg_trgm
- Evolution API GitHub (7.9k stars) — WhatsApp integration patterns, webhook payloads
- React Router 7 docs — data router pattern
- TanStack Query 5 docs — server state management
- Stripe Brazil pricing page — Pix (1.19%), credit card (3.99% + R$0.39) fees verified
- NutriAI prototype codebase analysis — direct source for migration pitfalls and UI preservation

### Secondary (MEDIUM confidence)
- Dietbox.com.br — competitor feature analysis, pricing verification
- Pagar.me docs — subscription API capabilities
- Spring Security 6.4 docs — JWT filter chain patterns
- Flyway docs — migration patterns
- Baileys (WhatsApp Web protocol) — understanding Evolution API internals

### Tertiary (LOW confidence, needs validation)
- Evolution API scaling behavior under 20+ concurrent instances — single source, needs load testing
- AI prompt engineering for Portuguese nutrition contexts — no established patterns, needs experimentation
- LGPD enforcement specifics for health SaaS — legal interpretation, needs lawyer review
- Mercado Pago subscription API maturity — competitor analysis, not primary source

---
*Research completed: 2026-04-19*
*Ready for roadmap: yes*