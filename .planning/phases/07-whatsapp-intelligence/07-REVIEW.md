---
phase: 07-whatsapp-intelligence
reviewed: 2026-05-05T00:00:00Z
depth: standard
files_reviewed: 66
files_reviewed_list:
  - backend/build.gradle
  - backend/src/main/java/com/nutriai/api/NutriAiApplication.java
  - backend/src/main/java/com/nutriai/api/config/OllamaConfig.java
  - backend/src/main/java/com/nutriai/api/config/RedisConfig.java
  - backend/src/main/java/com/nutriai/api/config/SecurityConfig.java
  - backend/src/main/java/com/nutriai/api/config/WebhookSecurityConfig.java
  - backend/src/main/java/com/nutriai/api/controller/WebhookController.java
  - backend/src/main/java/com/nutriai/api/controller/WhatsAppIntelligenceController.java
  - backend/src/main/java/com/nutriai/api/dto/llm/ExtractionItemResult.java
  - backend/src/main/java/com/nutriai/api/dto/llm/ExtractionResult.java
  - backend/src/main/java/com/nutriai/api/dto/llm/LlmIntent.java
  - backend/src/main/java/com/nutriai/api/dto/llm/LlmRequest.java
  - backend/src/main/java/com/nutriai/api/dto/llm/LlmResponse.java
  - backend/src/main/java/com/nutriai/api/dto/whatsapp/ActivationLinkDTO.java
  - backend/src/main/java/com/nutriai/api/dto/whatsapp/ExtractionDTO.java
  - backend/src/main/java/com/nutriai/api/dto/whatsapp/ExtractionItemDTO.java
  - backend/src/main/java/com/nutriai/api/dto/whatsapp/PatchExtractionRequest.java
  - backend/src/main/java/com/nutriai/api/dto/whatsapp/WebhookMessageDTO.java
  - backend/src/main/java/com/nutriai/api/dto/whatsapp/WhatsAppStatusDTO.java
  - backend/src/main/java/com/nutriai/api/dto/whatsapp/WhatsAppWebhookDTO.java
  - backend/src/main/java/com/nutriai/api/model/EpisodeHistoryEvent.java
  - backend/src/main/java/com/nutriai/api/model/ExtractionItem.java
  - backend/src/main/java/com/nutriai/api/model/MealExtraction.java
  - backend/src/main/java/com/nutriai/api/model/WhatsAppMessage.java
  - backend/src/main/java/com/nutriai/api/model/WhatsAppResponse.java
  - backend/src/main/java/com/nutriai/api/repository/ExtractionItemRepository.java
  - backend/src/main/java/com/nutriai/api/repository/MealExtractionRepository.java
  - backend/src/main/java/com/nutriai/api/repository/PatientRepository.java
  - backend/src/main/java/com/nutriai/api/repository/WhatsAppMessageRepository.java
  - backend/src/main/java/com/nutriai/api/repository/WhatsAppResponseRepository.java
  - backend/src/main/java/com/nutriai/api/service/ConversationService.java
  - backend/src/main/java/com/nutriai/api/service/EvolutionApiService.java
  - backend/src/main/java/com/nutriai/api/service/ExtractionService.java
  - backend/src/main/java/com/nutriai/api/service/HmacVerificationService.java
  - backend/src/main/java/com/nutriai/api/service/LlmService.java
  - backend/src/main/java/com/nutriai/api/service/MessageProcessorWorker.java
  - backend/src/main/java/com/nutriai/api/service/MessageQueueService.java
  - backend/src/main/java/com/nutriai/api/service/OllamaCloudLlmService.java
  - backend/src/main/java/com/nutriai/api/service/PhoneNormalizationService.java
  - backend/src/main/java/com/nutriai/api/service/WebhookService.java
  - backend/src/main/java/com/nutriai/api/service/WhatsAppIntelligenceService.java
  - backend/src/main/resources/application.yml
  - backend/src/main/resources/db/migration/V18__create_whatsapp_tables.sql
  - backend/src/test/java/com/nutriai/api/ArchitectureTest.java
  - backend/src/test/java/com/nutriai/api/controller/WebhookControllerTest.java
  - backend/src/test/java/com/nutriai/api/controller/WhatsAppIntelligenceControllerTest.java
  - backend/src/test/java/com/nutriai/api/service/ConversationServiceTest.java
  - backend/src/test/java/com/nutriai/api/service/ExtractionServiceTest.java
  - backend/src/test/java/com/nutriai/api/service/HmacVerificationServiceTest.java
  - backend/src/test/java/com/nutriai/api/service/MessageProcessorWorkerTest.java
  - backend/src/test/java/com/nutriai/api/service/PhoneNormalizationServiceTest.java
  - backend/src/test/java/com/nutriai/api/service/WebhookServiceTest.java
  - frontend/e2e/whatsapp-intelligence.spec.ts
  - frontend/src/api/whatsapp.ts
  - frontend/src/components/patient/ExtractionEditor.tsx
  - frontend/src/components/patient/Timeline.tsx
  - frontend/src/components/patient/WhatsAppActivationModal.tsx
  - frontend/src/components/patient/WhatsAppActivationRow.tsx
  - frontend/src/components/patient/index.ts
  - frontend/src/stores/whatsappStore.test.ts
  - frontend/src/stores/whatsappStore.ts
  - frontend/src/types/whatsapp.ts
  - frontend/src/views/HomeView.tsx
  - frontend/src/views/PatientView.tsx
  - docker/docker-compose.yml
  - docker/docker-compose.dev.yml
