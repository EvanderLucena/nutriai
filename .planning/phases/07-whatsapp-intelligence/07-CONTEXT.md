# Phase 7: WhatsApp Intelligence - Context

**Gathered:** 2026-04-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Patients interact with AI via WhatsApp and nutritionists see extracted meal data in the patient timeline. This phase delivers: Evolution API integration (send/receive WhatsApp messages), webhook endpoint for incoming messages, AI-based meal extraction and response generation using LLM, unique WhatsApp activation link per patient, shared number architecture (1 number serving all nutritionists' patients), and patient timeline populated with WhatsApp-captured meal data. WhatsApp conversation history view (raw messages) is NOT in scope — nutritionists see only extracted data.

</domain>

<decisions>
## Implementation Decisions

### AI Integration (Extraction + Response)
- **D-01:** Single LLM call per message — the model both classifies intent (question vs. meal report vs. misc) and responds or extracts in one pass. No multi-step pipeline.
- **D-02:** Ollama Cloud as the initial LLM provider (same ecosystem as AI reviewer), but the architecture MUST abstract the provider behind an interface so migration to another provider (OpenAI, Claude, etc.) requires config changes only, not code changes.
- **D-03:** Full meal plan context is sent to the LLM only when the patient asks about the plan. For meal reports, the context is minimal (patient objective, extras list, harm-reduction guidelines). The LLM should NOT enforce the plan rigidly.
- **D-04:** IA persona: auxiliador humano, harm reduction, dieta flexível. If the patient reports eating something not in the plan, the IA does not reprehend — it asks about quantity, suggests less fatty preparation, advises avoiding heavy sauces, etc. These principles must be embedded in the system prompt.
- **D-05:** The LLM extracts structured meal data (food items, estimated quantities, estimated macros) from text messages. Audio and photo messages receive an acknowledgment response ("Recebi sua foto! Vou registrar o que você me contou") and extract from any accompanying text.

### Webhook Architecture
- **D-06:** Single public webhook endpoint at `/api/v1/webhooks/whatsapp` — no `@PreAuthorize` (exception to the rule). All Evolution API instances send webhooks to the same URL.
- **D-07:** HMAC signature validation on incoming webhook payloads. Shared secret between backend and Evolution API. Reject and log invalid signatures.
- **D-08:** Async processing from day one: webhook receives → validates → persists message → enqueues to Redis/RabbitMQ → responds 200 immediately → worker dequeues → processes IA (extract + respond) → sends response via Evolution API send-message endpoint.
- **D-09:** Redis as the queue backend (simpler than RabbitMQ for this scale, also useful for caching later). The queue and worker infrastructure must be abstracted so the provider can be swapped.

### Data Model: Messages & Extractions
- **D-10:** Dedicated database tables — NOT reusing EpisodeHistoryEvent for WhatsApp data. New entities: `WhatsAppMessage` (inbound messages), `WhatsAppResponse` (outbound AI responses), `MealExtraction` (extracted meal entries with food items and macros).
- **D-11:** Extraction is authoritative — extracted meal data is saved directly to the patient's timeline as confirmed. No pending/review state. The nutritionist can edit or delete any extraction post-hoc.
- **D-12:** Nutritionist correction flow: click "Corrigir extração" on a timeline event → ExtractionEditor opens (already exists in frontend) → edit items/macros → save → PATCH endpoint updates the MealExtraction record.
- **D-13:** Each extracted meal generates an EpisodeHistoryEvent (eventType = `MEAL_EXTRACTION`) for the episode history feed. This maintains consistency with the Phase 6 history model.
- **D-14:** Messages and responses are linked to patient via `patient_id` AND `nutritionist_id` (tenant isolation). Phone number matching uses normalized Brazilian format: strip `+55`, keep DDD + number.

### Activation & Patient Experience
- **D-15:** Activation link per patient — format: `wa.me/55{DDD}{number}?text=Oi`. The link is a convenience, not authentication. The nutritionist generates it from the patient page using the pre-registered Patient.whatsapp.
- **D-16:** Authentication is phone-number-based. The backend ONLY responds via IA if the sender's WhatsApp number matches Patient.whatsapp for an active patient. Unknown numbers get either no response or a generic "não reconhecido" message (implementer's choice based on spam risk).
- **D-17:** First interaction: patient sends any message → IA responds with a contextual greeting using the patient's name and a warm introduction. Example tone: "Oi Ana! Sou o assistente virtual da nutri [Nome]. Tô aqui pra te ajudar com as refeições, tirar dúvidas sobre o plano, e acompanhar como você tá se sentindo."
- **D-18:** Nutritionist sees only extracted meal data in the patient timeline (Today tab). Raw WhatsApp conversations are NOT visible to the nutritionist in v1. This preserves the product principle: "nutricionista vê resultados, não conversas."

