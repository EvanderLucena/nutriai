---
phase: 06-dashboard-biometry
plan: 02
status: complete
started: "2026-04-24T22:30:00Z"
completed: "2026-04-24T22:55:00Z"
self_check: PASSED
must_haves:
  - truth: "Biometric assessments can only be created/updated on patients with an active episode"
    status: VERIFIED
  - truth: "Assessment save requires date + weight + body fat percentage; remaining fields are optional"
    status: VERIFIED
  - truth: "All biometry reads and writes are scoped to the authenticated nutritionist"
    status: VERIFIED
  - truth: "Creating or updating an assessment persists an episode_history_event for cycle history"
    status: VERIFIED
key_files:
  created:
    - backend/src/main/java/com/nutriai/api/dto/biometry/CreateBiometryAssessmentRequest.java
    - backend/src/main/java/com/nutriai/api/dto/biometry/UpdateBiometryAssessmentRequest.java
    - backend/src/main/java/com/nutriai/api/dto/biometry/BiometryAssessmentResponse.java
    - backend/src/main/java/com/nutriai/api/service/BiometryService.java
    - backend/src/main/java/com/nutriai/api/controller/BiometryController.java
    - backend/src/test/java/com/nutriai/api/service/BiometryServiceTest.java
    - backend/src/test/java/com/nutriai/api/controller/BiometryControllerTest.java
  modified: []
deviations: []
---

## What was built

Biometry CRUD backend: DTOs with validation (required date/weight/bodyFatPercent, optional skinfolds/perimetry nested lists), BiometryService with active-episode enforcement, tenant-scoped reads/writes, and history-event emission on create/update. BiometryController with PreAuthorize at /api/v1/patients/{patientId}/biometry, ApiResponse envelope wrapping.

## Key decisions

- Used nested record DTOs (SkinfoldEntry, PerimetryEntry) inside CreateBiometryAssessmentRequest for clean JSON input
- BiometryService.findActiveEpisode throws 400 if no active episode — matches plan requirement
- Cross-nutritionist access to assessments returns 404 via findByIdAndNutritionistId — consistent with Patient pattern
- Update replaces skinfolds/perimetry wholesale (delete-then-add pattern via deleteAllByAssessmentId) rather than merging individual entries

## Verification

- `./gradlew compileJava` — PASSED
- `./gradlew test BiometryServiceTest` — PASSED (7 tests: validation, active-episode requirement, tenant isolation, history emission)
- `./gradlew test BiometryControllerTest` — PASSED (6 tests: create 200, missing fields 400, update, list, cross-tenant 404, no active episode 400)