findings:
  critical: 0
  warning: 8
  info: 8
  total: 16
status: issues_found
---

# Phase 07: Code Review Report

**Reviewed:** 2026-05-05
**Depth:** standard
**Files Reviewed:** 66
**Status:** issues_found

## Summary

This review covered the WhatsApp Intelligence phase (Phase 07), including backend controllers, services, repositories, DTOs, entities, migrations, frontend components/stores, E2E tests, and Docker configuration. Overall, the code follows project conventions: tenant isolation via `nutritionistId` is present in authenticated endpoints, the webhook uses HMAC verification, and the async pipeline (webhook → queue → worker → LLM → Evolution API) is correctly decoupled. However, several issues were found: an E2E test with an incorrect assertion that will fail, missing input validation on extraction correction, unsafe string formatting with user-controlled data, a tenant-isolation gap in one repository query, failed messages that are never retried, missing Docker env var propagation, and React key/index issues that can cause UI misalignment during editing.

## Critical Issues

No critical issues found.

## Warnings

### WR-01: E2E test expects incorrect WhatsApp activation link phone number

**File:** `frontend/e2e/whatsapp-intelligence.spec.ts:47`
**Issue:** The regex expects `wa.me/551199987766` (12 digits) but the backend produces `wa.me/5511999887766` (13 digits) for patient whatsapp `11999887766`. This assertion will always fail.
**Fix:**
```typescript
expect(body.data.link).toMatch(/wa\.me\/5511999887766/);
```

### WR-02: Missing `@Valid` on `PatchExtractionRequest` request body

**File:** `backend/src/main/java/com/nutriai/api/controller/WhatsAppIntelligenceController.java:48`
**Issue:** The `@RequestBody PatchExtractionRequest request` parameter lacks `@Valid`. While the record constructor defensively copies the list, nested `PatchExtractionItem` fields (e.g., `name`) are not validated. A `null` name can propagate to JPA and cause a `ConstraintViolationException` / 500 instead of a clean 400 Bad Request.
**Fix:**
```java
public ResponseEntity<ApiResponse<ExtractionDTO>> correctExtraction(
        @PathVariable UUID patientId,
        @PathVariable UUID extractionId,
        @Valid @RequestBody PatchExtractionRequest request) {
```
And add validation annotations to `PatchExtractionItem`:
```java
public record PatchExtractionItem(
    @NotBlank String name,
    @NotNull @PositiveOrZero BigDecimal kcal,
    ...
) {}
```