### Frontend: Views & Components
- **D-19:** The Today tab timeline in PatientView connects to real meal extraction data via a new API endpoint. The current `timeline: []` hardcode is replaced.
- **D-20:** A new "Ativação WhatsApp" section or button in PatientView (or patient card) lets the nutritionist copy/generate the activation link for that patient. Visual indicator shows whether the patient has activated WhatsApp (has sent at least 1 message).
- **D-21:** The ExtractionEditor component is wired to a real PATCH endpoint for saving corrections.
- **D-22:** WhatsApp-derived dashboard activity (the KPI and activity card removed in Phase 6 D-01) is restored in the dashboard with real data from WhatsApp messages and extractions.

### API Endpoints
- **D-23:** New backend endpoints:
  - `POST /api/v1/webhooks/whatsapp` — receive Evolution API webhooks (public, HMAC-protected)
  - `GET /api/v1/patients/{id}/extractions` — list extracted meals for today (for timeline)
  - `PATCH /api/v1/patients/{id}/extractions/{extractionId}` — correct extraction data
  - `GET /api/v1/patients/{id}/activation-link` — generate/copy WhatsApp activation link
  - `GET /api/v1/whatsapp/status` — WhatsApp instance health/connection status

### OpenCode's Discretion
- Exact entity/table schemas for WhatsAppMessage, WhatsAppResponse, MealExtraction (column types, indexes, Flyway migration number)
- LLM prompt engineering (system prompt structure, context assembly, output format specification for extraction)
- Evolution API Docker Compose service configuration (env vars, volumes, network setup)
- Redis queue implementation details (@Async vs. explicit worker, retry strategy, dead-letter handling)
- HMAC signature verification implementation
- Phone number normalization and matching logic
- Activation link UI placement and design details
- What "no response" vs. "generic response" to send unknown numbers
- Dashboard WhatsApp KPI composition (which metrics to show from real data)
- Whether audio/photo messages need special handling beyond text acknowledgment
- Error recovery when Evolution API send-message fails (retry, logging, notification)
- Exact TypeScript types for new API payloads

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project requirements
- `.planning/REQUIREMENTS.md` — WA-01, WA-02, WA-03, WA-04, WA-05 are the requirements for this phase
- `.planning/ROADMAP.md` §Phase 7 — Success criteria, test expectations, phase boundary
- `.planning/PROJECT.md` — WhatsApp principles (harm reduction, flexible diet, nutritionist sees results not conversations), Evolution API as gateway, shared number architecture, tech stack constraints

### Prior phase context
- `.planning/phases/01-monorepo-infrastructure/01-CONTEXT.md` — Architecture: layered Spring Boot, `/api/v1/` prefix, Flyway migrations, Zustand + TanStack Query
- `.planning/phases/04-patient-management/04-CONTEXT.md` — Episode model, manual patient status, data isolation by nutritionist_id, phone fields (Patient.whatsapp, Nutritionist.whatsapp)
- `.planning/phases/05-meal-plans-food-catalog/05-CONTEXT.md` — Meal plan structure (meals, options, foods, macros), extras as harm-reduction context, plans auto-created per episode
- `.planning/phases/06-dashboard-biometry/06-CONTEXT.md` — EpisodeHistoryEvent (varchar eventType), history snapshots, dashboard WhatsApp block intentionally removed, TimelineEventDTO types

