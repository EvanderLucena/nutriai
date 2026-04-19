# Pitfalls Research: NutriAI

**Research Date:** 2026-04-19
**Context:** Migration of single-file React CDN prototype to React+TS+Vite+Tailwind frontend + Spring Boot backend + PostgreSQL + WhatsApp + payments
**Confidence:** HIGH (multiple verified sources + direct codebase analysis)

---

## Migration Pitfalls

### Pitfall 1: Big Bang Rewrite Instead of Incremental Migration

**What goes wrong:** Attempting to rewrite the entire application from scratch as a monolithic effort. The prototype has 14 JSX files, a 1726-line CSS file, complex state logic, hand-rolled SVG visualizations, and deeply intertwined components via `window` globals. A full rewrite means months with nothing deployable.

**Why it happens:** The current codebase feels "wrong" (no modules, no types, no build step), making it tempting to start over. The gap between CDN React and Vite+TS feels unbridgeable, so teams start from scratch.

**Consequences:** Feature freeze during rewrite. Existing UI (which is "90% ready visually") gets redesigned unnecessarily. Timeline explodes. Morale drops. Shipping delays.

**Prevention:** Migrate incrementally — first make the existing code buildable with Vite (converting globals to imports), then add TypeScript gradually, then connect the backend. Preserve all UI visually before changing any behavior.

**Detection:** If you have a `v2/` directory or a blank project with no functional screens. If the migration timeline exceeds 2 sprints without a working build.

**Phase to address:** Phase 1 (Build & Structure) — establish Vite+TS project first, then migrate components in one batch since the total is manageable (~14 files).

---

### Pitfall 2: Preserving Global Window Dependencies Too Long

**What goes wrong:** During migration, keeping `window.ComponentName` patterns in the new Vite project "just to get it working first." This creates a hybrid state where some code uses ES modules and some still uses globals, causing subtle bugs.

**Why it happens:** Each JSX file ends with `Object.assign(window, { ComponentName })` and every other file references components directly by name (e.g., `PatientView`, `IconHome`). Converting all at once feels risky.

**Consequences:** Race conditions in load order. Components that work in dev (where Babel processes sequentially) break in production (where Vite bundles differently). Circular dependency hell when `import` replaces `window`.

**Prevention:** Convert ALL global references to ES imports in a single coordinated pass. The `window` pattern must die completely — a hybrid approach is worse than either pure approach. Create a migration checklist mapping every `window.X` to its source file.

**Detection:** Any `Object.assign(window, ...)` or `window.X` references remain after Phase 1. Grep for these patterns regularly.

**Phase to address:** Phase 1 (Build & Structure) — this is a day-1 concern during Vite migration.

---

### Pitfall 3: Losing Prop Drilling Context During State Migration

**What goes wrong:** The App component passes 15+ props down through 3-4 levels (`App → HomeView → KPI → PatientCard`). When migrating to a state manager or Context, teams either (a) keep all prop drilling AND add Context (redundant), or (b) remove prop drilling too aggressively and break components that still need specific props.

**Why it happens:** The current App state is monolithic — `authView`, `isAuthenticated`, `view`, `activePatientId`, `statusFilter`, `patients`, `tweaks`, `sidebarOpen` all live together. It's unclear which props each view actually needs.

**Consequences:** Broken UI when components lose required props. Performance issues when Context re-renders the entire tree on any state change. Or stale prop drilling code that nobody removes.

**Prevention:** Before migrating state, create a "prop dependency map" — for each view, list which App-level state variables it actually reads. Then design Context boundaries based on read patterns: AuthContext, NavigationContext, PatientDataContext. Don't put everything in one context.

**Detection:** Components receiving props they never use (like `showAISummary` — already detected in concerns). Context that causes re-renders when unrelated state changes.

**Phase to address:** Phase 1 (Build & Structure) during component decomposition, and Phase 2 when connecting state to API.

---

## Frontend Migration Pitfalls

### Pitfall 4: CSS Custom Properties → Tailwind Without Token Mapping

**What goes wrong:** The prototype has a well-designed theme system with CSS custom properties (`--ink`, `--lime`, `--coral`, `--sage`, `--amber`, `--sky`, `--paper`, `--fg` variants) supporting light/dark modes. Naively converting to Tailwind means either (a) losing the theme tokens and hard-coding color values, or (b) creating a mismatch between Tailwind config and the existing design.

**Why it happens:** Tailwind uses a different token model (`text-slate-900` vs `color: var(--ink)`). The 1726-line `styles.css` has structural layouts AND theming mixed together. Teams delete the CSS file and try to recreate everything in Tailwind utilities, losing the theme system.

**Consequences:** Dark mode breaks. Colors shift subtly. Component spacing changes. The "preserve UI" constraint is violated.

**Prevention:** Map ALL CSS custom properties to Tailwind config first — define `theme.extend.colors` with the exact same semantic tokens (`ink`, `lime`, `coral`, etc.) with light/dark variants. Keep `styles.css` for global layout that doesn't map cleanly to utilities. Use `dark:` variant in Tailwind with a `data-theme` selector strategy matching the current approach.

**Detection:** Visual regression on theme toggle. Colors not matching Figma/design. Any `var(--X)` reference that doesn't have a Tailwind equivalent.

**Phase to address:** Phase 1 (Build & Structure) — Tailwind config must be set up before component migration begins.

---

### Pitfall 5: In-Browser Babel to Vite Build Step Breakage

**What goes wrong:** Current JSX files use Babel standalone syntax that differs subtly from Vite's esbuild transpilation. Specifically: (a) files use `React.useState` prefix pattern (works with global React, breaks without `import React`), (b) `Object.assign(window, { ... })` at end of each file, (c) no default exports, only named exports via window globals.

**Why it happens:** The 14 script tags load sequentially and share scope. Vite requires explicit `import`/`export`. Components reference each other by name (e.g., `RingChart` used in `view_patient.jsx` comes from `viz.jsx`) but there's no explicit dependency declaration.

**Consequences:** Build errors that are hard to debug because they depend on load order. Components fail to resolve at runtime. Circular imports between files that previously didn't matter (since everything was global).

**Prevention:** Create a dependency graph first (which file imports which components). Add `export` to each component definition and `import` at the top of consuming files. Use Vite's `react()` plugin. Test each file conversion individually.

