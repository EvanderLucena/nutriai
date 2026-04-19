# Roadmap: NutriAI

## Overview

Migrate a functional single-file prototype to a production SaaS for solo nutricionistas in Brazil — preserving 90% of the existing UI while building a real backend (Java 21 + Spring Boot + PostgreSQL), adding WhatsApp AI as the core differentiator, and enabling self-service billing with LGPD compliance. The journey goes from monorepo scaffolding through core clinical features to AI-powered WhatsApp conversations, then wraps with billing, legal compliance, and automated deployment.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Monorepo & Infrastructure** - Working dev environment with all services booting together
- [ ] **Phase 2: Frontend Migration** - All prototype UI preserved in Vite+TS+Tailwind modern build
- [ ] **Phase 3: Authentication & Onboarding** - Real accounts, JWT sessions, trial activation, onboarding flow
- [ ] **Phase 4: Patient Management** - Patient CRUD with status tracking, search, and data isolation
- [ ] **Phase 5: Meal Plans & Food Catalog** - Complete meal plan editor with food catalog and macro calculation
- [ ] **Phase 6: Dashboard & Biometry** - Clinical dashboard, biometric recording, and evolution charts
- [ ] **Phase 7: WhatsApp Intelligence** - AI conversations via WhatsApp with meal extraction and timeline
- [ ] **Phase 8: Billing & Subscriptions** - Stripe checkout, subscription management, patient limit enforcement
- [ ] **Phase 9: LGPD Compliance** - Consent collection, terms/privacy pages, data export and deletion
- [ ] **Phase 10: CI/CD & Deployment** - Automated deployment pipeline to production VPS

## Phase Details

### Phase 1: Monorepo & Infrastructure
**Goal**: Development environment is reproducible and all services boot together
**Depends on**: Nothing (first phase)
**Requirements**: INFRA-01, INFRA-03, INFRA-04
**Success Criteria** (what must be TRUE):
  1. Developer can clone the repo and run `docker-compose up` to start frontend, backend, PostgreSQL, and Evolution API containers
  2. Backend boots with an accessible health endpoint and PostgreSQL connection established
  3. Frontend serves from Vite dev server with hot reload inside the Docker environment
  4. Flyway migrations run automatically on backend startup creating the initial database schema
**Plans:** 3 plans in 2 waves
Plans:
- [ ] 01-01-PLAN.md — Monorepo scaffold + Spring Boot backend skeleton
- [ ] 01-02-PLAN.md — Frontend scaffold with Tailwind theme and component library
- [ ] 01-03-PLAN.md — Docker Compose integration and verification

### Phase 2: Frontend Migration
**Goal**: All prototype UI works in a modern build pipeline without runtime Babel
**Depends on**: Phase 1
**Requirements**: INFRA-02
**Success Criteria** (what must be TRUE):
  1. All 14+ prototype screens and components compile as TypeScript modules with proper ES imports (no window globals)
  2. Light and dark themes render identically to the prototype (CSS custom properties mapped to Tailwind config)
  3. All prototype interactions work: sidebar collapse, modals, table/grid toggle, pagination, tab navigation
  4. App builds as a Vite production bundle with zero Babel standalone dependency
  5. All SVG visualizations (Ring, MacroRings, Sparkline, WeekBars, LineChart, StackBar) render correctly
**Plans**: TBD
**UI hint**: yes

### Phase 3: Authentication & Onboarding
**Goal**: Nutritionists can create real accounts and begin using the application
**Depends on**: Phase 2
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05
**Success Criteria** (what must be TRUE):
  1. Nutritionist can sign up with email and password, creating a persistent account in PostgreSQL
  2. Nutritionist can log in and stay logged in across browser sessions via JWT
  3. Nutritionist can log out from any page, invalidating the session
  4. A 30-day free trial is automatically activated on signup
  5. Nutritionist completes the 4-step onboarding flow (carteira, plano, convite, pronto) after first signup
**Plans**: TBD
**UI hint**: yes

### Phase 4: Patient Management
**Goal**: Nutritionists can manage their patient roster with complete data isolation
**Depends on**: Phase 3
**Requirements**: PAT-01, PAT-02, PAT-03, PAT-04
**Success Criteria** (what must be TRUE):
  1. Nutritionist can create, edit, and deactivate patients with all demographic and clinical fields
  2. Patient list displays status tracking (on-track, attention, critical) with search and filter by status and objective
  3. Each nutritionist sees only their own patients — no cross-data leakage between accounts
  4. Patient detail view loads with all 5 tabs (Hoje, Plano, Biometria, Insights, Histórico) showing real data
**Plans**: TBD
**UI hint**: yes