### Existing frontend code
- `frontend/src/components/patient/Timeline.tsx` — Timeline component with empty state, "Corrigir extração" toggle — wire to real API
- `frontend/src/components/patient/ExtractionEditor.tsx` — Inline editor for correcting extracted meal data — needs PATCH endpoint
- `frontend/src/components/icons/index.tsx` §IconWhatsapp — WhatsApp icon available for UI
- `frontend/src/views/PatientView.tsx` — TodayTab with timeline section, patient object construction (timeline: [] to be replaced)
- `frontend/src/api/` — Existing API modules (client.ts with JWT interceptor, patients.ts, plans.ts, foods.ts, biometry.ts, dashboard.ts)
- `frontend/src/stores/` — Existing stores (authStore, patientStore, planStore, foodStore, clinicalStore, navigationStore, toastStore, themeStore)

### Existing backend code
- `backend/src/main/java/com/nutriai/api/model/EpisodeHistoryEvent.java` — Event model with varchar eventType (50), metadataJson TEXT — pattern for emitting history events from WhatsApp extraction
- `backend/src/main/java/com/nutriai/api/model/Patient.java` — Patient entity with `whatsapp` field (length 30)
- `backend/src/main/java/com/nutriai/api/model/Nutritionist.java` — Nutritionist entity with `whatsapp` field
- `backend/src/main/java/com/nutriai/api/auth/NutritionistAccess.java` — getCurrentNutritionistId() for tenant isolation
- `backend/src/main/java/com/nutriai/api/controller/` — Existing controllers (PatientController, PlanController, BiometryController, FoodController, DashboardController, HealthController) — patterns to follow
- `backend/src/main/resources/db/migration/` — Flyway migrations V1-V13 (next migration for WhatsApp tables)
- `backend/src/main/java/com/nutriai/api/dto/ApiResponse.java` — Standard API envelope: `{ success, data: {...} }`

### Docker / Infrastructure
- `docker/docker-compose.yml` — Current services: postgres, backend, frontend. Evolution API and Redis need to be added.
- `docker/docker-compose.dev.yml` — Dev overrides. Evolution API + Redis services needed.

### Codebase maps
- `.planning/codebase/INTEGRATIONS.md` — WhatsApp integration audit (conceptual only, zero implementation exists)
- `.planning/codebase/STRUCTURE.md` — File inventory, dependency graph, data model documentation
- `.planning/codebase/CONVENTIONS.md` — Naming, component, CSS, state management conventions

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `frontend/src/components/patient/Timeline.tsx` — Full timeline component with event rendering, macro display, empty state, and "Corrigir extração" toggle. Wire to real extraction data.
- `frontend/src/components/patient/ExtractionEditor.tsx` — Inline food item editor with live totals and cancel/save buttons. Needs PATCH endpoint wiring.
- `frontend/src/components/icons/index.tsx` (IconWhatsapp) — WhatsApp SVG icon ready for use in activation UI and status indicators.
- `frontend/src/views/PatientView.tsx` (TodayTab) — Timeline section scaffold with MacroRings, WeekBars, and the "Consumo reportado" card structure. WhatsApp static text already present.
- `frontend/src/api/client.ts` — Axios instance with JWT auth interceptor and 401 refresh queue. All new API modules reuse this.
- `backend/src/main/java/com/nutriai/api/model/EpisodeHistoryEvent.java` — Can emit `WHATSAPP_MESSAGE_RECEIVED`, `MEAL_EXTRACTION`, `AI_RESPONSE_SENT` events without schema changes (varchar eventType).
- `backend/src/main/java/com/nutriai/api/auth/NutritionistAccess.java` — getCurrentNutritionistId() utility for webhook→patient→nutritionist resolution.