**Detection:** Build warnings about circular dependencies. Runtime errors like "X is not defined" or "Cannot read property of undefined".

**Phase to address:** Phase 1 (Build & Structure) — first thing to solve before anything else works.

---

### Pitfall 6: Inline Style Objects Creating Performance Hotspots

**What goes wrong:** The current code has thousands of `style={{...}}` objects. Each creates a new object on every render. When combined with (a) charts that re-render on mousemove, (b) component lists, and (c) no `React.memo` anywhere, this creates significant GC pressure and unnecessary re-renders.

**Why it happens:** The prototype was quick to build — inline styles are fast to write. But migrating them 1:1 to the new codebase means preserving a performance anti-pattern.

**Consequences:** Sluggish UI on lower-end devices. React DevTools Profiler shows chart components re-rendering hundreds of times per second during hover interactions.

**Prevention:** During migration, extract repeated inline style patterns to Tailwind classes or `useMemo`-ed style constants. Specifically target: (a) chart components (`viz.jsx`, `view_patient.jsx` MultiLineChart), (b) list items rendered in `.map()` calls, (c) hover state handlers that trigger re-renders.

**Detection:** Chrome DevTools Performance tab showing GC spikes. React Profiler showing >16ms frames during user interactions.

**Phase to address:** Phase 1 during component extraction, and Phase 2 (API integration) when data-driven rendering increases re-render frequency.

---

### Pitfall 7: Losing Google Fonts Self-Hosting Requirement

**What goes wrong:** The prototype loads 3 Google Fonts (Inter Tight, JetBrains Mono, Instrument Serif) from `fonts.googleapis.com`. This violates LGPD (Brazilian GDPR equivalent) because Google tracks users via IP. The landing page already claims "dados criptografados, conforme LGPD" but loads external fonts that leak data.

**Why it happens:** Fonts seem innocuous. Teams don't think of font loading as a privacy concern. Google Fonts is the default.

**Consequences:** LGPD non-compliance (health data app leaking IPs to Google). Page loads that depend on Google CDN availability. Font flicker or layout shift on slow connections.

**Prevention:** Download font files and serve them from the Vite build assets. Use `@font-face` declarations with local `src`. Remove all `fonts.googleapis.com` references. This is both a compliance and performance win.

**Detection:** Any external font URL in HTML or CSS. Network tab showing requests to `fonts.googleapis.com` or `fonts.gstatic.com`.

**Phase to address:** Phase 1 (Build & Structure) — font setup is part of initial project configuration.

---

## Backend Pitfalls

### Pitfall 8: Spring Boot Security Misconfiguration for SPA + API

**What goes wrong:** Spring Security defaults conflict with SPA architecture. Common mistakes: (a) enabling CSRF protection that blocks SPA API calls, (b) session-based auth that doesn't work with a separately-deployed frontend, (c) CORS misconfigured so the frontend can't reach the backend, (d) using default session management instead of JWT.

**Why it happens:** Spring Security's defaults are designed for server-rendered apps. The prototype is a pure SPA that will make API calls to the backend. The separation between frontend (Vercel/CDN) and backend (VPS) means different origins, which triggers CORS by default.

**Consequences:** Frontend can't authenticate. Preflight requests blocked. Cookies not sent. 403 on every POST. Hours wasted debugging CORS/CSRF issues.

