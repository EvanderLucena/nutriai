# Features Research: NutriAI

**Research Date:** 2026-04-19

## Authentication & Onboarding

### Table Stakes
- **Email/password login** — Every clinical SaaS in Brazil requires this. Users expect it as the baseline entry point. Complexity: Low.
- **Signup with professional profile** — Nutricionistas need to register their CRN (Conselho Regional de Nutrição) details. Dietbox and all competitors require professional identification. Complexity: Low.
- **Trial period (30 days)** — Standard in Brazilian SaaS. Dietbox offers 30-day free access. NutriAI's pricing already specifies this. Complexity: Low.
- **Session persistence (JWT)** — Required for any real production app. The prototype currently has cosmetic-only auth. Complexity: Medium.
- **Password reset/recovery** — Marked as P2 in PROJECT.md but users will expect this from day one for a paid product. Without it, support burden is high. Complexity: Medium.
- **Onboarding wizard (4 steps)** — Already exists in prototype (carteira, plano, convite, pronto). Must be preserved in migration. Complexity: Medium (already designed).

### Differentiators
- **Self-service onboarding without sales team** — Dietbox requires manual plan selection via support. NutriAI's self-service trial + card checkout is a differentiator for solo nutricionistas who want immediate access. Complexity: Medium (checkout flow).
- **WhatsApp-first onboarding** — Let new users authenticate or verify via WhatsApp number (common in Brazil). Not currently designed but aligns with the product's WhatsApp-centric strategy. Complexity: Medium.

### Anti-features
- **Social login only (Google OAuth)** — Prototype has a Google button but forcing social login excludes users who prefer email. Must offer both, never force one. Complexity: N/A.
- **Multi-role auth (receptionist, staff)** — Dietbox has this. PROJECT.md explicitly scopes this out: solo nutricionistas only. No multi-user accounts. Complexity: High (avoided).
- **SSO/SAML** — Enterprise auth. Completely unnecessary for solo practitioners. Complexity: Very High (avoided).
- **Student plans** — Dietbox has a free student tier. This is a marketing/GTM play, not a core product feature. Defer until product-market fit. Complexity: Medium (deferred).

---

## Patient Management

### Table Stakes
- **Patient CRUD (create, read, update, archive)** — Core of any clinical tool. Nutricionista must register, edit, and manage patient records. Already in prototype. Complexity: Medium.
- **Patient list with filters (status, search)** — Prototype has this (status filter, search, table/grid toggle, pagination). Must preserve. Complexity: Medium.
- **Patient detail view (5 tabs)** — Today, Plan, Biometry, Insights, History. Already in prototype. Must preserve and connect to real data. Complexity: High (5 connected views).
- **Patient status tracking** — On-track/Warning/Danger status with color coding. Already in prototype. Must map to real clinical data. Complexity: Low.
- **Patient demographics** — Name, age, sex, height, weight, objective, WhatsApp number. Already in prototype data model. Complexity: Low.
- **Patient archive (soft delete)** — Never hard-delete clinical data. Must archive. Complexity: Low.

### Differentiators
- **AI-powered patient status** — Instead of manually setting status, AI infers it from adherence, biometric trends, and WhatsApp conversation sentiment. No competitor does this well. Complexity: High.
- **Patient timeline (meals + biometry + AI notes)** — Prototype has this. Merging WhatsApp meal data into a unified timeline is a differentiator. Most competitors show data in separate tabs. Complexity: High.

### Anti-features
- **Multi-nutricionista patient sharing** — Out of scope per PROJECT.md. Solo practitioners only. Complexity: High (avoided).
- **Appointment scheduling within patient view** — Dietbox has a full calendar. NutriAI defers this; patients schedule via external tools or WhatsApp. Complexity: High (deferred).
- **Patient portal/app** — Dietbox has a separate patient mobile app. NutriAI's strategy is WhatsApp-first (patient never installs anything). This is deliberate. Complexity: Very High (avoided).
- **Insurance/convenio integration** — Brazilian health insurance linkage. Not relevant for solo nutricionistas in private practice. Complexity: High (avoided).
- **CRN validation API** — Verifying CRN numbers against official registry. Nice-to-have but not critical for MVP. Complexity: Medium (deferred).