### Established Patterns
- Zustand store + TanStack Query hooks pattern — ALL new stores must follow this
- Axios client with JWT interceptor — ALL new API calls use the existing `apiClient`
- Flyway versioned SQL migrations — next migration number for WhatsApp tables
- Spring Boot layered architecture: controller → service → repository → model
- Nutritionist-scoped data isolation via repository-level filtering (`findBy...NutritionistId`)
- Server-side pagination with page/size/total for list endpoints
- React Router v7 for client-side routing
- `@PreAuthorize("hasRole('NUTRITIONIST')")` on all controllers — webhook endpoint is the explicit exception

### Integration Points
- Webhook endpoint at `/api/v1/webhooks/whatsapp` — NEW public endpoint, no @PreAuthorize, separate security filter chain or permitAll
- Evolution API Docker Compose service — NEW service with `AUTHENTICATION_API_KEY`, webhook URL pointing to backend
- Redis Docker Compose service — NEW service for async message queue
- Frontend API module for extractions and activation links — NEW `extractions.ts` or extend `patients.ts`
- New Zustand + TanStack Query store for WhatsApp status and extractions — NEW `whatsappStore.ts`
- PatientView TodayTab timeline — replace hardcoded `timeline: []` with API fetch
- Dashboard HomeView — restore WhatsApp KPIs with real data (previously removed in Phase 6)
- EpisodeHistoryEvent emission — wire into extraction save flow
- Patient.whatsapp (already exists) — phone number matching against incoming webhook sender
- NutritionistAccess.getCurrentNutritionistId() — used in webhook handler to resolve tenant from phone number → patient → nutritionist lookup

</code_context>

<specifics>
## Specific Ideas

- IA persona is NOT a diet enforcer. Patient reports "carne cozida no almoço" not in the plan → IA asks about quantity, suggests less fatty cuts, avoid heavy sauce — never says "isso não está no seu plano"
- The LLM provider must be abstracted behind an interface. Start with Ollama Cloud, but swapping to another provider should be a config/properties change only
- Full plan context is expensive (tokens). Send it only when the patient asks something plan-specific. For meal reports, send only objective + extras list + harm-reduction guidelines
- Activation link is `wa.me` format — convenience shortcut, not auth. Real auth is phone number matching against Patient.whatsapp
- Redis is chosen over RabbitMQ for queue: simpler to operate, also useful as a caching layer for future phases
- Extraction is authoritative (saved directly as confirmed). Nutritionist can correct post-hoc via the existing ExtractionEditor UI
- Nutritionists see extractions on the timeline, not raw WhatsApp conversations. This matches the landing page promise: "resultados, não conversas"

</specifics>

<deferred>
## Deferred Ideas

- WhatsApp conversation history view for nutritionist (raw messages) — v2 feature (WA-06 in REQUIREMENTS.md)
- AI-generated weekly patient summary — v2 feature (WA-07)
- Manual nutritionist intervention in AI conversation — v2 feature (WA-08)
- Multi-instance Evolution API per nutritionist (dedicated instances) — evaluate after shared-number approach proven at scale
- Patient-initiated activation (patient sends message first without pre-registration) — defer; pre-registration required for v1
- Audio transcription for voice messages — defer; text acknowledgment only for v1, transcription is v2
- Photo analysis for food recognition — defer; text acknowledgment only for v1
- WebSocket/SSE for real-time WhatsApp message updates to frontend — defer; polling acceptable for v1
- Provider migration mechanism (hot-swap, A/B test) — defer; architecture prepared but migration is manual config change for now

### Reviewed Todos (not folded)
- No pending todos matched Phase 07 scope.

</deferred>

---

*Phase: 07-whatsapp-intelligence*
*Context gathered: 2026-04-30*
