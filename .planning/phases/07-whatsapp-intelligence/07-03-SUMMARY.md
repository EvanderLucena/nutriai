---
phase: 07-whatsapp-intelligence
plan: 03
subsystem: whatsapp-intelligence
tags: [backend, frontend, api, e2e, whatsapp]
dependency_graph:
  requires: ["07-02"]
  provides: [whatsapp-api-endpoints, whatsapp-frontend-store, whatsapp-ui-components, whatsapp-e2e]
  affects: [PatientView, HomeView, Timeline, ExtractionEditor]
tech_stack:
  added:
    - WhatsAppIntelligenceController (4 REST endpoints)
    - WhatsAppIntelligenceService (business logic)
    - WhatsAppActivationRow (React component, 3 states)
    - WhatsAppActivationModal (React component)
    - whatsappStore (Zustand + TanStack Query)
    - whatsappApi (Axios API module)
  patterns:
    - TanStack Query hooks with optimistic updates
    - Extraction → TimelineEvent mapping for component compatibility
    - @Setter pattern for mutable entity fields (MealExtraction correction)
decisions:
  - Used named exports in whatsappApi.ts (consistent with biometry.ts pattern) instead of object exports
  - Added extractionId to TimelineEvent type to support PATCH corrections
  - WhatsAppStatus endpoint uses efficient DB count queries instead of N+1 iterations
  - MealExtraction and EpisodeHistoryEvent got @Setter annotations to support correction flow
key_files:
  created:
    - backend/src/main/java/com/nutriai/api/controller/WhatsAppIntelligenceController.java
    - backend/src/main/java/com/nutriai/api/service/WhatsAppIntelligenceService.java
    - backend/src/test/java/com/nutriai/api/controller/WhatsAppIntelligenceControllerTest.java
    - frontend/src/types/whatsapp.ts
    - frontend/src/api/whatsapp.ts
    - frontend/src/stores/whatsappStore.ts
    - frontend/src/stores/whatsappStore.test.ts
    - frontend/src/components/patient/WhatsAppActivationRow.tsx
    - frontend/src/components/patient/WhatsAppActivationModal.tsx
    - frontend/e2e/whatsapp-intelligence.spec.ts
  modified:
    - backend/src/main/java/com/nutriai/api/model/MealExtraction.java (added @Setter)
    - backend/src/main/java/com/nutriai/api/model/EpisodeHistoryEvent.java (added @Setter)
    - backend/src/main/java/com/nutriai/api/repository/MealExtractionRepository.java (added countByNutritionistId query)
    - backend/src/main/java/com/nutriai/api/repository/WhatsAppMessageRepository.java (added status queries)
    - frontend/src/views/PatientView.tsx (added WhatsAppActivationRow, extractions hook)
    - frontend/src/views/HomeView.tsx (added 2 WhatsApp KPIs)
    - frontend/src/components/patient/Timeline.tsx (added patientId prop)
    - frontend/src/components/patient/ExtractionEditor.tsx (connected PATCH endpoint)
    - frontend/src/components/patient/index.ts (added new exports)
    - frontend/src/types/patient.ts (added extractionId to TimelineEvent)
metrics:
  duration: 30min
  tasks_completed: 3
  files_created: 10
  files_modified: 10
  backend_tests: 7 (WhatsAppIntelligenceControllerTest)
  frontend_tests: 6 (whatsappStore.test.ts)
  e2e_tests: 6 (whatsapp-intelligence.spec.ts)
---

# Phase 07 Plan 03: WhatsApp Intelligence Frontend Summary

Wired the frontend to the WhatsApp Intelligence backend: API endpoints for extractions, activation links, and status; frontend store with TanStack Query; Timeline component connected to real extraction data; WhatsApp activation UI in PatientView; ExtractionEditor correction flow; dashboard WhatsApp KPIs.

## Task 1: Backend API endpoints + Frontend types/API/store