---

## Meal Plans & Food Catalog

### Table Stakes
- **Meal plan editor (meals, options, foods, macros)** — Core feature. Prototype has a full inline editor with meals, options, food rows, totals. Must preserve and make real. Complexity: High.
- **Food catalog with search and categories** — Prototype has base foods (per 100g) + preset portions with categories and search. Must connect to real database. Complexity: Medium.
- **Macro calculation (kcal, prot, carb, fat)** — Per-meal and per-day macro totals. Already in prototype. Must calculate from real data accurately. Complexity: Medium.
- **Portion sizes with presets** — "100g de frango desfiado" style presets linked to base food entries. Already in prototype. Complexity: Medium.
- **Plan duplication/copy** — Nutricionistas copy plans across patients frequently. Must support. Complexity: Medium.
- **Brazilian food database (TACO)** — Tabela Brasileira de Composição de Alimentos. Defer importing full TACO per PROJECT.md, but the catalog structure must support adding it later. Complexity: Medium (deferred full import, Low for structure).

### Differentiators
- **AI-assisted meal suggestions** — Dietbox has "Assistente Dietbox" for meal selection. NutriAI can differentiate by suggesting meals based on what the patient actually ate (WhatsApp data), not just generic databases. Complexity: High.
- **Portion flexibility with real-time re-calculation** — Edit any portion and macros recalculate instantly. The prototype does this in-line. Making it fast and accurate in production is a UX differentiator. Complexity: Medium.
- **Meal plan linked to WhatsApp behavior** — If patient reports deviations via WhatsApp, the plan view shows what was prescribed vs. what was consumed. This tight loop is unique. Complexity: High.

### Anti-features
- **PDF export of meal plans** — Marked as P2 in PROJECT.md. Competitors all have this. NutriAI should build it later, not in MVP. Complexity: Medium (deferred).
- **Recipe builder** — Detailed recipe with preparation instructions. Dietbox has this. Out of scope for MVP. Complexity: High (deferred).
- **Supplement prescription module** — Dietbox has this. Not in NutriAI's core value (which is meal plans + WhatsApp AI). Defer. Complexity: Medium (deferred).
- **Exam/laboratory request module** — Dietbox has this. Clinical nutrition software should eventually support this, but not MVP for NutriAI. Complexity: High (deferred).
- **Shopping list generation** — Auto-generate grocery lists from meal plans. Common feature but not core differentiator. Defer. Complexity: Low (deferred).
- **USDA food database as primary** — Brazilian nutricionistas need TACO, not USDA. Dietbox includes both. USDA alone would feel foreign. Complexity: N/A (avoid — use TACO or Brazilian-first data).

---

## WhatsApp AI Integration

### Table Stakes
- **WhatsApp connection via Evolution API** — Already decided in PROJECT.md. Must work reliably. Evolution API is open-source, self-hosted, 7.9k stars on GitHub, actively maintained. Complexity: High (infrastructure).
- **Patient receives link to start conversation** — Prototype references this flow. Patient clicks a link, starts chatting with AI on WhatsApp. Complexity: Medium.
- **AI responds based on meal plan** — Core value proposition. AI uses the nutricionista's prescribed plan as context for responses. Complexity: High (AI prompt engineering).
- **AI registers meals in timeline** — Patient reports what they ate, AI captures it and logs it back into the patient's timeline. This is the critical data flow. Complexity: High.
- **Harm reduction stance** — PROJECT.md specifies AI uses "redução de danos, dieta flexível" philosophy. AI should not be rigid or punitive. Complexity: Low (prompt rule).

