---
phase: 04-patient-management
plan: 01
status: complete
started: 2026-04-21T14:26:00Z
completed: 2026-04-21T19:35:00Z
---

# Phase 04 Plan 01 Summary

## What Was Built

Backend Patient CRUD API with complete data isolation between nutritionist accounts.

### Entities
- **Patient** (`Patient.java`) — JPA entity with nutritionist_id FK, fields: id, nutritionistId, name, initials, age, objective, status, adherence, weight, weightDelta, tag, active
- **Episode** (`Episode.java`) — JPA entity for activation cycles with startDate, endDate
- **PatientObjective** (`PatientObjective.java`) — enum: EMAGRECIMENTO, HIPERTROFIA, CONTROLE_GLICEMICO, PERFORMANCE_ESPORTIVA, REEDUCACAO_ALIMENTAR, CONTROLE_PRESSAO, SAUDE_GERAL — with getPortugueseLabel()
- **PatientStatus** (`PatientStatus.java`) — enum: ONTRACK, WARNING, DANGER — with getPortugueseLabel() and getColor()

### Repositories
- **PatientRepository** — findByNutritionistId, findByNutritionistIdAndActive, findByNutritionistIdAndStatus, findByIdAndNutritionistId, findByNutritionistIdWithFilters
- **EpisodeRepository** — findByPatientIdOrderByStartDateDesc, findTopByPatientIdAndEndDateIsNullOrderByStartDateDesc

### Service
- **PatientService** — createPatient, listPatients, getPatient, updatePatient, deactivatePatient, reactivatePatient. All methods take `nutritionistId` first parameter for data isolation.

### Controller
- **PatientController** — REST endpoints:
  - `POST /api/v1/patients` — 201
  - `GET /api/v1/patients?{page,size,search,status,objective,active}` — 200
  - `GET /api/v1/patients/{id}` — 200 | 404
  - `PATCH /api/v1/patients/{id}` — 200
  - `PATCH /api/v1/patients/{id}/deactivate` — 200
  - `PATCH /api/v1/patients/{id}/reactivate` — 200

### DTOs
- CreatePatientRequest, UpdatePatientRequest, PatientResponse, PatientListResponse

### Migration
- V4__create_patient_and_episode_tables.sql — patient + episode tables with FKs, indexes, unique constraint

### Tests
- PatientRepositoryTest — 10 tests: data isolation, filtering, soft delete, initials, defaults
- PatientServiceTest — 15 tests: create, list, get, update, deactivate, reactivate, 404 cases
- PatientControllerTest — 7 tests: integration tests with real JWT auth, 404 for other nutritionist

### Verify
- `./gradlew test` — PASS (all tests across prior phases + new ones)
- `./gradlew compileJava` — PASS (zero errors)

## Key Decisions
- D-10: Repository-level isolation (nutritionistId scoping in queries)
- D-11: 404 (not 403) for wrong nutritionist to prevent ID enumeration
- D-12: RESTful endpoints with PATCH for deactivate/reactivate

## Self-Check: PASSED
