---
phase: 04-patient-management
depth: standard
reviewer: gsd-code-reviewer (inline)
date: 2026-04-21
status: findings
---

# Phase 04 Code Review Report

## Scope
- backend/src/main/java/com/nutriai/api/service/PatientService.java
- backend/src/main/java/com/nutriai/api/controller/PatientController.java
- backend/src/main/java/com/nutriai/api/repository/PatientRepository.java
- backend/src/main/java/com/nutriai/api/dto/patient/*.java
- frontend/src/stores/patientStore.ts
- frontend/src/api/patients.ts
- frontend/src/views/PatientsView.tsx
- frontend/src/views/PatientView.tsx

## Findings Summary

| # | Severity | Category | File | Line | Finding |
|---|----------|----------|------|------|---------|
| 1 | **MEDIUM** | Security / Input Validation | PatientRepository.java | 44 | SQL LIKE wildcard injection via user-controlled `search` param. `%` and `_` in search string act as wildcards, potentially broadening results unexpectedly. |
| 2 | **MEDIUM** | Reliability | PatientService.java | 39 | `PatientObjective.valueOf(req.objective())` throws `IllegalArgumentException` (500) for invalid objective strings instead of returning 400. No validation. |
| 3 | **MEDIUM** | Reliability | PatientService.java | 91 | `PatientStatus.valueOf(req.status())` throws `IllegalArgumentException` (500) for invalid status strings. Same pattern as #2. |
| 4 | **LOW** | Completeness | PatientController.java | 40 | `objective` `@RequestParam` accepted but **never passed to service** — objective filter is documented in API but non-functional. |
| 5 | **LOW** | Performance | PatientService.java | 60 | `listPatients()` and `getPatient()` missing `@Transactional(readOnly=true)` — unnecessary dirty checking overhead. |
| 6 | **MEDIUM** | Reliability | patientStore.ts | 49 | `usePatients()` has no `onError` retry strategy or staleTime — transient failures propagate raw to UI. |
| 7 | **LOW** | Security | PatientController.java | 37 | `size` parameter has no `@Max` bound — user could request `size=99999` causing memory pressure. |
| 8 | **LOW** | Maintainability | patientStore.ts | 70 | `usePatient(id!)` uses non-null assertion despite `enabled: !!id` guard — type-safe but brittle. |

---

## Detailed Findings

### F-01: SQL LIKE Wildcard Injection [MEDIUM]

**File:** `PatientRepository.java:44`
```java
"AND (:search IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')))"
```

**Issue:** User input `%` or `_` in the search string acts as SQL wildcard characters, potentially matching more records than intended. This is not a classic SQL injection (parameterized query prevents that), but it allows unintended result broadening.

**Mitigation:** Escape `%` and `_` characters in the search string before passing to JPA query, or document the wildcard behavior explicitly.

### F-02: Enum Validation Gap → 500 Error [MEDIUM]

**File:** `PatientService.java:39`
```java
PatientObjective objective = PatientObjective.valueOf(req.objective());
```

**Issue:** `valueOf()` throws `IllegalArgumentException` for any invalid enum string. With `@Valid` on the controller, Jakarta validation catches `@NotBlank` but not enum membership. The exception becomes an unhandled 500.

**Mitigation:** Add `@Pattern` or custom validator on `CreatePatientRequest.objective` that validates against `PatientObjective.values()`, or catch and convert to `ResponseStatusException(400)`.

### F-03: Enum Validation Gap → 500 Error (status) [MEDIUM]

**File:** `PatientService.java:91`
```java
if (req.status() != null) patient.setStatus(PatientStatus.valueOf(req.status()));
```

**Issue:** Same pattern as F-02 but for status updates. Invalid status strings produce 500.

**Mitigation:** Validate status against `PatientStatus.values()` before `valueOf()`, or catch `IllegalArgumentException` and throw `ResponseStatusException(HttpStatus.BAD_REQUEST)`.

### F-04: Objective Filter Not Wired [LOW]

**File:** `PatientController.java:40-45`

The controller accepts `objective` as a RequestParam but never passes it to `PatientService.listPatients()`. The repository query `findByNutritionistIdWithFilters` also lacks an objective filter clause. The objective filter in the frontend (`objectiveFilter`) is sent as a query param but ignored server-side.

**Mitigation:** Either implement objective filtering in the repository query or remove the param from the controller to avoid API confusion.

### F-05: Missing readOnly Transactional [LOW]

**File:** `PatientService.java:60,74`

Read methods `listPatients()` and `getPatient()` lack `@Transactional(readOnly = true)`. This prevents Spring/Hibernate read optimizations and may cause unnecessary dirty checking.

**Mitigation:** Add `@Transactional(readOnly = true)` to read-only service methods.

### F-06: No Error Handling in React Query Hooks [MEDIUM]

**File:** `patientStore.ts:49-64`

`usePatients()` returns `isError` but has no configured `retry`, `staleTime`, or `gcTime`. Transient network failures immediately show error UI with no auto-retry.

**Mitigation:** Add `retry: 2`, `staleTime: 30_000` (30s) to the `useQuery` config. Consider adding `placeholderData` for smoother UX.

### F-07: Unbounded Page Size [LOW]

**File:** `PatientController.java:37`
```java
@RequestParam(defaultValue = "10") int size
```

No upper bound on `size`. A malicious or buggy client could request `size=999999`, causing excessive memory usage and slow responses.

**Mitigation:** Add `@Max(100)` from `jakarta.validation.constraints` to cap page size at 100.

### F-08: Non-null Assertion in usePatient [LOW]

**File:** `patientStore.ts:70`
```typescript
queryFn: () => patientApi.getPatient(id!),
```

The `enabled: !!id` guard prevents execution when `id` is null, but the non-null assertion `id!` is an unsafe TypeScript pattern if the guard logic changes.

**Mitigation:** Use a safe wrapper: `queryFn: () => patientApi.getPatient(id as string)` with explicit guard, or refactor to avoid the assertion.

---

## What Was Done Well

- **Data isolation is correct**: Every query scoped by `nutritionistId` at repository level (D-10 achieved)
- **404-not-403 implemented**: Prevents ID enumeration attacks (D-11 achieved)
- **Soft delete only**: No hard deletes, data preserved (D-05 achieved)
- **Episode lifecycle**: Deactivation closes episode, reactivation creates new one (D-08 achieved)
- **Zustand + TanStack Query pattern**: Clean separation of client state vs server state (D-13 achieved)
- **Table/grid toggle preserved**: Original prototype UI maintained (D-14 achieved)
- `@Transactional` on mutating methods ensures atomicity
- `@Valid` on `CreatePatientRequest` validates required fields
- PatientResponse DTO prevents internal entity leakage

---

## Recommendations

1. **Fix F-02 and F-03** (enum validation) before production — 500 errors for bad input degrade UX
2. **Fix F-07** (page size cap) — simple addition of `@Max(100)`
3. **Fix F-04** (objective filter) — either wire it or remove the param
4. **Fix F-06** (React Query config) — adds resilience to transient failures
5. Consider F-05 (readOnly transactional) and F-01 (escape wildcards) in next polish pass

---

## Self-Check: PASSED

All must-have artifacts exist. Decision coverage validated.