### Differentiators
- **AI meal extraction from natural conversation** — Instead of forcing the patient to fill forms, AI extracts meal data from casual conversation in Portuguese. "Almocei um prato de feijoada com arroz e couve" → structured data. This is the core differentiator. No Brazilian competitor does this well. Complexity: Very High.
- **Plan-aware AI that knows patient context** — AI that knows the patient's prescribed macros, current adherence, and biometric trends to give contextual responses. Not just a generic chatbot. Complexity: High.
- **Nutricionista oversight of AI conversations** — The professional can see what the AI told their patient. This builds trust and allows clinical intervention when needed. Competitors like Dietbox just do automated reminders, not AI conversations. Complexity: Medium.
- **AI generates summary for nutricionista** — Instead of reading every WhatsApp message, the nutricionista sees an AI-generated summary of patient behavior. Complexity: Medium.

### Anti-features
- **Generic ChatGPT-style chatbot** — AI must be constrained to nutrition context with the patient's plan. Never a generic assistant. This would be a liability. Complexity: N/A (avoid).
- **Direct WhatsApp between patient and nutricionista** — Dietbox has chat in their app. NutriAI's model is AI-mediated. Direct chat doesn't scale for solo practitioners. The nutricionista should review AI summaries, not answer every message. Complexity: Medium (avoided).
- **AI prescribing medical advice** — Must be strictly bounded. AI should never prescribe supplements, diagnose conditions, or override the nutricionista's plan. Legal and ethical risk in Brazil. Complexity: Low (enforce via prompts and guardrails).
- **WhatsApp Business API (official Meta)** — Too expensive and restrictive for early-stage. Evolution API with Baileys (WhatsApp Web) is the correct starting point. Complexity: Very High (avoided initially), Medium later.
- **Multi-platform messaging (Telegram, Instagram)** — Focus on WhatsApp only. It's what 99% of Brazilians use. Other platforms add complexity without user demand. Complexity: High (avoided).

---

## Biometric Tracking

### Table Stakes
- **Biometric assessment recording** — Weight, body fat %, lean mass, water %, visceral fat, BMR. Already in prototype data model. Must persist to real database. Complexity: Medium.
- **Biometry timeline (per-consult entries)** — Append-only records per consultation date. Already in prototype. Complexity: Low.
- **Anthropometric method selection** — Protocol choice (Pollock 7-fold, etc.). Prototype supports this in data model. Complexity: Low.
- **Weight/BMI trend charts** — LineChart/Sparkline already in prototype. Must connect to real data. Complexity: Medium.

### Differentiators
- **AI-captured weight updates via WhatsApp** — "Pesei 63,5 kg hoje" → AI extracts and logs. Patient doesn't need to open any app. Competitors require manual entry in their patient app. Complexity: High.
- **Photo-based body assessment** — Dietbox has "DB360" for photo-based anthropometric estimation. Interesting but very complex and legally sensitive. Defer significantly. Complexity: Very High (deferred).
- **Automatic adherence-to-biometry correlation** — Show how meal plan adherence correlates with biometric outcomes. Requires both WhatsApp meal data and biometry data linked. Uniquely possible in NutriAI. Complexity: Medium.

### Anti-features
- **Smart scale / IoT device integration** — Connecting to Bluetooth scales or wearables. Not MVP. Let AI or manual entry handle it. Complexity: Very High (deferred).
- **DEXA scan import** — Importing DXA results. Very niche, very few patients have these. Complexity: High (deferred).
- **Body measurement photo analysis (DB360 clone)** — Dietbox just launched this. Extremely complex (computer vision, body estimation model, legal implications). Way beyond MVP scope. Complexity: Very High (avoided for now).

---

## Analytics & Insights