### Phase 5: Meal Plans & Food Catalog
**Goal**: Nutritionists can create complete meal plans using the food catalog
**Depends on**: Phase 4
**Requirements**: PLAN-01, PLAN-02, PLAN-03, PLAN-04, PLAN-05
**Success Criteria** (what must be TRUE):
  1. Nutritionist can create and edit meal plans with meals, options, and individual foods using inline editing
  2. Food catalog provides base items (per 100g) and preset items (portioned) with search and pagination
  3. Macronutrients (kcal, protein, carbs, fat) are calculated automatically as foods are added to a plan
  4. Multiple food options can be added per meal slot and nutritionist can switch between them
  5. Extras and out-of-plan foods can be authorized and tracked within the meal plan
**Plans**: TBD
**UI hint**: yes

### Phase 6: Dashboard & Biometry
**Goal**: Nutritionists can track patient biometrics and see clinical insights on the dashboard
**Depends on**: Phase 4
**Requirements**: BIO-01, BIO-02, BIO-03
**Success Criteria** (what must be TRUE):
  1. Nutritionist can record biometric assessments (bioimpedance, skinfolds, perimetry) with date-stamped entries per patient
  2. Dashboard home shows KPIs (active patients, adherence indicators, trends) and a patient grid with real data
  3. Biometric evolution charts display weight and body fat percentage over time using real assessment data
  4. All SVG visualizations render with real biometric data (not mock data)
**Plans**: TBD
**UI hint**: yes

### Phase 7: WhatsApp Intelligence
**Goal**: Patients can interact with the AI via WhatsApp and nutritionists see extracted meal data
**Depends on**: Phase 5
**Requirements**: WA-01, WA-02, WA-03, WA-04, WA-05
**Success Criteria** (what must be TRUE):
  1. Nutritionist can generate a unique WhatsApp activation link per patient
  2. Patient sends messages via WhatsApp and receives AI responses based on their meal plan context
  3. AI extracts meal data from patient messages (text, audio, photo acknowledgments) and registers them in the patient's timeline
  4. Nutritionist sees WhatsApp-captured meal data in the patient's timeline view
  5. Shared WhatsApp number architecture works (1 number serving multiple nutritionists' patients without cross-talk)
**Plans**: TBD
**UI hint**: yes

### Phase 8: Billing & Subscriptions
**Goal**: Nutritionists can subscribe, pay, and have plan limits enforced
**Depends on**: Phase 3, Phase 4
**Requirements**: BILL-01, BILL-02, BILL-03, PAT-05
**Success Criteria** (what must be TRUE):
  1. Nutritionist can complete checkout via Stripe with PIX and credit card payment options
  2. Nutritionist can manage their subscription — upgrade, downgrade, or cancel — from within the app
  3. Patient creation is enforced based on subscription tier (15 for Iniciante, 30 for Profissional, unlimited for Ilimitado)
  4. Trial expiration triggers subscription prompt blocking access to paid features
**Plans**: TBD
**UI hint**: yes

### Phase 9: LGPD Compliance
**Goal**: Application complies with Brazilian data protection requirements for health data
**Depends on**: Phase 3, Phase 7
**Requirements**: LGPD-01, LGPD-02, LGPD-03
**Success Criteria** (what must be TRUE):
  1. Explicit consent is collected at signup (terms acceptance) and patient registration (health data processing consent)
  2. Terms of service and privacy policy pages are publicly accessible and linkable
  3. Nutritionist can export all their data and request full account deletion
**Plans**: TBD
**UI hint**: yes

### Phase 10: CI/CD & Deployment
**Goal**: Application deploys automatically to production VPS on push
**Depends on**: Phase 9
**Requirements**: INFRA-05
**Success Criteria** (what must be TRUE):
  1. Push to main branch triggers an automated GitHub Actions pipeline that builds and deploys both frontend and backend
  2. Frontend builds as static files served by Nginx on the VPS with SSL
  3. Backend deploys as a Docker container with health checks and automatic restarts
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10

Note: Phase 6 depends on Phase 4 (not Phase 5) and can begin in parallel with Phase 5.
Phase 8 depends on Phase 3 and Phase 4 and can begin once both are complete.
Phase 9 depends on Phase 3 and Phase 7 and can begin once both are complete.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Monorepo & Infrastructure | 3/3 | Complete ✓ | 2026-04-19 |
| 2. Frontend Migration | 0/? | Not started | - |
| 3. Authentication & Onboarding | 0/? | Not started | - |
| 4. Patient Management | 0/? | Not started | - |
| 5. Meal Plans & Food Catalog | 0/? | Not started | - |
| 6. Dashboard & Biometry | 0/? | Not started | - |
| 7. WhatsApp Intelligence | 0/? | Not started | - |
| 8. Billing & Subscriptions | 0/? | Not started | - |
| 9. LGPD Compliance | 0/? | Not started | - |
| 10. CI/CD & Deployment | 0/? | Not started | - |