### WR-03: Unsafe `String.formatted()` with user-controlled names in LLM prompts

**File:** `backend/src/main/java/com/nutriai/api/service/ConversationService.java:224,238,280,412`
**Issue:** `buildGreetingPrompt`, `buildAcknowledgmentPrompt`, `buildClassifyingPrompt`, and `buildClassifyingPromptWithImageAck` all use `String.formatted()` with patient/nutritionist names. If a name contains `%` format specifiers (e.g., `João %s Silva`), `formatted()` throws `IllegalFormatException`, crashing message processing for that patient.
**Fix:** Use `String.replace` with placeholders instead of `formatted()`:
```java
String prompt = GREETING_TEMPLATE
    .replace("{{patientName}}", escape(patientName))
    .replace("{{nutritionistName}}", escape(nutritionistName));
```

### WR-04: Defense-in-depth tenant isolation gap in `MealExtractionRepository`

**File:** `backend/src/main/java/com/nutriai/api/repository/MealExtractionRepository.java:27`
**Issue:** `findByIdAndPatientId(UUID id, UUID patientId)` scopes the extraction lookup by patient only, not by `nutritionistId`. While the current service checks patient ownership first, this is a single point of failure for tenant isolation. A future refactor or direct repository usage could bypass the nutritionist scope.
**Fix:** Add and use a nutritionist-scoped query:
```java
Optional<MealExtraction> findByIdAndPatientIdAndNutritionistId(UUID id, UUID patientId, UUID nutritionistId);
```

### WR-05: Failed messages are never retried and remain unprocessed forever

**File:** `backend/src/main/java/com/nutriai/api/service/MessageProcessorWorker.java:35-50`
**Issue:** The worker catches all exceptions, logs them, and continues. The message stays `processed=false` in the DB but is **not** re-enqueued. There is no dead-letter queue or retry counter. Over time, failed messages accumulate silently and are never reprocessed.
**Fix:** Add a `retry_count` column to `WhatsAppMessage` and a scheduled job that re-enqueues messages with `processed=false AND retry_count < 3`.

### WR-06: Docker Compose missing backend environment variable propagation

**File:** `docker/docker-compose.yml`
**Issue:** The `backend` service does not list `EVOLUTION_API_KEY`, `NUTRIAI_LLM_API_KEY`, `NUTRIAI_LLM_BASE_URL`, `NUTRIAI_LLM_MODEL`, or `NUTRIAI_WEBHOOK_SECRET`. Host env vars are **not** automatically inherited by Docker containers. If the host sets a custom `EVOLUTION_API_KEY`, the backend uses the default `changeme` while the `evolution-api` container uses the custom value, causing 401 authentication failures.
**Fix:** Add explicit env var references to the backend block:
```yaml
backend:
  environment:
    EVOLUTION_API_KEY: ${EVOLUTION_API_KEY:-changeme}
    NUTRIAI_LLM_API_KEY: ${NUTRIAI_LLM_API_KEY:-}
    NUTRIAI_LLM_BASE_URL: ${NUTRIAI_LLM_BASE_URL:-https://api.ollama.com/v1}
    NUTRIAI_LLM_MODEL: ${NUTRIAI_LLM_MODEL:-glm4}
    NUTRIAI_WEBHOOK_SECRET: ${NUTRIAI_WEBHOOK_SECRET:-}
```

### WR-07: `Timeline` uses array index as React key, causing editor misalignment

**File:** `frontend/src/components/patient/Timeline.tsx:50,140`
**Issue:** `reported.map((ev, i) => <div key={i} ...>)` and `ev.items.map((it, j) => <li key={j} ...>)` use array indices as React keys. The component also stores `editing` state as an index. If the `items` prop is reordered or filtered while a user is editing, the editor switches to the wrong extraction.
**Fix:** Use a stable unique identifier for keys:
```tsx
{reported.map((ev) => (
  <div key={ev.extractionId ?? ev.time + ev.meal} ...>
))}
```
And track the editing item by `extractionId` instead of index.

