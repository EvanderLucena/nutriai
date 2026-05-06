---
phase: 07-whatsapp-intelligence
fixed_at: 2026-05-05T00:00:00Z
review_path: .planning/phases/07-whatsapp-intelligence/07-REVIEW.md
iteration: 1
findings_in_scope: 8
fixed: 8
skipped: 0
status: all_fixed
---

# Phase 07: Code Review Fix Report

**Fixed at:** 2026-05-05
**Source review:** `.planning/phases/07-whatsapp-intelligence/07-REVIEW.md`
**Iteration:** 1

**Summary:**
- Findings in scope: 8
- Fixed: 8
- Skipped: 0

## Fixed Issues

### WR-02: Missing `@Valid` on `PatchExtractionRequest` request body

**Files modified:** `backend/src/main/java/com/nutriai/api/controller/WhatsAppIntelligenceController.java`, `backend/src/main/java/com/nutriai/api/dto/whatsapp/PatchExtractionRequest.java`
**Commit:** `9fa0534`
**Applied fix:** Added `@Valid` annotation to the `@RequestBody PatchExtractionRequest request` parameter in `correctExtraction` method. Added `@NotBlank`, `@NotNull`, and `@PositiveOrZero` validation annotations to all fields in `PatchExtractionItem` (name, kcal, prot, carb, fat, grams).

### WR-03: Unsafe `String.formatted()` with user-controlled names in LLM prompts

**Files modified:** `backend/src/main/java/com/nutriai/api/service/ConversationService.java`
**Commit:** `5f67f65`
**Applied fix:** Replaced `String.formatted()` with `String.replace()` using `{{placeholder}}` syntax in all 4 prompt builders (`buildGreetingPrompt`, `buildAcknowledgmentPrompt`, `buildClassifyingPrompt`, `buildClassifyingPromptWithImageAck`). Added a private `escape(String)` helper that escapes curly braces to prevent accidental placeholder injection from user data.

### WR-01: E2E test expects incorrect WhatsApp activation link phone number

**Files modified:** `frontend/e2e/whatsapp-intelligence.spec.ts`
**Commit:** `971479d`
**Applied fix:** Changed regex from `/wa\.me\/551199987766/` (12 digits) to `/wa\.me\/5511999887766/` (13 digits) to match the actual backend output for phone `11999887766`.

### WR-04: Defense-in-depth tenant isolation gap in `MealExtractionRepository`

**Files modified:** `backend/src/main/java/com/nutriai/api/repository/MealExtractionRepository.java`, `backend/src/main/java/com/nutriai/api/service/WhatsAppIntelligenceService.java`
**Commit:** `f859c7b`
**Applied fix:** Added `findByIdAndPatientIdAndNutritionistId(UUID id, UUID patientId, UUID nutritionistId)` to `MealExtractionRepository`. Updated `WhatsAppIntelligenceService.correctExtraction()` to use the nutritionist-scoped query instead of `findByIdAndPatientId`.

### WR-07: `Timeline` uses array index as React key, causing editor misalignment

**Files modified:** `frontend/src/components/patient/Timeline.tsx`
**Commit:** `723ef94`
**Applied fix:** Changed React `key` from array index `i` to stable unique identifier `ev.extractionId ?? `${ev.time}-${ev.meal}``. Changed `editing` state from `number | null` (index-based) to `string | null` (key-based). Also updated item keys inside `ev.items.map` to use `${key}-item-${j}`.

### WR-08: `WhatsAppActivationRow` conflates API errors with missing phone

**Files modified:** `frontend/src/components/patient/WhatsAppActivationRow.tsx`
**Commit:** `0b56f33`
**Applied fix:** Extracted `error` from `useActivationLink` hook. Added logic to inspect the error response status code: if `status === 400`, shows "Número não cadastrado" UI; otherwise shows generic error message "Erro ao carregar link. Tente novamente." with coral-colored icon.

### WR-06: Docker Compose missing backend environment variable propagation

**Files modified:** `docker/docker-compose.yml`
**Commit:** `f129216`
**Applied fix:** Added 5 missing environment variables to the `backend` service block: `EVOLUTION_API_KEY`, `NUTRIAI_LLM_API_KEY`, `NUTRIAI_LLM_BASE_URL`, `NUTRIAI_LLM_MODEL`, `NUTRIAI_WEBHOOK_SECRET` — all with sensible defaults using `${VAR:-default}` syntax.

### WR-05: Failed messages are never retried and remain unprocessed forever

**Files modified:** `backend/src/main/java/com/nutriai/api/model/WhatsAppMessage.java`, `backend/src/main/java/com/nutriai/api/repository/WhatsAppMessageRepository.java`, `backend/src/main/java/com/nutriai/api/service/MessageProcessorWorker.java`, `backend/src/main/resources/db/migration/V19__add_retry_count_to_whatsapp_message.sql`
**Commit:** `eed1712`
**Applied fix:**
- Added `retryCount` field (default 0) to `WhatsAppMessage` entity with `@Column(name="retry_count")`.
- Created Flyway migration `V19` adding `retry_count` column and index `idx_wa_message_retry` on `(processed, retry_count)`.
- Updated `MessageProcessorWorker`:
  - Injected `WhatsAppMessageRepository`.
  - On exception: increments `retryCount`, clears `processedAt`, saves message, logs with retry count.
  - Skips messages where `retryCount >= 3` (MAX_RETRIES).
  - Added new `@Scheduled(fixedDelay = 30000)` method `requeueFailedMessages()` that finds `processed=false AND retryCount < 3` messages older than 1 minute and re-enqueues them.
- Added `findByProcessedFalseAndRetryCountLessThanOrderByCreatedAtAsc` to `WhatsAppMessageRepository`.

## Skipped Issues

None — all findings were fixed.

---

_Fixed: 2026-05-05_
_Fixer: OpenCode (gsd-code-fixer)_
_Iteration: 1_