### Table Stakes
- **Dashboard KPIs** — Active patients, on-track/warning/danger counts, average adherence, WoW changes. Already in prototype (AGGREGATE data model). Must connect to real data. Complexity: Medium.
- **Patient-level insights** — Per-patient adherence, macro tracking, status. Already in prototype. Complexity: Medium.
- **Portfolio-level trends** — Week-over-week, overall health of patient roster. Already in prototype. Complexity: Medium.

### Differentiators
- **AI-generated clinical summaries** — "3 dos 4 pacientes com objetivo de hipertrofia estão acima de 90% de aderência esta semana" — automatically generated insights that help the nutricionista prioritize follow-ups. Complexity: Medium.
- **WhatsApp correlation insights** — "Pacientes que enviam mensagens 3+ vezes por semana têm 15% mais aderência" — derived from the unique WhatsApp data only NutriAI captures. No competitor can offer this. Complexity: High.
- **Alert intelligence** — Instead of just "warning" or "danger" status, AI explains why: "Ana está com tendência de diminuir proteína nas sextas-feiras". Actionable, not just a number. Complexity: High.

### Anti-features
- **PDF analytics reports** — PROJECT.md marks "Exportar PDF de inteligência" as deferred. Analytics should be live and interactive, not static PDFs. Complexity: Medium (deferred).
- **Financial analytics/revenue dashboard** — Dietbox Premium has financial reports. NutriAI separates billing (Stripe/Pagar.me) from clinical analytics. Complexity: Medium (avoided in insights view).
- **Comparative patient analytics across nutricionistas** — Multi-tenant analytics. Out of scope (solo practitioners). Complexity: Very High (avoided).

---

## Billing & Subscriptions

### Table Stakes
- **3-tier pricing (Iniciante, Profissional, Ilimitado)** — Already defined in prototype: R$99,99 (15 patients), R$149,99 (30), R$199,99 (unlimited). Must implement with real payment gateway. Complexity: Medium.
- **30-day trial with auto-renewal** — Already defined. Must implement Stripe/Pagar.me subscription billing. Complexity: Medium.
- **Credit card payment** — Brazilian market requires card payment. Stripe or Pagar.me must handle this. Complexity: Medium.
- **PIX payment** — PIX is Brazil's dominant instant payment method (since 2020). Dietbox accepts PIX for annual plans. Must support for annual subscriptions at minimum. Complexity: Medium (Pagar.me handles this).
- **Patient limit enforcement** — Each tier has a patient cap (15, 30, unlimited). Must enforce this in the application. Complexity: Low.
- **Cancel anytime** — Must support. Brazilian consumer protection (CDC) requires 7-day refund window. Dietbox complies. NutriAI must too. Complexity: Low.

### Differentiators
- **WhatsApp-based payment reminders** — Use the same Evolution API infrastructure to send payment reminders via WhatsApp. Unique channel integration. Complexity: Medium.
- **Usage-based upgrade nudges** — When hitting 80% of patient limit, prompt to upgrade. Smooth UX that competitors do poorly. Complexity: Low.

### Anti-features
- **Student pricing tier** — Dietbox has this. It's a marketing/channel play. Not MVP. Complexity: Medium (deferred).
- **Receptionist/staff billing** — Multi-seat billing. Out of scope. Complexity: High (avoided).
- **Marketplace/add-on pricing** — Charging extra for specific features. Keep pricing simple: tiers based on patient count. Complexity: Medium (avoided).
- **Custom enterprise contracts** — Solo practitioners don't do enterprise deals. Complexity: High (avoided).

---

## LGPD & Data Privacy