**Backend:**
- `WhatsAppIntelligenceController` with 4 REST endpoints:
  - `GET /patients/{id}/extractions` — list today's extractions (scoped by nutritionistId)
  - `PATCH /patients/{id}/extractions/{extractionId}` — correct extraction items + recalculate totals
  - `GET /patients/{id}/activation-link` — generate WhatsApp activation link per D-15
  - `GET /whatsapp/status` — WhatsApp instance health + counts
- `WhatsAppIntelligenceService` handles business logic: tenant isolation, phone normalization, correction with EpisodeHistoryEvent metadata update, efficient DB count queries
- Added `@Setter` to `MealExtraction` and `EpisodeHistoryEvent` to support mutable corrections
- Added repository queries: `countByNutritionistIdAndExtractedAtBetween`, `findTopByNutritionistIdOrderByCreatedAtDesc`, `countDistinctPatientIdByNutritionistIdAndProcessedTrue`, `existsByNutritionistIdAndCreatedAtAfter`
- 7 unit tests in `WhatsAppIntelligenceControllerTest` all passing

**Frontend:**
- `types/whatsapp.ts` — TypeScript types matching backend DTOs (Extraction, ActivationLink, WhatsAppStatus, PatchExtractionPayload)
- `api/whatsapp.ts` — API module with named exports (consistent with biometry.ts pattern)
- `stores/whatsappStore.ts` — Zustand UI store + TanStack Query hooks (useExtractions, usePatchExtraction, useActivationLink, useWhatsAppStatus)
- `mapExtractionsToTimelineEvents()` — converts Extraction[] to TimelineEvent[] for Timeline component compatibility
- Optimistic updates in usePatchExtraction with rollback on error
- 6 unit tests in `whatsappStore.test.ts` all passing

## Task 2: Frontend UI components + view modifications

- **WhatsAppActivationRow** — 3 states: null phone (edit CTA), not activated (gray dot + "Gerar link"), activated (green dot + "Copiar link")
- **WhatsAppActivationModal** — modal for missing phone, redirects to EditPatientModal
- **PatientView** — WhatsAppActivationRow inserted between header stats and tab bar; TodayTab uses `useExtractions` hook for real timeline data; loading/error states added
- **Timeline** — accepts `patientId` prop, passes `extractionId` to ExtractionEditor
- **ExtractionEditor** — connected to PATCH endpoint via `usePatchExtraction`; saves corrections with optimistic update; shows loading state; toast on success/error
- **HomeView** — expanded KPI grid from 4→6 columns; added "Refeições extraídas hoje" and "Pacientes ativos no WhatsApp" KPIs using `useWhatsAppStatus`
- All UI text is pt-BR; `npx tsc --noEmit` passes with zero errors

## Task 3: E2E tests

- `whatsapp-intelligence.spec.ts` — 6 E2E tests:
  1. **E2E-WA-01**: Activation link generation (verify wa.me format, isActivated field)
  2. **E2E-WA-02**: Missing phone prompt (400 with "WhatsApp" message)
  3. **E2E-WA-03**: Extractions endpoint returns list (empty array initially)
  4. **E2E-WA-04**: Extraction correction (404 for non-existent extraction ID)
  5. **E2E-WA-05**: WhatsApp status endpoint returns valid structure (connected, extractionsToday, activePatientsCount)
  6. **E2E-WA-06**: Cross-tenant isolation (nutritionist A cannot see B's patients)

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

- WhatsAppActivationRow: when `useActivationLink` query errors (patient has no phone), shows "Número não cadastrado" with edit CTA, not a full activation flow. This is correct per UI-SPEC.
- WhatsApp status KPIs show "..." during loading and "0" when data is null — no persistent stub, this matches design.

## Self-Check: PASSED

- All 10 created files exist on disk ✓
- All 3 task commits exist in git log ✓
- Backend compiles (`./gradlew compileJava`) ✓
- Backend tests pass (7 WhatsAppIntelligenceControllerTest) ✓
- Frontend compiles (`npx tsc --noEmit`) ✓
- Frontend tests pass (165 total, including 6 new whatsappStore tests) ✓