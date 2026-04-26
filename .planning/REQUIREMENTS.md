# Requirements: NutriAI

**Defined:** 2026-04-19
**Core Value:** O nutricionista cria o plano alimentar e acompanha seus pacientes em um painel web, enquanto a IA responde ao paciente via WhatsApp usando o plano como base.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Auth & Onboarding

- [x] **AUTH-01**: Nutricionista can sign up with email and password
- [x] **AUTH-02**: Nutricionista can log in and stay logged in across sessions (JWT)
- [x] **AUTH-03**: Nutricionista can log out from any page
- [x] **AUTH-04**: 30-day free trial activated on signup
- [x] **AUTH-05**: 4-step onboarding after signup (carteira, plano, convite, pronto)

### Patient Management

- [x] **PAT-01**: Nutricionista can create, edit, and deactivate patients
- [x] **PAT-02**: Patient list with status tracking (on-track, attention, critical)
- [x] **PAT-03**: Search and filter patients by status and objective
- [x] **PAT-04**: Data isolation — each nutritionist sees only their own patients
- [ ] **PAT-05**: Patient limit enforcement per subscription plan (15/30/unlimited)

### Meal Plans & Food

- [x] **PLAN-01**: Meal plan editor — meals, options, foods with inline editing
- [x] **PLAN-02**: Food catalog — base items (per 100g) and preset items (portioned)
- [x] **PLAN-03**: Automatic macro calculation (kcal, protein, carbs, fat)
- [x] **PLAN-04**: Multiple options per meal
- [x] **PLAN-05**: Extras/out-of-plan food authorization

### WhatsApp AI

- [ ] **WA-01**: Evolution API integration — send and receive WhatsApp messages per patient
- [ ] **WA-02**: AI responds to patient based on their meal plan (context-aware)
- [ ] **WA-03**: AI extracts meal data from text, audio, and photo → registered in timeline
- [ ] **WA-04**: Unique WhatsApp activation link per patient
- [ ] **WA-05**: Shared number architecture (1 number, multiple nutritionists)

### Biometry & Insights

- [ ] **BIO-01**: Biometric recording (bioimpedance, skinfolds, perimetry)
- [ ] **BIO-02**: Dashboard with KPIs and patient grid
- [ ] **BIO-03**: Evolution charts (weight, body fat percentage over time)

### Billing

- [ ] **BILL-01**: Checkout flow with Stripe or Pagar.me (PIX + credit card)
- [ ] **BILL-02**: Subscription management (upgrade, downgrade, cancel)
- [ ] **BILL-03**: Patient limit enforcement based on subscription tier

### LGPD

- [ ] **LGPD-01**: Explicit consent collection at signup and patient registration
- [ ] **LGPD-02**: Terms of service and privacy policy pages
- [ ] **LGPD-03**: Data export and account deletion on request

### Infrastructure

- [x] **INFRA-01**: Monorepo structure (frontend, backend, docker + root scripts)
- [x] **INFRA-02**: Frontend migration to React + TypeScript + Vite + Tailwind
- [x] **INFRA-03**: Backend: Java 21 + Spring Boot + PostgreSQL
- [x] **INFRA-04**: Docker Compose for local development (front + back + postgres + evolution-api)
- [ ] **INFRA-05**: CI/CD via GitHub Actions with automated VPS deployment

## v2 Requirements

### Admin & Platform

- **ADMIN-01**: Admin dashboard (nutritionists, WhatsApp instances, billing, logs)
- **ADMIN-02**: Nutri settings page (profile, hours, welcome message, theme)
- **ADMIN-03**: Patient reports — export structured data

### WhatsApp Enhancements

- **WA-06**: WhatsApp conversation history view for nutritionist
- **WA-07**: AI-generated weekly patient summary
- **WA-08**: Manual nutritionist intervention in AI conversation

### Notifications

- **NOTF-01**: In-app notifications
- **NOTF-02**: Email notifications for key events
- **NOTF-03**: Notification preferences

### Auth Recovery

- **AUTH-06**: Password reset via email link
- **AUTH-07**: Email verification after signup

## Out of Scope

| Feature | Reason |
|---------|--------|
| Mobile app | Web-first, mobile responsive later |
| Multi-nutricionista / clinica | Solo nutritionist only for now |
| Importar TACO | Manual catalog sufficient for launch |
| Export PDF (insights) | Not core to clinical workflow |
| Painel Admin | P1 future, not launch requirement |
| OAuth (Google) | Email/password sufficient for v1 |
| Real-time chat | WhatsApp IS the chat channel |
| Desktop app | Web-only |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 3 | Complete |
| AUTH-02 | Phase 3 | Complete |
| AUTH-03 | Phase 3 | Complete |
| AUTH-04 | Phase 3 | Complete |
| AUTH-05 | Phase 3 | Complete |
| PAT-01 | Phase 4 | Complete |
| PAT-02 | Phase 4 | Complete |
| PAT-03 | Phase 4 | Complete |
| PAT-04 | Phase 4 | Complete |
| PAT-05 | Phase 8 | Pending |
| PLAN-01 | Phase 5 | Complete |
| PLAN-02 | Phase 5 | Complete |
| PLAN-03 | Phase 5 | Complete |
| PLAN-04 | Phase 5 | Complete |
| PLAN-05 | Phase 5 | Complete |
| WA-01 | Phase 7 | Pending |
| WA-02 | Phase 7 | Pending |
| WA-03 | Phase 7 | Pending |
| WA-04 | Phase 7 | Pending |
| WA-05 | Phase 7 | Pending |
| BIO-01 | Phase 6 | Pending |
| BIO-02 | Phase 6 | Pending |
| BIO-03 | Phase 6 | Pending |
| BILL-01 | Phase 8 | Pending |
| BILL-02 | Phase 8 | Pending |
| BILL-03 | Phase 8 | Pending |
| LGPD-01 | Phase 9 | Pending |
| LGPD-02 | Phase 9 | Pending |
| LGPD-03 | Phase 9 | Pending |
| INFRA-01 | Phase 1 | Complete |
| INFRA-02 | Phase 2 | Complete |
| INFRA-03 | Phase 1 | Complete |
| INFRA-04 | Phase 1 | Complete |
| INFRA-05 | Phase 10 | Pending |

**Coverage:**
- v1 requirements: 32 total
- Mapped to phases: 32
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-19*
*Last updated: 2026-04-24 after GSD artifact sync*