### Table Stakes
- **LGPD consent collection** — Lei Geral de Proteção de Dados requires explicit consent before collecting personal data. Health data (dados sensíveis) has even stricter requirements (Art. 11). Must implement consent at signup and patient registration. Complexity: Medium.
- **Privacy policy (Aviso de Privacidade)** — Must have a written privacy policy accessible to users. Dietbox has this. NutriAI must create one. Complexity: Low (legal template), Medium (proper implementation).
- **Terms of use (Termos de Uso)** — Required for any SaaS in Brazil. Must be linked at signup. Complexity: Low (legal template).
- **Data minimization** — Only collect what's needed. Health data is sensitive under LGPD Art. 5(II) and Art. 11. Must not over-collect. Complexity: Low (design discipline).
- **Right to data deletion/anonymization** — LGPD Art. 18 gives data subjects the right to request deletion. Must support this technically. Complexity: Medium.
- **Data portability** — LGPD Art. 18(V) gives users the right to export their data. Must support patient data export. Complexity: Medium.
- **WhatsApp data consent** — Since patient health data flows through WhatsApp, explicit consent for this specific processing is critical. Must be clear in patient-facing flow. Complexity: Medium.
- **Secure data storage** — Health data must be encrypted at rest and in transit. PostgreSQL with TLS + encryption at rest. Complexity: Medium.

### Differentiators
- **LGPD-compliant AI processing disclosure** — Make it crystal clear to patients that AI processes their WhatsApp messages for nutrition insights. Transparent disclosure as a feature, not just a checkbox. Builds trust. Complexity: Low.
- **Patient data isolation guarantee** — Solo nutricionista means each account's data is fully isolated. Market this as a privacy feature: "Seus pacientes são só seus." Complexity: Low (architectural by design).
- **Auto-expiring WhatsApp data** — WhatsApp conversation data used for AI processing can be set to auto-delete after N days. Not required by LGPD but shows commitment to minimal data retention. Complexity: Medium.

### Anti-features
- **Selling anonymized data** — Never. Brazilian law and health data ethics make this a non-starter. Complexity: N/A (avoid completely).
- **Sharing data with Meta/WhatsApp** — Evolution API uses WhatsApp Web (not official Business API). Messages are end-to-end encrypted on WhatsApp's side, but NutriAI must not share extracted data back. Complexity: N/A (avoid).
- **Over-collection of location data** — Some SaaS apps collect excessive location data. Health SaaS should not. Complexity: Low (avoid).

---

## Admin & Platform

### Table Stakes
- **Nutricionista account settings** — Profile edit, password change, notification preferences. Complexity: Low.
- **Theme toggle (light/dark)** — Already in prototype. Must preserve. Complexity: Low.
- **Sidebar/collapsible navigation** — Already in prototype. Must preserve. Complexity: Low.

### Differentiators
- **AI conversation review panel** — Where the nutricionista sees AI-patient interactions, can flag or override responses. No competitor has this. Complexity: Medium.
- **Template plans library** — Pre-built meal plan templates that can be customized per patient. Saves time for common objectives (hipertrofia, emagrecimento, etc.). Competitors have this. Complexity: Medium.

### Anti-features
- **Admin panel for platform** — PROJECT.md explicitly defers this: "Painel Admin — P1 futuro." No platform admin dashboard in MVP. Complexity: Very High (deferred).
- **User management (superadmin)** — No superadmin role. Solo product, no internal team managing users. Complexity: High (avoided).
- **Analytics for platform owner** — Platform-level usage analytics. Not needed for MVP. Complexity: Medium (deferred).
- **Global notifications (push, email)** — PROJECT.md marks this as P2. Nutricionista already gets data via WhatsApp. Email push can wait. Complexity: Medium (deferred).

---

## Cross-cutting Concerns

### Table Stakes
- **All UI in pt-BR** — Already in prototype. Must maintain throughout migration. No i18n system needed, just pt-BR strings everywhere. Complexity: Low (already done).
- **Responsive design** — Nutricionistas use both desktop (consultation) and mobile (on-the-go). Prototype has basic responsive; must improve. Complexity: Medium.
- **Error states and validation** — Prototype has almost none. Production needs proper form validation, error boundaries, and API error handling. Complexity: Medium.
- **Loading states** — Prototype has no loading indicators. Production must show spinners/skeletons during API calls. Complexity: Low.

