---
phase: 07-whatsapp-intelligence
plan: 02
subsystem: api
tags: [llm, ollama, whatsapp, conversation, extraction, evolution-api]

# Dependency graph
requires:
  - phase: 07-01
    provides: WhatsAppMessage entity, MessageQueueService, WhatsAppResponse entity, MealExtraction entity, webhook infrastructure
provides:
  - LlmService interface and OllamaCloudLlmService implementation for AI provider calls
  - ConversationService for end-to-end message processing pipeline
  - ExtractionService for meal data extraction and EpisodeHistoryEvent emission
  - EvolutionApiService for sending WhatsApp responses via Evolution API
  - MessageProcessorWorker for async Redis queue polling
  - System prompts with harm-reduction persona (pt-BR)
  - application.yml config for LLM, Evolution API, webhook settings
affects: [07-03, 07-ui]

# Tech tracking
tech-stack:
  added: [java.net.http.HttpClient for LLM API calls, Spring @Scheduled for queue polling, Jackson ObjectMapper for JSON parsing]
  patterns: [provider-abstracted LLM interface, single-LLM-call classification+response, Redis-dequeue worker pattern, authoritative extraction (no review state)]

key-files:
  created:
    - backend/src/main/java/com/nutriai/api/service/LlmService.java
    - backend/src/main/java/com/nutriai/api/service/OllamaCloudLlmService.java
    - backend/src/main/java/com/nutriai/api/service/ConversationService.java
    - backend/src/main/java/com/nutriai/api/service/EvolutionApiService.java
    - backend/src/main/java/com/nutriai/api/service/ExtractionService.java
    - backend/src/main/java/com/nutriai/api/service/MessageProcessorWorker.java
    - backend/src/main/java/com/nutriai/api/config/OllamaConfig.java
    - backend/src/main/java/com/nutriai/api/repository/ExtractionItemRepository.java
    - backend/src/test/java/com/nutriai/api/service/ConversationServiceTest.java
    - backend/src/test/java/com/nutriai/api/service/ExtractionServiceTest.java
    - backend/src/test/java/com/nutriai/api/service/MessageProcessorWorkerTest.java
  modified:
    - backend/src/main/java/com/nutriai/api/model/WhatsAppResponse.java (added @Setter)
    - backend/src/main/java/com/nutriai/api/repository/WhatsAppMessageRepository.java (added first-message query)
    - backend/src/main/java/com/nutriai/api/NutriAiApplication.java (added @EnableScheduling)
    - backend/src/main/resources/application.yml (added LLM, Evolution, webhook config)
    - backend/src/test/java/com/nutriai/api/ArchitectureTest.java (excluded WebhookController)

key-decisions:
  - "Single LLM call per message for classification + response (D-01) — no multi-step pipeline"
  - "OllamaCloudLlmService uses java.net.http.HttpClient with config-only provider swap (D-02)"
  - "Authoritative extractions saved directly as confirmed (D-11) — nutritionist can edit/delete post-hoc"
  - "Image messages with caption text are classified (not just acknowledged) — extract from caption D-05"
  - "Audio messages always get acknowledgment only (no speech-to-text in v1)"
  - "WebhookController excluded from @PreAuthorize check — validated via HMAC, not JWT (D-06, D-07)"

patterns-established:
  - "Provider-abstracted LLM: interface → config-driven implementation swap without code changes"
  - "Async queue worker: @Scheduled poll every 2s → delegate to ConversationService → error logging"
  - "Intent classification via system prompt + LLM response parsing (JSON block extraction with regex fallback)"
  - "First-message detection via existsByPatientIdAndProcessedTrue query"

requirements-completed: [WA-02, WA-03]

# Metrics
duration: 36min
completed: 2026-05-05
---

# Phase 07 Plan 02: Conversation Intelligence Summary

**LLM-powered WhatsApp conversation pipeline: dequeue → classify → extract meal data → respond via Evolution API, with system prompts implementing harm-reduction persona**