### WR-08: `WhatsAppActivationRow` conflates API errors with missing phone

**File:** `frontend/src/components/patient/WhatsAppActivationRow.tsx:121`
**Issue:** When `useActivationLink` returns any error (network, 500, timeout), the component renders the "Número não cadastrado" UI. This is misleading because the phone may exist; the API simply failed.
**Fix:** Inspect the error status code. If it is 400, show the missing-phone prompt; otherwise show a generic error message like "Erro ao carregar link. Tente novamente."

## Info

### IN-01: Inline JSON regex in `OllamaCloudLlmService` is too restrictive

**File:** `backend/src/main/java/com/nutriai/api/service/OllamaCloudLlmService.java:33`
**Issue:** `JSON_OBJECT_PATTERN` uses `[^{}]*`, so it cannot match nested JSON arrays/objects. The fallback inline extraction will almost never work for realistic meal reports that contain nested `items`.
**Fix:** Remove the broken fallback or replace it with a relaxed JSON block scanner.

### IN-02: Redis queue items lack TTL

**File:** `backend/src/main/java/com/nutriai/api/service/MessageQueueService.java:34`
**Issue:** Enqueued message IDs have no expiration. If the worker is down for an extended period, stale messages will be processed on restart.
**Fix:** Use `redisTemplate.opsForList().leftPush(QUEUE_KEY, messageId.toString());` combined with a scheduled cleanup or Redis key expiration policy.

### IN-03: `WhatsAppIntelligenceService.getActivationLink` duplicates phone normalization logic

**File:** `backend/src/main/java/com/nutriai/api/service/WhatsAppIntelligenceService.java:155-158`
**Issue:** Manually strips non-digits and leading `55` instead of reusing `PhoneNormalizationService`.
**Fix:** Inject `PhoneNormalizationService` and call `normalize(patient.getWhatsapp())`.

### IN-04: Docker Compose uses `latest` tag for Evolution API

**File:** `docker/docker-compose.yml:59`
**Issue:** `atendai/evolution-api:latest` is not reproducible and may break on upstream updates.
**Fix:** Pin to a specific version tag (e.g., `atendai/evolution-api:v1.8.0`).

### IN-05: Generic `Exception` catch in prompt context builders

**File:** `backend/src/main/java/com/nutriai/api/service/ConversationService.java:308-310,367-370`
**Issue:** `buildPatientContext` and `buildPlanContext` catch generic `Exception`, which can mask real bugs (e.g., repository misconfiguration).
**Fix:** Catch specific exceptions (e.g., `DataAccessException`) and log the full stack trace at `DEBUG`.

### IN-06: `HomeView` status label lookup without fallback

**File:** `frontend/src/views/HomeView.tsx:89`
**Issue:** `statusLabels[p.status]` returns `undefined` if the API returns an unexpected status string.
**Fix:** Add a fallback: `statusLabels[p.status] ?? 'Desconhecido'`.

### IN-07: Missing indexes on `whatsapp_response` table

**File:** `backend/src/main/resources/db/migration/V18__create_whatsapp_tables.sql`
**Issue:** The `whatsapp_response` table has no indexes on `patient_id`, `nutritionist_id`, or `message_id`. As the table grows, timeline lookups may degrade.
**Fix:** Add:
```sql
CREATE INDEX idx_wa_response_patient_nutritionist ON whatsapp_response(patient_id, nutritionist_id);
CREATE INDEX idx_wa_response_message_id ON whatsapp_response(message_id);
```

### IN-08: `EpisodeHistoryEvent` title/description not updated on extraction correction

**File:** `backend/src/main/java/com/nutriai/api/service/WhatsAppIntelligenceService.java:223-256`
**Issue:** `updateHistoryEventMetadata` only updates `metadataJson`. If the meal label or item names change, the timeline event title/description become stale.
**Fix:** Also update `event.setTitle(...)` and `event.setDescription(...)` to reflect corrected data.

---

_Reviewed: 2026-05-05_
_Reviewer: OpenCode (gsd-code-reviewer)_
_Depth: standard_