### Differentiators
- **Offline-capable PWA** — Nutricionistas in Brazil may have unreliable internet. If the app works offline with sync, that's a differentiator. Not MVP but significant. Complexity: High (deferred).
- **Dark mode as first-class** — Already in prototype. Make it genuinely good (not just a toggle), with proper contrast ratios. Many clinical tools look medical and sterile. NutriAI's design is more modern. Complexity: Low.
- **Micro-interactions / polished UX** — The prototype already has a distinctive visual design (custom SVGs, smooth animations). Preserving this polish through migration is a differentiator vs. competitors' utilitarian UIs. Complexity: Medium.

### Anti-features
- **Internationalization (i18n)** — pt-BR only for now. Brazilian market is large enough. No need for multi-language infrastructure. Complexity: High (avoided).
- **Native mobile app** — PROJECT.md explicitly says "web-first, mobile depois." WhatsApp replaces the need for a patient app. Nutricionista's web panel is responsive enough. Complexity: Very High (deferred).
- **Real-time collaboration** — Google Docs-style multi-user editing. Solo product, solo user per account. Complexity: Very High (avoided).
- **Custom domain / white-label** — Let nutricionistas customize the URL or branding. Not needed for MVP. Complexity: Medium (deferred).
- **Audit log** — Detailed action logging for compliance. Important for LGPD but not MVP. Complexity: Medium (deferred).

---

## Feature Dependencies

```
Authentication & Onboarding
├── Email/password login → Session persistence (JWT)
├── Signup → Professional profile → Trial activation → Checkout (Stripe/Pagar.me)
└── Onboarding wizard → Creates first patient (optional) → Redirects to dashboard

Patient Management
├── Patient CRUD → Patient detail view (5 tabs)
├── Patient data → Biometric tracking → Charts & trends
└── Patient data → Meal plan assignment → WhatsApp AI integration

Meal Plans & Food Catalog
├── Food catalog → Meal plan editor → Macro calculation
├── Meal plan editor → Plan duplication → Plan assignment to patient
└── Meal plan → WhatsApp AI context (AI reads plan to answer patient questions)

WhatsApp AI Integration
├── Evolution API setup → WhatsApp number connection → Patient receives link
├── WhatsApp conversation → AI extracts meal data → Meal logs in timeline
├── WhatsApp conversation → AI extracts weight updates → Biometry logs
├── Meal plan (context) → AI responses → Patient gets plan-aware answers
└── AI conversations → AI summaries → Nutricionista review panel

Biometric Tracking
├── Patient record → Biometric assessment form → Biometry timeline
├── Biometry data → Weight/BMI trend charts
└── Biometry data ← AI WhatsApp extraction (weight from conversation)

Analytics & Insights
├── Patient data (all) → Dashboard KPIs
├── Meal adherence data → Adherence charts
├── WhatsApp interaction data → AI correlation insights
└── All data → AI clinical summaries

Billing & Subscriptions
├── Stripe/Pagar.me integration → Subscription creation → Trial → Auto-renewal
├── Subscription tier → Patient limit enforcement
└── Payment gateway → PIX + credit card support

LGPD & Data Privacy
├── Signup flow → Consent collection checkboxes
├── Patient registration → Health data consent
├── WhatsApp link → AI processing consent for patient
├── Any data → Deletion/anonymization capability (api endpoint)
└── System-wide → Encrypted storage, TLS, privacy policy link
```

---

## Competitive Landscape (Brazil)

### Dietbox (Market Leader)

**Position:** Dominant player in Brazilian nutrition SaaS. 12+ years in market. Largest user base.

**Pricing:** R$49,90/mês (Professional annual, first 3 months) → R$91,90/mês (Professional annual, after promo); R$133,90/mês (Premium annual). Free tier for students.

