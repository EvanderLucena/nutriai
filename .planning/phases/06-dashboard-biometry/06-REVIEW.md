---
phase: 06-dashboard-biometry
reviewed: 2026-04-25T02:26:05Z
depth: standard
files_reviewed: 17
files_reviewed_list:
  - backend/src/main/resources/db/migration/V13__create_biometry_and_episode_history_tables.sql
  - backend/src/main/java/com/nutriai/api/model/BiometryAssessment.java
  - backend/src/main/java/com/nutriai/api/model/BiometrySkinfold.java
  - backend/src/main/java/com/nutriai/api/model/BiometryPerimetry.java
  - backend/src/main/java/com/nutriai/api/model/EpisodeHistoryEvent.java
  - backend/src/main/java/com/nutriai/api/repository/BiometryAssessmentRepository.java
  - backend/src/main/java/com/nutriai/api/repository/BiometrySkinfoldRepository.java
  - backend/src/main/java/com/nutriai/api/repository/BiometryPerimetryRepository.java
  - backend/src/main/java/com/nutriai/api/repository/EpisodeHistoryEventRepository.java
  - backend/src/test/java/com/nutriai/api/repository/BiometryAssessmentRepositoryTest.java
  - backend/src/main/java/com/nutriai/api/dto/biometry/CreateBiometryAssessmentRequest.java
  - backend/src/main/java/com/nutriai/api/dto/biometry/UpdateBiometryAssessmentRequest.java
  - backend/src/main/java/com/nutriai/api/dto/biometry/BiometryAssessmentResponse.java
  - backend/src/main/java/com/nutriai/api/service/BiometryService.java
  - backend/src/main/java/com/nutriai/api/controller/BiometryController.java
  - backend/src/test/java/com/nutriai/api/service/BiometryServiceTest.java
  - backend/src/test/java/com/nutriai/api/controller/BiometryControllerTest.java
findings:
  critical: 1
  warning: 2
  info: 0
  total: 3
status: issues_found
---

# Phase 06: Code Review Report

**Reviewed:** 2026-04-25T02:26:05Z
**Depth:** standard
**Files Reviewed:** 17
**Status:** issues_found

## Summary

Reviewed the biometry persistence, repository, service, controller, and tests at standard depth. The controller is protected with `@PreAuthorize` and most patient entry points start with a nutritionist-scoped patient lookup, but the history snapshot flow then trusts an arbitrary `episodeId`. I also found one persistence bug that can break create/update transactions and one path-consistency bug in assessment updates.

## Critical Issues

### CR-01: History snapshot accepts another patient's or tenant's episode id

**File:** `backend/src/main/java/com/nutriai/api/service/BiometryService.java:207`
**Issue:** `getHistorySnapshot()` validates that `patientId` belongs to the current nutritionist, but then loads the requested episode with unscoped `episodeRepository.findById(episodeId)`. The subsequent reads use only `episodeId` (`assessmentRepository.findByEpisodeIdOrderByAssessmentDateAsc`, `historyEventRepository.findByEpisodeIdOrderByEventAtAsc`, and `mealPlanRepository.findByEpisodeId`), so any authenticated nutritionist who owns any patient can request another closed episode UUID and receive that episode's health data. This violates the project tenant isolation rule for sensitive LGPD data.
**Fix:**
```java
Episode episode = episodeRepository.findById(episodeId)
        .filter(e -> e.getPatientId().equals(patientId))
        .orElseThrow(() -> new ResourceNotFoundException("Episodio", episodeId));

List<BiometryAssessment> assessments =
        assessmentRepository.findByEpisodeIdAndNutritionistIdOrderByAssessmentDateAsc(episodeId, nutritionistId);
List<EpisodeHistoryEvent> timelineEvents =
        historyEventRepository.findByEpisodeIdAndNutritionistIdOrderByEventAtAsc(episodeId, nutritionistId);
MealPlan plan = mealPlanRepository.findByEpisodeIdAndNutritionistId(episodeId, nutritionistId).orElse(null);
```
Add a controller/service test where nutritionist A calls `/patients/{ownPatientId}/biometry/history/episodes/{otherNutritionistEpisodeId}` and gets 404.

## Warnings

### WR-01: Biometry history events are saved without required eventAt

**File:** `backend/src/main/java/com/nutriai/api/service/BiometryService.java:240`
**Issue:** `episode_history_event.event_at` is `NOT NULL`, and `EpisodeHistoryEvent.eventAt` is `@NotNull`, but `emitHistoryEvent()` builds the event without setting `eventAt`. With a real database this can throw a constraint violation during create/update and roll back the biometry assessment transaction. The unit tests mock `historyEventRepository.save()`, so they do not catch the missing required column.
**Fix:**
```java
EpisodeHistoryEvent event = EpisodeHistoryEvent.builder()
        .episodeId(episodeId)
        .nutritionistId(nutritionistId)
        .eventType(eventType)
        .eventAt(LocalDateTime.now())
        .title(title)
        .sourceRef(sourceRef + ":" + sourceId)
        .build();
```
Add an integration/controller assertion that a create request persists an `EpisodeHistoryEvent` with non-null `eventAt`.

### WR-02: Update endpoint ignores patientId when selecting the assessment

**File:** `backend/src/main/java/com/nutriai/api/service/BiometryService.java:111`
**Issue:** `updateAssessment()` receives `patientId`, but it loads the assessment by `assessmentId + nutritionistId` only. A nutritionist can call `/patients/{patientA}/biometry/{assessmentFromPatientB}` and update patient B's assessment through patient A's route. This is not cross-tenant leakage, but it makes the REST resource path lie and can corrupt patient-specific UI flows, audit trails, and tests.
**Fix:**
```java
BiometryAssessment assessment = assessmentRepository.findByIdAndNutritionistId(assessmentId, nutritionistId)
        .orElseThrow(() -> new ResourceNotFoundException("Avaliacao biometrica", assessmentId));

Episode episode = episodeRepository.findById(assessment.getEpisodeId())
        .filter(e -> e.getPatientId().equals(patientId))
        .orElseThrow(() -> new ResourceNotFoundException("Avaliacao biometrica", assessmentId));
```
Alternatively expose a repository query that joins through the episode/patient relationship and scopes by `assessmentId`, `patientId`, and `nutritionistId`. Add a test for mismatched path patient and assessment.

---

_Reviewed: 2026-04-25T02:26:05Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