**Prevention:** Configure Spring Security explicitly for SPA + JWT: (a) disable CSRF for API endpoints (use JWT, not cookies), (b) configure CORS with explicit allowed origins (frontend URL), (c) use stateless session management (`SessionCreationPolicy.STATELESS`), (d) configure the `SecurityFilterChain` with JWT filter before `UsernamePasswordAuthenticationFilter`. The Spring Security docs show SPA-specific CSRF handling if cookies are used.

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable()) // JWT, not session-based
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/**").authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}
```

**Detection:** Browser console shows CORS errors. 403 responses on API calls. Frontend can't persist auth state.

**Phase to address:** Phase 2 (Backend & Auth) — this must be correct before any API integration works.

---

### Pitfall 9: PostgreSQL Schema Design for Multi-Tenant Solo Nutricionistas

**What goes wrong:** Designing the database as if it's a single-tenant system, then retroactively trying to add `nutricionista_id` foreign keys to every table. Or over-engineering with full multi-tenancy (separate schemas per tenant) when the requirement is isolation-by-nutricionista only.

**Why it happens:** The prototype has no backend, so there's no existing schema. It's tempting to start simple (no tenant isolation) or go overboard (full multi-tenant with schema-per-tenant) when the actual need is row-level security by `nutricionista_id`.

**Consequences:** Data leak between nutricionistas (CRITICAL for health/LGPD). Or over-complex schema that makes queries slow. Or requiring application-level filters on every single query.

**Prevention:** Design every table with `nutricionista_id` as a required column from day one. Use PostgreSQL Row-Level Security (RLS) policies as an additional safety net, not the primary mechanism. Every repository query method should accept `nutricionista_id` as a parameter. Use `@Entity` with a `@ManyToOne` relationship to a `Nutricionista` entity on all clinical data tables.

**Detection:** Any query that can return data across nutricionistas. Missing `WHERE nutricionista_id = ?` in repository methods. Tests that show one nutricionista can access another's patient data.

**Phase to address:** Phase 2 (Backend & Auth) — schema design before any CRUD operations.

---

### Pitfall 10: JPA N+1 Queries on Patient Lists with Rich Data

**What goes wrong:** The patient list view shows 12+ patients with status badges, macro summaries, and sparkline trends. If each patient loads their plan data, biometric history, and timeline separately, you get N+1 queries: 1 query for patients, then N queries for each patient's related data.

**Why it happens:** Spring Data JPA's default fetch strategy is LAZY. When you iterate `patient.getPlan()` it triggers a separate query. The prototype loads all data into memory at once (it's all mock), hiding this issue completely.

**Consequences:** The patient list (which should be fast) becomes the slowest page. 12 patients × 3-4 related entities = 48+ queries per page load. This kills perceived performance.

**Prevention:** Use `@EntityGraph` for list endpoints that need related data. Create specific DTO projections for list views (not full entities). Use `@Query` with JOIN FETCH for known access patterns. Consider a read model for list views separate from the entity model.

**Detection:** Hibernate statistics log showing >5 queries per list page load. Slow response times on `/api/patients` endpoint. React Profiler showing excessive re-renders as data arrives serially.

**Phase to address:** Phase 3 (Data & Plans) when patient list API is implemented, and Phase 4 when AI adds more data.

---

### Pitfall 11: Not Validating CRN (Conselho Regional de Nutrição) on Signup

**What goes wrong:** The signup form collects CRN number (`CRN-3 24781` format) but never validates it. CRN is a professional credential — entering a fake one could allow unqualified people to access clinical tools meant for registered nutritionists.

**Why it happens:** CRN validation requires calling an external API (Conselho Regional de Nutrição) or maintaining a validation algorithm. The prototype discards all signup data.

**Consequences:** Unqualified users creating accounts. Legal liability. Potential LGPD violation if patient data is accessed by non-professionals.

**Prevention:** At minimum, validate CRN format (regex for `CRN-X XXXXX` pattern). For production, integrate with CRN verification (each regional council has lookup capabilities). Store CRN as a registration field, not just display text. Consider a verification workflow where CRN must be validated before the account is activated.

**Detection:** Any account with an invalid or missing CRN pattern. Signup form that accepts any string in the CRN field.

**Phase to address:** Phase 2 (Backend & Auth) — CRN validation is part of signup flow.

---

## WhatsApp Integration Pitfalls

### Pitfall 12: Evolution API Instance Management at Scale

**What goes wrong:** The project plans "1 número WhatsApp compartilhado entre nutris" (1 shared number for all nutritionists) initially. This works for ~10-20 nutris but breaks the moment multiple patients message simultaneously — the AI responds from a single number with no way to associate conversations correctly, and WhatsApp rate-limits a single number.

**Why it happens:** Creating separate Evolution API instances per nutricionista adds complexity (each needs their own number or a Baileys instance). The shared approach seems simpler for MVP.

**Consequences:** At >20 concurrent conversations, message routing breaks. Patients see responses intended for others (or at least from the wrong context). WhatsApp may flag the number as spam. No way to attribute conversations to specific nutritionists.

**Prevention:** From the start, architect for per-nutricionista instances even if Phase 1 uses a single shared number. The data model should include `instanceId` on the `Nutricionista` entity. Evolution API supports instance creation via API (`POST /instance/create`) — automate this during signup. Design the webhook handler to route messages by instance name, not by phone number.

**Detection:** Message routing errors when >5 concurrent conversations. Patients receiving wrong context responses. WhatsApp banning the shared number.

**Phase to address:** Phase 4 (WhatsApp & AI) — instance management from day 1, even if initially single-instance.

---

### Pitfall 13: WhatsApp Webhook Reliability and Idempotency

**What goes wrong:** Evolution API sends webhooks for `MESSAGES_UPSERT`, `CONNECTION_UPDATE`, etc. If the server is down or slow, webhooks are lost. If the server processes a webhook slowly and Evolution retries, the same message gets processed twice — creating duplicate timeline entries or duplicate AI responses.

**Why it happens:** Webhooks are fire-and-forget from Evolution API's perspective. The receiving endpoint must handle network failures, server restarts, and duplicate deliveries.

**Consequences:** Duplicate AI responses sent to patients. Duplicate meal log entries. Lost messages during server downtime. Inconsistent conversation state.

**Prevention:** (a) Store incoming message IDs (WhatsApp message `key.id`) and deduplicate on insert. (b) Return `200 OK` immediately, process asynchronously. (c) Use a message queue (even a simple database-backed one) for webhook processing. (d) Track `CONNECTION_UPDATE` events to know when the WhatsApp session is active. (e) Evolution API supports `webhook_by_events: true` — use it to get separate endpoints per event type.

**Detection:** Duplicate entries in the `meal_log` table with the same `message_id`. AI sending the same nutritional analysis twice. Gaps in conversation logs.

**Phase to address:** Phase 4 (WhatsApp & AI) — webhook handler design before any message processing logic.

---

### Pitfall 14: WhatsApp Session Disconnection and QR Code Re-authentication

**What goes wrong:** Baileys-based WhatsApp connections (used by Evolution API) require QR code scanning to link a phone number. Sessions can disconnect due to: (a) WhatsApp phone being offline, (b) multi-device sync issues, (c) WhatsApp policy changes, (d) server restarts. When disconnected, the AI silently stops receiving messages.

**Why it happens:** Baileys is an unofficial WhatsApp Web client. Meta regularly changes their protocol, causing connection drops. Unlike the official WhatsApp Business API, there's no guaranteed uptime SLA.

**Consequences:** Nutritionists don't realize their WhatsApp bot is down. Patients send messages that go unanswered. Critical meal data is lost. No notification that the connection dropped.

**Prevention:** (a) Monitor `CONNECTION_UPDATE` webhooks and alert when status changes to `close` or `offline`. (b) Build an admin dashboard showing connection status per instance. (c) Implement automatic reconnection logic using Evolution API's `instance/restart/{instanceName}` endpoint. (d) Show connection status in the nutritionist's dashboard. (e) Consider fallback: if Baileys is down for >X minutes, notify the nutritionist via email.

**Detection:** `CONNECTION_UPDATE` webhook with state `close`. Missing heartbeat from Evolution API. No messages received for >30 minutes from an active instance.

**Phase to address:** Phase 4 (WhatsApp & AI) — connection monitoring is critical path, not nice-to-have.

---

### Pitfall 15: Not Handling WhatsApp Media Messages

**What goes wrong:** Patients will send photos of their meals (not just text). Evolution API delivers these as media messages with `messageType: "imageMessage"` rather than `"conversation"`. If the handler only processes text, photo messages are silently dropped — and meal photo logging is a core feature.

**Why it happens:** The initial implementation processes `message.conversation` (text) only. The Evolution API webhook payload structure changes for media: `message.imageMessage` instead of `message.conversation`, with `mediaUrl` and `mimetype` fields.

**Consequences:** Meal photos from patients are lost. No food recognition from images. Patients think the bot is ignoring them. Core value proposition (AI logging meals via WhatsApp) is broken.

**Prevention:** Handle message types from the start: `conversation` (text), `imageMessage` (photos), `documentMessage` (PDFs), `audioMessage` (voice notes). Store media URLs from Evolution API. Even if AI image analysis is deferred, store the image and acknowledge receipt. Use the `messageType` field in webhook payloads to route processing.

**Detection:** Messages in webhook logs with `messageType` != "conversation" that produce no response. Empty chat logs for patients who say they sent photos.

**Phase to address:** Phase 4 (WhatsApp & AI) — message type routing in webhook handler.

---

## Payment Pitfalls

### Pitfall 16: Brazilian Payment Methods Beyond Credit Card

**What goes wrong:** Implementing Stripe (which is in the project considerations) as the sole payment gateway, only to discover that Brazilian users expect PIX (instant bank transfer) as the primary payment method. Stripe has limited PIX support in Brazil. The pricing page shows R$99,99 – R$199,99/month, which are typical SaaS subscription prices where PIX and boleto are common.

**Why it happens:** International developer mindset defaults to Stripe. But Brazil has unique payment habits: PIX accounts for >40% of online transactions (2025 data), boleto is still used by many professionals, and credit cards often have installment expectations (parcelamento).

**Consequences:** Higher payment failure rate. Lower conversion. Nutritionists (who may not have international credit cards) can't subscribe. Revenue loss.

**Prevention:** Use Pagar.me (now part of PagSeguro) instead of Stripe. Pagar.me is Brazilian-born, supports PIX (with QR code and copy-paste), boleto, credit cards (with parcelamento), and has native subscription support. Their API supports recurring payments with `type: "subscription"` and `plan_id`. The checkout API supports all Brazilian payment methods natively.

**Detection:** Users asking "where's PIX?" on signup. Payment attempt data showing failed cards. Subscription conversion rate below expectations.

**Phase to address:** Phase 5 (Payments) — this is the phase where the gateway choice must be finalized, but the decision should be made in planning.

---

### Pitfall 17: Subscription Dunning and Payment Failure Handling

**What goes wrong:** Monthly subscriptions will inevitably fail (expired card, insufficient funds, bank rejection). Without dunning logic, failed payments = immediate access cutoff, which creates angry users. Or no cutoff = free service forever.

**Why it happens:** The prototype has no payment system at all. Teams implement the happy path (subscribe → access) and forget the unhappy path (payment fails → then what?).

**Consequences:** Lost revenue from silently expired subscriptions. Or churned users who lose access with no recovery path. Legal issues in Brazil where consumer protection (Código de Defesa do Consumidor) requires clear notification before service termination.

**Prevention:** Design the dunning flow before implementing payments: (a) payment fails → 3-day grace period, (b) retry on day 3, 7, 10, (c) send email/notification on each failure, (d) after 15 days → suspend access (not delete), (e) allow reactivation within 30 days. Pagar.me webhooks provide `subscription.paid`, `subscription.payment_failed`, `subscription.canceled` events.

**Detection:** Users with `status: "active"` but no successful payment in >30 days. No webhook handler for `payment_failed` events.

**Phase to address:** Phase 5 (Payments) — dunning flow is part of subscription implementation, not an afterthought.

---

### Pitfall 18: Pricing as Integer Centavos vs. Float Reais

**What goes wrong:** The landing page shows R$99,99, R$149,99, R$199,99 — prices with centavos. If payments are stored as floating point (R$99.99), rounding errors accumulate. Database stores `99.99` as a float, but `99.99 * 3 = 299.97` may compute as `299.97000000000003`.

**Why it happens:** Brazilian pricing commonly uses centavos (R$99,99). It's natural to reach for `float` or `double`. But payment APIs (Pagar.me, Stripe) work in centavos as integers: `9999` (not `99.99`).

**Consequences:** Rounding discrepancies between frontend display and backend storage. Payment gateway rejects amounts that don't match. Subscription renewal charges wrong amount. Financial reporting is unreliable.

**Prevention:** Store all monetary values as integers in centavos (`9999` for R$99,99). Use `BigDecimal` in Java for any monetary calculations. Display formatting converts centavos → Reais only at the presentation layer. The JPA entity should have `@Column` with `integer` type for price. Never use `float` or `double` for money.

**Detection:** Any `double` or `float` type in entity fields named `price`, `amount`, `cost`. Any arithmetic operation on monetary values using `+` or `*` instead of `BigDecimal`.

**Phase to address:** Phase 2 (Backend & Auth) — entity design, and Phase 5 (Payments) — pricing logic.

---

## LGPD & Data Privacy Pitfalls

### Pitfall 19: Health Data Classification Without Proper Safeguards

**What goes wrong:** This app handles health data (biometrics, meal logs, dietary restrictions, anthropometric measurements). Under Brazilian LGPD (Lei Geral de Proteção de Dados), health data is "dado pessoal sensível" (sensitive personal data) with stricter processing requirements. The prototype stores patient weights, body fat percentages, dietary restrictions, and eating behavior — all in plaintext JavaScript variables.

**Why it happens:** Brazilian data protection law is relatively recent (2020) and many developers are unaware that health data has a higher protection tier. The prototype mocks data that looks like real patient records.

**Consequences:** Legal penalties under LGPD (up to 2% of revenue, max R$50M per violation). Data breach notification requirements. Criminal liability for negligent handling of sensitive data. Loss of professional credibility with nutritionists who are LGPD-aware.

**Prevention:** (a) Encrypt patient health data at rest (PostgreSQL column-level encryption or pgcrypto for sensitive fields like weight, body fat, health conditions). (b) Encrypt all data in transit (HTTPS mandatory, no exceptions). (c) Implement purpose limitation — health data is only processed for meal plan management, not for marketing. (d) Data minimization — only collect what's needed for the nutritionist-patient relationship. (e) Implement consent tracking — when and what the patient consented to. (f) Have a Data Protection Impact Report (RIPD) before launch. (g) Remove all realistic mock patient data from the codebase immediately.

**Detection:** Any database column storing health data without encryption. Mock data files with realistic health information still in source code. Missing consent records for data processing.

**Phase to address:** Phase 2 (Backend & Auth) — encryption at rest for health data columns. Phase 3 (Data & Plans) — data model includes consent tracking. Phase 5 (Payments) — no health data in payment records.

---

### Pitfall 20: Consent Management Without Enforcement

**What goes wrong:** The signup form has `<a href="#">Termos de Uso</a>` and `<a href="#">Política de Privacidade</a>` — links to nowhere. Even if real terms are written, checking a checkbox doesn't create legally valid consent under LGPD, which requires: specific, informed, and free consent, with a record of when and how it was given.

**Why it happens:** "I agree to terms" checkboxes are the web standard. But LGPD requires more: the user must know what they're consenting to, consent must be specific (not bundled), and there must be a record of the consent event.

**Consequences:** Legally invalid consent. If challenged, the company can't prove the patient agreed to data processing. LGPD requires proof of consent, not just a checkbox.

**Prevention:** Build a consent management system: (a) `ConsentRecord` table with `user_id`, `consent_type`, `consent_text_hash`, `granted_at`, `ip_address`, `user_agent`. (b) Separate consents for: terms of service, privacy policy, health data processing, WhatsApp communication. (c) Allow withdrawal of consent (with data deletion). (d) Never bundle — "I agree to everything" is not specific consent. (e) Version the terms — when terms change, re-consent is required.

**Detection:** Signup flow with a single "I agree" checkbox. No record of when consent was given. No way for users to view or withdraw consent.

**Phase to address:** Phase 2 (Backend & Auth) — consent table and signup flow. Phase 6 (LGPD) — consent management UI.

---

### Pitfall 21: Data Retention and Right to Deletion

**What goes wrong:** Brazilian law (LGPD Art. 18, VI) gives data subjects the right to delete their personal data. But in a clinical nutrition app, deleting a patient also deletes their treatment history, which the nutritionist may need for professional records. Also, if the nutritionist is the "controller" of the patient's data, who has the deletion right?

**Why it happens:** The relationship is triangular: NutriAI (processor), nutritionist (controller?), patient (data subject). LGPD rights get complicated when multiple parties have legitimate interests in the same data.

**Consequences:** Impossible to comply with deletion requests. Or overly broad deletion that removes data the nutritionist needs. Legal ambiguity about who controls what.

**Prevention:** (a) Define clear data roles in terms: Nutritionist is data controller, NutriAI is data processor, patient data belongs to patient but is processed on nutritionist's behalf. (b) Implement "soft delete" — anonymize rather than hard delete. (c) Allow patient to withdraw consent for AI processing without deleting their clinical data. (d) Set retention policies: active patient data retained while subscription active, archived data retained for regulatory period, then anonymized. (e) Build an export feature so patients can download their data (LGPD right of access).

**Detection:** No way to differentiate between "archive" and "delete". Direct `DELETE FROM patients WHERE id = ?` without audit trail.

**Phase to address:** Phase 2 (Backend & Auth) — soft delete entities. Phase 6 (LGPD) — data subject rights interface.

---

## DevOps Pitfalls

### Pitfall 22: Docker Compose Without Health Checks and Startup Ordering

**What goes wrong:** The `docker-compose.yml` starts PostgreSQL, Evolution API, Spring Boot backend, and Nginx frontend all at once. Spring Boot tries to connect to PostgreSQL before it's ready. Evolution API starts accepting webhook registrations before the backend URL is reachable. Everything fails in a cascading error.

**Why it happens:** Docker Compose `depends_on` only controls startup order, not readiness. Without health checks, "started" ≠ "ready to accept connections."

**Consequences:** Flasky container restarts. Backend crashes on startup because PostgreSQL isn't ready. Evolution API webhooks pointed at backend URLs that don't exist yet. Development environment that "works on my machine" after manual restarts.

**Prevention:** Add health checks to every service: (a) PostgreSQL: `pg_isready -U $POSTGRES_USER`, (b) Spring Boot: HTTP health endpoint `/actuator/health`, (c) Evolution API: HTTP GET on status endpoint, (d) Nginx: HTTP GET on port 80. Use `depends_on` with `condition: service_healthy`. Add `restart: unless-stopped` and startup grace periods.

```yaml
depends_on:
  postgres:
    condition: service_healthy
  evolution-api:
    condition: service_started
```

**Detection:** `docker compose up` fails intermittently. Backend logs show "Connection refused" to PostgreSQL. Manual `docker compose restart backend` required after initial start.

**Phase to address:** Phase 1 (Build & Structure) — docker-compose.yml with health checks from the start.

---

### Pitfall 23: Environment Variables and Secrets Management

**What goes wrong:** Spring Boot needs database credentials, JWT secrets, Evolution API keys, Pagar.me API keys, and Google OAuth secrets. The prototype has zero configuration management. Teams either (a) hardcode values in `application.properties`, (b) commit `.env` files, or (c) have different config in dev vs prod with no tracking.

**Why it happens:** The prototype had no backend, so there was no configuration to manage. Spring Boot makes it easy to put values in `application.properties`, and git-secrets are often committed accidentally.

**Consequences:** Database credentials in git history. JWT secret that never rotates. Different values in different environments with no documentation. Production API keys in development Docker containers.

**Prevention:** (a) Use Spring Boot's `application-{profile}.properties` for environment-specific config (`application-dev.properties`, `application-prod.properties`). (b) All secrets come from environment variables: `${DB_PASSWORD}`, `${JWT_SECRET}`, etc. (c) Create a `.env.example` file (committed) with placeholder values, never commit `.env`. (d) Use Docker secrets or environment variables in compose, not hardcoded values. (e) Vite uses `VITE_` prefix for frontend env vars.

**Detection:** `application.properties` containing actual passwords/API keys (not placeholders). `.env` file in git. Hardcoded URLs pointing to production services in development code.

**Phase to address:** Phase 1 (Build & Structure) — env configuration pattern from day 1. Phase 2 (Backend & Auth) — secrets management for JWT and DB.

---

### Pitfall 24: No Health Check Endpoint for Spring Boot

**What goes wrong:** Deploying Spring Boot to a VPS without a health check endpoint means: (a) Docker can't verify the app is healthy, (b) load balancers can't route around failures, (c) monitoring systems can't alert on downtime, (d) CI/CD can't verify deployment success.

**Why it happens:** It seems unnecessary for an MVP. The app either starts or it doesn't, right? Wrong — Spring Boot can start and still fail to connect to the database, or Evolution API can be unreachable.

**Consequences:** Silent failures where the app is "up" but non-functional. No automated way to detect degradation. Manual monitoring required.

**Prevention:** Use Spring Boot Actuator with `/actuator/health` endpoint. Configure it to include database connectivity, Evolution API reachability, and disk space checks. Expose this endpoint (with appropriate security) for Docker health checks and monitoring.

```yaml
# docker-compose.yml
backend:
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:8080/actuator/health"]
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 40s
```

**Detection:** No `/actuator/health` or equivalent endpoint. Docker health check missing for backend service. Monitoring that relies on "container is running" rather than "app is responding."

**Phase to address:** Phase 1 (Build & Structure) — add Actuator dependency and health endpoint. Phase 2 (Backend & Auth) — add custom health indicators for DB and Evolution API.

---

## Architecture Pitfalls

### Pitfall 25: API Design Without Contract-First Approach

**What goes wrong:** Building API endpoints ad-hoc as the frontend needs them, resulting in inconsistent URL patterns (`/patients` vs `/patient/list`), mixed response formats (`{ data: [...] }` vs bare arrays), and no API versioning. The frontend prototype has hardcoded mock data with specific shapes that become implicit API contracts.

**Why it happens:** The prototype defines data shapes in `data.jsx` (`PATIENTS`, `ANA`, `AGGREGATE`). These shapes have quirks (e.g., `macro` with `{ kcal: { target, actual } }` structure). Teams implement APIs that match these exact shapes without questioning if they're optimal.

**Consequences:** API changes break the frontend. No documentation. Inconsistent error handling. Can't version the API when breaking changes are needed. Mobile clients (planned for future) would be impossible to support.

**Prevention:** Define API contracts before implementation: (a) Create an OpenAPI/Swagger spec for all endpoints, (b) Use consistent URL patterns (`/api/v1/patients`, `/api/v1/patients/{id}`), (c) Standardize response envelope (`{ success: true, data: ..., errors: [] }`), (d) Define error response formats, (e) Don't blindly copy mock data shapes — redesign for the API context (e.g., patient list API should return a summary, not full patient object with all nested data).

**Detection:** Multiple URL patterns for similar resources. Different response shapes for similar endpoints. Frontend code that deeply navigates response objects (`data.patients[0].plan.meals[0].options[0].food`).

**Phase to address:** Phase 2 (Backend & Auth) — API design before implementation. Phase 3 (Data & Plans) — refine API contracts for clinical data.

---

### Pitfall 26: Missing Error Boundaries in React After Migration

**What goes wrong:** The current prototype has NO error boundaries — any component crash takes down the entire app. After migration to Vite+TS, this remains true. A single failed API call, a null reference in a chart, or a malformed data response crashes the whole dashboard.

**Why it happens:** Error boundaries feel like "error handling" which is often deferred. The prototype never had them because it used all mock data (never fails). With real API calls, failures become the norm.

**Consequences:** White screen of death. Users lose their place in the app. No graceful degradation. One broken chart kills the patient detail view entirely.

**Prevention:** Wrap each major view in a React Error Boundary. Create a reusable `<ErrorBoundary>` component with a friendly pt-BR fallback UI. Specifically protect: (a) chart components (SVG visualizations can crash on malformed data), (b) patient detail tabs (one tab failing shouldn't kill others), (c) modals (a failed modal shouldn't crash the list). Add global error handler for unhandled promise rejections (failed API calls).

**Detection:** Any `try/catch` that's missing in data access code. Components without error state handling. API call sites without `.catch()` or error state.

**Phase to address:** Phase 1 (Build & Structure) — create `ErrorBoundary` component. Phase 2+ — wrap each view with it.

---

### Pitfall 27: Monolithic Patient Data API Endpoint

**What goes wrong:** Creating a single `/api/patients/{id}` endpoint that returns the entire patient object with all nested data (plan, biometrics, timeline, insights, history). The prototype's `ANA` object contains everything in one structure, which worked because it was mock data in memory.

**Why it happens:** The prototype accesses `ANA` as a single object. It's natural to mirror this with a single API endpoint. The PatientView component expects all this data at once (5 tabs of content).

**Consequences:** Slow initial load (patient might have months of history). Over-fetching for simple views. Can't paginate timeline data. Wasted bandwidth on mobile. Backend memory pressure from loading full object graphs.

**Prevention:** Design granular endpoints: `/api/patients/{id}` (summary), `/api/patients/{id}/plan`, `/api/patients/{id}/biometry`, `/api/patients/{id}/timeline?page=1&limit=20`. Load tab data lazily — only fetch when the tab is active. Keep the summary endpoint lightweight (name, status, macro targets, last check-in date).

**Detection:** A single endpoint returning >50KB of JSON. Patient detail page taking >2 seconds to load. Backend queries with >3 JOINs for a single request.

**Phase to address:** Phase 3 (Data & Plans) — API design for patient endpoints. Phase 4 — timeline pagination.

---

### Pitfall 28: Race Conditions in Concurrent Data Updates

**What goes wrong:** A nutritionist edits a patient's plan while the patient sends a WhatsApp message that updates the timeline. Two simultaneous updates on the same patient record can create conflicts: (a) lost updates (last-write-wins overwrites changes), (b) inconsistent state (plan references food IDs that were deleted), (c) stale reads (frontend shows old data after an update).

**Why it happens:** The prototype has no concurrent users (single user, single browser tab, all in memory). Real app has: nutritionist editing, AI writing meal logs, patient data updating, possibly multiple browser tabs.

**Consequences:** Nutritionist's plan edits silently overwritten by AI meal log update. Stale data shown after refresh. Plans referencing foods that were deleted.

**Prevention:** (a) Use optimistic locking with `@Version` on JPA entities. (b) For the plan editor, send the full plan state on save (not incremental patches). (c) Use WebSocket or SSE for real-time updates so the frontend stays in sync. (d) For meal log creation (from WhatsApp), use append-only operations — never modify existing plan entries from the AI side. (e) Consider event sourcing for plan changes.

**Detection:** `OptimisticLockingFailureException` in logs. User reports "my changes disappeared." Stale data shown after page navigation.

**Phase to address:** Phase 3 (Data & Plans) — optimistic locking on plan entities. Phase 4 (WhatsApp) — append-only meal logging.

---

## Scale Pitfalls

### Pitfall 29: WhatsApp Message Processing Blocking the Main Thread

**What goes wrong:** The AI meal analysis (even simple text parsing of "comi um pão com manteiga") runs synchronously in the webhook handler. While processing, the handler can't receive new messages. With 10+ concurrent patients messaging, messages queue up and responses take minutes.

**Why it happens:** Webhook endpoints are simple POST handlers. It's natural to do everything in the handler: receive message → parse food → query food catalog → calculate macros → update timeline → send response. Each step adds latency.

**Consequences:** Slow WhatsApp responses (patients expect <5 second replies). Timeouts on Evolution API webhook delivery. Messages processed out of order. Nutritionist dashboard shows stale data.

**Prevention:** Use async processing from the start: (a) Webhook handler only acknowledges receipt (returns 200 immediately), (b) Persist message to `incoming_message` table with status `pending`, (c) Background worker (or `@Async` in Spring) processes messages from the queue, (d) For AI processing, consider a dedicated processing service. (e) Use database as message queue initially (simpler than RabbitMQ/Kafka for MVP).

**Detection:** GET /actuator/health showing high request times. Evolution API webhook delivery timeouts. Response times >10 seconds for WhatsApp messages.

**Phase to address:** Phase 4 (WhatsApp & AI) — design webhook handler as thin acknowledgment layer from the start.

---

### Pitfall 30: Food Catalog Search Performance Without Indexing

**What goes wrong:** The food catalog starts with 17 items (from the prototype) but grows as nutritionists add portioned foods. If search is done with `LIKE '%term%'` queries on food name columns without proper indexing, it degrades as the catalog grows.

**Why it happens:** 17 items work fine with any query. Even 100 items is fast. The PostgreSQL sequential scan on a small table is imperceptible. But food catalogs can reach thousands of items, and `LIKE '%arroz%'` prevents index usage.

**Consequences:** Search latency grows linearly with catalog size. Nutritionists experience lag when adding foods to plans. Full-text Portuguese search doesn't handle accents (arroz vs arroz, pão vs pao).

**Prevention:** (a) Use PostgreSQL `GIN` index with `pg_trgm` extension for trigram search on food names. (b) Use `unaccent` extension for accent-insensitive Portuguese search. (c) Create a composite index on `(nutricionista_id, name)` for scoped search. (d) Consider a search optimization: pre-compute a `search_vector` column with `to_tsvector('portuguese', unaccent(name))`.

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE INDEX idx_food_name_trgm ON foods USING gin (name gin_trgm_ops);
```

**Detection:** Food search taking >500ms. Sequential scan in `EXPLAIN ANALYZE`. Nutritionists complaining about slow search.

**Phase to address:** Phase 3 (Data & Plans) — food catalog with proper indexing from the start.

---

### Pitfall 31: Frontend Bundle Size and Code Splitting

**What goes wrong:** The current prototype loads ALL code upfront (landing, login, signup, onboarding, dashboard, patient detail, food catalog, plans, insights). After migration, this becomes a single large JavaScript bundle. The landing page loads the entire dashboard code. The login page loads chart libraries.

**Why it happens:** Vite defaults produce a single bundle unless explicitly configured for code splitting. The prototype's 5600+ lines of JSX across 14 files become one chunk. No lazy loading was ever needed because everything was pre-loaded.

**Consequences:** Slow initial page load (>3 seconds). Poor Lighthouse performance. Wasted bandwidth loading dashboard code for users who never sign up (landing page visitors).

**Prevention:** Use `React.lazy()` + `Suspense` for route-level code splitting. Split by authentication boundary: unauthenticated chunk (landing, login, signup) vs authenticated chunk (dashboard, patient views). Use Vite's `build.rollupOptions.output.manualChunks` to separate vendor libraries (React, charts) from app code. Preload authenticated chunk after successful login.

**Detection:** Lighthouse Performance score <80. Initial JS bundle >300KB gzipped. First contentful paint >2 seconds.

**Phase to address:** Phase 1 (Build & Structure) — Vite configuration with code splitting. Phase 2+ — route-level lazy loading.

---

## Warning Signs Table

| # | Pitfall | Warning Sign | Detection Method |
|---|---------|-------------|-----------------|
| 1 | Big Bang Rewrite | No working build after 2+ sprints; `v2/` directory appearing | Sprint review with no deployable artifact |
| 2 | Window Globals Lingering | `Object.assign(window,` or `window.X` in new codebase | `grep -r "Object.assign(window"` in new project |
| 3 | Prop Drilling Context Confusion | Components receiving 5+ props; unused props like `showAISummary` | ESLint `no-unused-vars` rule; React DevTools prop inspection |
| 4 | Lost CSS Theme Tokens | Colors not matching original design; broken dark mode | Visual regression tests; screenshot comparison |
| 5 | Babel → Vite Build Errors | "X is not defined" runtime errors; circular import warnings | Build output warnings; browser console errors |
| 6 | Inline Style Performance | React Profiler showing >16ms frames; GC spikes during chart hover | Chrome DevTools Performance tab; React Profiler |
| 7 | External Font Loading | Network requests to `fonts.googleapis.com` in production | Network tab; CSP violation reports |
| 8 | Spring Security CORS/CSRF | 403 responses; browser console CORS errors; preflight failures | Browser DevTools Network tab; Spring Boot logs showing 403 |
| 9 | Missing Tenant Isolation | `SELECT * FROM patients` returning data from all nutricionistas | Integration test querying across nutricionista boundaries |
| 10 | N+1 Queries | >5 SQL queries for a single patients list page | Hibernate statistics logging; Spring Boot Actuator metrics |
| 11 | No CRN Validation | Signup accepting any string in CRN field | Test creating account with invalid CRN format |
| 12 | Shared WhatsApp Instance Breaking | Messages routed to wrong conversations at scale | Message routing errors in logs; wrong AI context in responses |
| 13 | Duplicate Webhook Processing | Duplicate rows in meal_log with same message_id | Database unique constraint violations; duplicate AI responses |
| 14 | WhatsApp Disconnection | `CONNECTION_UPDATE` webhook with state `close`; no messages received | Evolution API status endpoint; dashboard connection status |
| 15 | Media Messages Dropped | `messageType != "conversation"` with no processing logic | Webhook logs showing unhandled message types |
| 16 | Wrong Payment Gateway | Users asking for PIX; Stripe not supporting Brazilian PIX | Payment conversion rate below expectations |
| 17 | No Dunning Flow | Users with `status: "active"` but no successful payment in 30+ days | Database query: active subscriptions without recent successful payment |
| 18 | Float Monetary Values | `double` or `float` types on price/amount fields | Code review: entity fields with monetary types |
| 19 | Unencrypted Health Data | Patient health data in plaintext database columns | Database audit; missing pgcrypto or column-level encryption |
| 20 | Invalid Consent | Single "I agree" checkbox with no consent record table | No `consent_record` table in schema; `href="#"` terms links |
| 21 | No Deletion/Anonymization Strategy | Direct `DELETE FROM` with no soft delete or anonymization | No `deleted_at` column; no anonymization utility |
| 22 | No Docker Health Checks | `docker compose up` fails intermittently; manual restart needed | Docker Compose file without `healthcheck` keys |
| 23 | Secrets in Code | `.env` committed to git; `application.properties` with real passwords | `git diff --cached` showing secrets; `.gitignore` missing `.env` |
| 24 | No Health Endpoint | No `/actuator/health` or equivalent endpoint | Spring Boot Actuator not in `pom.xml` dependencies |
| 25 | Inconsistent API Design | Different URL patterns for similar resources; no API versioning | API spec review; varying response shapes across endpoints |
| 26 | No Error Boundaries | Entire app crashes on one component error | Error in one chart killing the whole patient view |
| 27 | Monolithic Patient API | Single endpoint returning >50KB JSON | API response size monitoring; slow patient detail page |
| 28 | Concurrent Update Conflicts | `OptimisticLockingFailureException` in logs | User reports of "my changes disappeared" |
| 29 | Blocking Message Processing | WhatsApp responses taking >10 seconds | `/actuator/health` showing high response times; webhook timeouts |
| 30 | Slow Food Search | `LIKE '%term%'` queries without GIN index | `EXPLAIN ANALYZE` showing sequential scans; >500ms search latency |
| 31 | No Code Splitting | Single JS bundle >300KB gzipped | Lighthouse Performance <80; LCP >2s |

---

## Prevention Strategies by Phase

| # | Pitfall | Prevention | Phase to Address |
|---|---------|------------|-----------------|
| 1 | Big Bang Rewrite | Migrate all 14 JSX files in one coordinated sprint to Vite; preserve UI 100% | Phase 1: Build & Structure |
| 2 | Window Globals | Convert ALL `window.X` to ES `import`/`export` in single pass; never hybrid | Phase 1: Build & Structure |
| 3 | Prop Drilling Chaos | Map all prop dependencies before migration; design Context boundaries by read patterns | Phase 1: Build & Structure |
| 4 | Lost CSS Theme Tokens | Map all CSS custom properties to Tailwind config FIRST; self-host fonts | Phase 1: Build & Structure |
| 5 | Babel → Vite Build Errors | Create dependency graph before migration; add export/import per file systematically | Phase 1: Build & Structure |
| 6 | Inline Style Performance | Extract repeated inline styles to Tailwind classes; memoize style objects in charts | Phase 1: Build & Structure |
| 7 | External Font Loading | Download and self-host all 3 font families; remove Google Fonts CDN links | Phase 1: Build & Structure |
| 22 | No Docker Health Checks | Configure health checks in docker-compose.yml for all services | Phase 1: Build & Structure |
| 23 | Secrets in Code | Set up `.env.example` pattern; Spring profiles; never commit secrets | Phase 1: Build & Structure |
| 26 | No Error Boundaries | Create reusable `ErrorBoundary` component; wrap each major view | Phase 1: Build & Structure |
| 31 | No Code Splitting | Configure Vite with route-level lazy loading; split auth vs authenticated chunks | Phase 1: Build & Structure |
| 8 | Spring Security CORS/CSRF | Configure JWT stateless auth, CORS, and CSRF-free API from day 1 | Phase 2: Backend & Auth |
| 9 | Missing Tenant Isolation | Design every entity with `nutricionista_id`; add RLS policies | Phase 2: Backend & Auth |
| 11 | No CRN Validation | Validate CRN format on signup; store CRN as registration field | Phase 2: Backend & Auth |
| 18 | Float Monetary Values | Use integer centavos everywhere; BigDecimal in Java; no float/double for money | Phase 2: Backend & Auth |
| 19 | Unencrypted Health Data | Use pgcrypto or column-level encryption for health data fields | Phase 2: Backend & Auth |
| 20 | Invalid Consent | Build `ConsentRecord` table; separate consent types; version terms documents | Phase 2: Backend & Auth |
| 24 | No Health Endpoint | Add Spring Boot Actuator; custom health indicators for DB and Evolution API | Phase 2: Backend & Auth |
| 25 | Inconsistent API Design | Define OpenAPI spec before coding; consistent URL patterns and envelopes | Phase 2: Backend & Auth |
| 10 | N+1 Queries | Use `@EntityGraph`, DTO projections, and JOIN FETCH for known access patterns | Phase 3: Data & Plans |
| 27 | Monolithic Patient API | Design granular endpoints; lazy-load tab data; summary endpoint separate | Phase 3: Data & Plans |
| 28 | Concurrent Update Conflicts | Add `@Version` for optimistic locking; append-only meal logging from AI | Phase 3: Data & Plans |
| 30 | Slow Food Search | Add pg_trgm and unaccent indexes from day 1; use GIN index on food name | Phase 3: Data & Plans |
| 12 | Shared WhatsApp Instance | Architect for per-nutricionista instances even if starting single-instance | Phase 4: WhatsApp & AI |
| 13 | Duplicate Webhook Processing | Deduplicate by `message.key.id`; return 200 immediately; process async | Phase 4: WhatsApp & AI |
| 14 | WhatsApp Disconnection | Monitor CONNECTION_UPDATE webhooks; auto-restart; dashboard status indicator | Phase 4: WhatsApp & AI |
| 15 | Media Messages Dropped | Handle imageMessage, audioMessage, documentMessage from day 1 | Phase 4: WhatsApp & AI |
| 29 | Blocking Message Processing | Thin webhook handler (acknowledge only); async queue for processing | Phase 4: WhatsApp & AI |
| 16 | Wrong Payment Gateway | Use Pagar.me (not Stripe) for Brazilian payments including PIX and boleto | Phase 5: Payments |
| 17 | No Dunning Flow | Design 3-day grace period, retry schedule, notification emails, suspension flow | Phase 5: Payments |
| 21 | No Deletion Strategy | Implement soft delete with `deleted_at`; anonymization utility; export feature | Phase 6: LGPD Compliance |

---

*Pitfalls research: 2026-04-19*