**Key features:**
- Meal plan builder (calculated and free-form)
- Patient mobile app (separate download)
- WhatsApp integration (WhatsSync for automated messages)
- AI assistant for meal plan creation (Assistente Dietbox)
- Anthropometric assessment (including DB360 photo-based)
- Google Calendar integration
- Agenda with online booking
- Financial management
- Canva integration for educational materials
- Dietbox Academy (courses with certificates)
- Professional website/landing page
- Receptionist access role
- Lab exam interpretation module
- Supplement/herbal prescription module

**Strengths:** Comprehensive feature set, market trust, mature product, large community, education content.

**Weaknesses:** Legacy UI, feature bloat, expensive for solo practitioners, WhatsApp integration is just automated messages (not AI conversations), patient communication is one-way notifications.

**NutriAI vs Dietbox positioning:** NutriAI is WhatsApp-AI-native; Dietbox bolted WhatsApp onto a traditional clinical tool. NutriAI focuses on solo practitioners; Dietbox tries to serve everyone. NutriAI's AI converses with patients; Dietbox sends reminders.

### NutriCon (Niche)

**Position:** Smaller nutrition software focused on clinical documentation.

**Key features:**
- Clinical records/anutamnese
- Anthropometric protocols
- Meal plan builder
- PDF export

**Weaknesses:** Dated UI, no mobile app, no AI, no WhatsApp, limited to clinical documentation.

### SmartMeals / SmartMeals alternatives

**Position:** Meal planning tools, not full clinical SaaS. Multiple small competitors in this space.

**Key features:**
- Recipe-focused meal planning
- Some macro calculation
- Basic patient management

**Weaknesses:** Not clinical-grade, no biometry, no AI, no WhatsApp.

### HubDiet

**Position:** Emerging competitor with WhatsApp focus.

**Note:** Website was unreachable during research. Known to offer WhatsApp integration for nutrition communication. Smaller player.

### Key Competitive Insight

**The gap:** No Brazilian nutrition SaaS has AI that **converses** with patients via WhatsApp. Dietbox has "WhatsSync" for automated reminders and an "AI assistant" for nutricionistas during plan creation. No one has AI that captures meal data from patient conversations and feeds it back into the clinical record.

**NutriAI's unique value:** The WhatsApp AI conversation loop — patient chats naturally, AI extracts structured meal data, nutricionista sees a summary — is the core differentiator. This is technically feasible with LLMs + Evolution API + structured extraction, and no competitor does it.

**Pricing advantage:** At R$99,99–199,99/mês, NutriAI is competitive with Dietbox Professional (~R$91,90/mês annual) while offering a fundamentally different interaction model.

---

## MVP Feature Priority Summary

### Must-Have (P0 — no launch without these)
1. Authentication (email/password, JWT sessions)
2. Patient CRUD with list/detail views
3. Meal plan editor with food catalog
4. Biometric assessment recording
5. Basic dashboard KPIs
6. WhatsApp connection via Evolution API
7. AI conversation with patient (meal extraction)
8. Meal timeline (AI + manual entries)
9. LGPD consent flows
10. Stripe/Pagar.me subscription billing

### Should-Have (P1 — important for retention)
1. Password reset flow
2. Plan duplication/copy
3. AI clinical summaries for nutricionista
4. AI conversation review panel
5. Patient status auto-inference
6. Adherence-to-biometry correlation
7. Template meal plans library

### Nice-to-Have (P2 — differentiation, not blocking)
1. PDF export of meal plans
2. Global notifications (email/push)
3. Structured patient reports
3. Admin panel for platform
5. PIX payment for monthly
6. Photo-based biometry
7. Shopping list generation

---

*Features research: 2026-04-19*
*Sources: Dietbox.com.br, Dietbox blog, Evolution API GitHub (7.9k stars), PROJECT.md, prototype analysis*
*Confidence: HIGH (Dietbox verified via official site; Evolution API verified via GitHub; NutriAI prototype verified via codebase analysis)*