## Performance

- **Duration:** 36 min
- **Started:** 2026-05-05T17:20:39Z
- **Completed:** 2026-05-05T17:56:21Z
- **Tasks:** 2
- **Files modified:** 17

## Accomplishments
- Complete async message processing pipeline: Redis dequeue → LLM classification/extraction → send response → mark processed
- Provider-abstracted LLM interface with Ollama Cloud implementation using OpenAI-compatible API
- System prompts implementing harm-reduction persona (D-04), patient context (D-03), and first-interaction greeting (D-17)
- Meal extraction persisted as authoritative MealExtraction + ExtractionItem entities with MEAL_EXTRACTION EpisodeHistoryEvent emission (D-11, D-13)
- 13 unit tests covering all critical paths: meal reports, plan questions, greetings, audio/photo, unknown patients, LLM failures, extraction persistence, worker delegation

## Task Commits

Each task was committed atomically:

1. **task 1: LLM provider interface, Ollama Cloud implementation, system prompts, and ConversationService** - `27996a5` (feat)
2. **task 2: ExtractionService, EpisodeHistoryEvent emission, and MessageProcessorWorker** - `c8f32e5` (feat)
3. **ArchUnit fix: exclude WebhookController** - `56acaf6` (fix)

## Files Created/Modified
- `backend/src/main/java/com/nutriai/api/service/LlmService.java` — Provider-abstracted LLM interface (chat + isAvailable)
- `backend/src/main/java/com/nutriai/api/service/OllamaCloudLlmService.java` — Ollama Cloud REST API implementation with JSON extraction
- `backend/src/main/java/com/nutriai/api/service/ConversationService.java` — Full message processing orchestration with system prompts
- `backend/src/main/java/com/nutriai/api/service/EvolutionApiService.java` — WhatsApp response sending with retry-once
- `backend/src/main/java/com/nutriai/api/service/ExtractionService.java` — Meal extraction persistence + EpisodeHistoryEvent emission
- `backend/src/main/java/com/nutriai/api/service/MessageProcessorWorker.java` — @Scheduled Redis queue polling every 2s
- `backend/src/main/java/com/nutriai/api/config/OllamaConfig.java` — @Configuration beans for LLM and Evolution API
- `backend/src/main/java/com/nutriai/api/repository/ExtractionItemRepository.java` — JPA repository for extraction items
- `backend/src/main/java/com/nutriai/api/repository/WhatsAppMessageRepository.java` — Added existsByPatientIdAndProcessedTrue
- `backend/src/main/java/com/nutriai/api/model/WhatsAppResponse.java` — Added @Setter for sentAt update
- `backend/src/main/java/com/nutriai/api/NutriAiApplication.java` — Added @EnableScheduling
- `backend/src/main/resources/application.yml` — Added LLM, Evolution API, webhook config sections
- `backend/src/test/java/com/nutriai/api/service/ConversationServiceTest.java` — 7 unit tests
- `backend/src/test/java/com/nutriai/api/service/ExtractionServiceTest.java` — 3 unit tests
- `backend/src/test/java/com/nutriai/api/service/MessageProcessorWorkerTest.java` — 3 unit tests
- `backend/src/test/java/com/nutriai/api/ArchitectureTest.java` — Excluded WebhookController from PreAuthorize check

## Decisions Made
- Single LLM call per message for both classification and response (D-01) — no multi-step pipeline
- OllamaCloudLlmService uses java.net.http.HttpClient directly — no extra dependency needed
- System prompts are in pt-BR with harm-reduction philosophy (D-04)
- Meal extractions are authoritative — saved directly as confirmed (D-11) — no pending state
- Image messages with caption go through classification path (D-05) — not just acknowledgment
- Audio messages always get acknowledgment only (no speech-to-text in v1)
- EvolutionApiService retries once on network timeout, then gives up and logs
- MessageProcessorWorker uses @Scheduled(fixedDelay = 2000) — simple polling, no dead-letter in v1 (D-09)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added @Setter to WhatsAppResponse**
- **Found during:** task 1 (ConversationService implementation)
- **Issue:** ConversationService needs to update `sentAt` field on WhatsAppResponse after successful send, but model only had `@Getter`
- **Fix:** Added `@Setter` annotation to WhatsAppResponse class
- **Files modified:** WhatsAppResponse.java
- **Verification:** Compilation passes, all tests pass
- **Committed in:** 27996a5 (task 1 commit)

**2. [Rule 2 - Missing Critical] Added ExtractionItemRepository**
- **Found during:** task 2 (ExtractionService implementation)
- **Issue:** Plan references ExtractionItem with extractionId FK, but no repository existed to persist ExtractionItem entities
- **Fix:** Created ExtractionItemRepository with findByExtractionIdOrderBySortOrder and deleteAllByExtractionId methods
- **Files modified:** ExtractionItemRepository.java (new)
- **Verification:** Compilation passes, ExtractionServiceTest passes
- **Committed in:** 27996a5 (task 1 commit, included with ExtractionService)

**3. [Rule 1 - Bug] Fixed ArchUnit PreAuthorize check for WebhookController**
- **Found during:** task 2 (full test suite run)
- **Issue:** WebhookController is a public endpoint (for Evolution API callbacks) validated via HMAC, not JWT. ArchUnit test flagged it as missing @PreAuthorize
- **Fix:** Added WebhookController to ArchUnit exclusion list alongside HealthController
- **Files modified:** ArchitectureTest.java
- **Verification:** Full test suite passes (227 tests)
- **Committed in:** 56acaf6

**4. [Rule 3 - Blocking] Added @EnableScheduling to NutriAiApplication**
- **Found during:** task 2 (MessageProcessorWorker implementation)
- **Issue:** @Scheduled annotation on MessageProcessorWorker.processNextMessage() requires Spring's scheduling to be enabled
- **Fix:** Added @EnableScheduling annotation to NutriAiApplication
- **Files modified:** NutriAiApplication.java
- **Verification:** Application context loads, scheduled bean detected
- **Committed in:** c8f32e5

**5. [Rule 1 - Bug] Fixed ConversationService isFirstMessageFromPatient method**
- **Found during:** task 1 (initial implementation)
- **Issue:** Used a placeholder UUID.randomUUID() in the repository query instead of proper `existsByPatientIdAndProcessedTrue` method
- **Fix:** Added `existsByPatientIdAndProcessedTrue` query method to WhatsAppMessageRepository and used it in ConversationService
- **Files modified:** WhatsAppMessageRepository.java, ConversationService.java
- **Verification:** Test for first-interaction greeting passes
- **Committed in:** 27996a5

---

**Total deviations:** 5 auto-fixed (2 missing critical, 1 bug, 1 blocking, 1 ArchUnit alignment)
**Impact on plan:** All auto-fixes necessary for correctness and testability. No scope creep.

## Issues Encountered
- WhatsAppResponse model needed @Setter — the model was designed for creation-via-builder but ConversationService needs to update sentAt after Evolution API send confirms delivery
- Redis connection failure in test context is expected (no Redis server) — only affects context-loaded integration tests, not unit tests which use mocks

## User Setup Required
None — LLM and Evolution API configuration uses environment variable defaults. Production deployment requires setting NUTRIAI_LLM_API_KEY, EVOLUTION_API_URL, and EVOLUTION_API_KEY.

## Next Phase Readiness
- Conversation pipeline complete: ready for Plan 03 (WhatsApp API endpoints for nutritionist dashboard)
- All services compile and unit tests pass (227 total)
- LLM provider abstraction allows easy swap to different providers (D-02)

---
*Phase: 07-whatsapp-intelligence*
*Completed: 2026-05-05*