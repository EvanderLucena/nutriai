---
phase: 03-authentication-onboarding
plan: 01
subsystem: auth
tags: [jwt, spring-security, bcrypt, refresh-tokens, h2-testing]

requires:
  - phase: 02-frontend-migration
    provides: React frontend with LoginView, SignupView, OnboardingView

provides:
  - JWT access token (15min) and refresh token (7day) generation/validation
  - POST /api/v1/auth/signup, /login, /refresh, /logout, GET /me, POST /onboarding endpoints
  - BCrypt password hashing and verification
  - Refresh token rotation (old token invalidated on each refresh)
  - Spring Security filter chain with stateless JWT authentication
  - CORS configuration for dev (localhost:5173)
  - GlobalExceptionHandler with consistent JSON error responses (400/401/409/500)
  - V2 Flyway migration adding auth/onboarding columns to nutritionist + refresh_token table

affects: [frontend-auth, api-all-endpoints]

tech-stack:
  added: [spring-boot-starter-security, jjwt-0.12.6, bcrypt]
  patterns: [jwt-stateless-auth, refresh-token-rotation, security-filter-chain, cookie-based-refresh-token]

key-files:
  created:
    - backend/src/main/java/com/nutriai/api/auth/JwtService.java
    - backend/src/main/java/com/nutriai/api/auth/AuthService.java
    - backend/src/main/java/com/nutriai/api/auth/AuthController.java
    - backend/src/main/java/com/nutriai/api/auth/JwtAuthFilter.java
    - backend/src/main/java/com/nutriai/api/auth/NutritionistAccess.java
    - backend/src/main/java/com/nutriai/api/auth/RefreshToken.java
    - backend/src/main/java/com/nutriai/api/auth/RefreshTokenRepository.java
    - backend/src/main/java/com/nutriai/api/auth/dto/LoginRequest.java
    - backend/src/main/java/com/nutriai/api/auth/dto/LoginResponse.java
    - backend/src/main/java/com/nutriai/api/auth/dto/SignupRequest.java
    - backend/src/main/java/com/nutriai/api/auth/dto/SignupResponse.java
    - backend/src/main/java/com/nutriai/api/auth/dto/RefreshResponse.java
    - backend/src/main/java/com/nutriai/api/auth/dto/MeResponse.java
    - backend/src/main/java/com/nutriai/api/auth/dto/OnboardingRequest.java
    - backend/src/main/java/com/nutriai/api/config/SecurityConfig.java
    - backend/src/main/resources/db/migration/V2__add_auth_and_onboarding_columns.sql
    - backend/src/test/java/com/nutriai/api/auth/JwtServiceTest.java
    - backend/src/test/java/com/nutriai/api/auth/AuthServiceTest.java
    - backend/src/test/java/com/nutriai/api/auth/AuthControllerTest.java
  modified:
    - backend/build.gradle
    - backend/src/main/resources/application.yml
    - backend/src/main/resources/application-dev.yml
    - backend/src/main/java/com/nutriai/api/model/Nutritionist.java
    - backend/src/main/java/com/nutriai/api/repository/NutritionistRepository.java
    - backend/src/main/java/com/nutriai/api/NutriAiApplication.java
    - backend/src/main/java/com/nutriai/api/config/CorsConfig.java
    - backend/src/main/java/com/nutriai/api/exception/GlobalExceptionHandler.java
    - backend/src/test/resources/application-test.yml
    - backend/src/test/java/com/nutriai/api/NutriAiApplicationTests.java
    - backend/src/test/java/com/nutriai/api/controller/HealthControllerTest.java

key-decisions:
  - "SecurityConfig only permits public auth endpoints (signup, login, refresh) — /me, /logout, /onboarding require JWT"
  - "CorsConfig rewritten from WebMvcConfigurer to CorsConfigurationSource for Spring Security compatibility"
  - "Refresh token stored as SHA-256 hash of jti — DB compromise doesn't leak valid tokens"
  - "Cookie-based refresh token with httpOnly, SameSite=Lax for dev and Secure+Strict for production"
  - "GlobalExceptionHandler kept at existing package (com.nutriai.api.exception) to avoid bean name conflict"
  - "JwtAuthFilter skips only public endpoints (signup, login, refresh, health) — protected auth endpoints go through the filter"

patterns-established:
  - "JWT stateless auth: no sessions, SecurityContext holds UUID principal, role-based authorities via ROLE_ prefix"
  - "Auth DTOs: record types with Jakarta Validation annotations, pt-BR error messages"
  - "Refresh token rotation: old token invalidated (deleted from DB) when new pair issued"
  - "30-day trial auto-activated on signup via @PrePersist in Nutritionist entity"
  - "Error responses: consistent {success, message, errors?} JSON pattern from GlobalExceptionHandler"

requirements-completed: [AUTH-01, AUTH-02, AUTH-03, AUTH-04]

duration: 13min
completed: 2026-04-21
---

# Phase 3: Authentication & Onboarding Summary

**JWT auth with refresh rotation, BCrypt passwords, Spring Security filter chain, and 6 auth endpoints protecting all API routes**

## Performance

- **Duration:** 13 min
- **Started:** 2026-04-21T00:40:17Z
- **Completed:** 2026-04-21T00:53:18Z
- **Tasks:** 2 (Task 1 verified as done + committed, Task 2 fully implemented)
- **Files modified:** 30

## Accomplishments
- Complete Spring Security integration with JWT stateless authentication and BCrypt password hashing
- 6 auth endpoints: POST /signup, /login, /refresh, /logout, GET /me, POST /onboarding
- Refresh token rotation with SHA-256 hashed jti stored in PostgreSQL — old tokens invalidated on rotation
- V2 Flyway migration adding crn, crnRegional, specialty, whatsapp, onboardingCompleted, trialEndsAt, subscriptionTier, patientLimit columns plus refresh_token table
- SecurityConfig with public auth endpoints and protected /me, /logout, /onboarding endpoints
- Consistent JSON error responses (400 validation, 401 unauthorized, 409 conflict, 500 internal) via GlobalExceptionHandler
- CORS configured for dev (localhost:5173) with CorsConfigurationSource integrated with Spring Security
- 29 tests passing (6 JwtServiceTest + 8 AuthServiceTest + 11 AuthControllerTest + 1 HealthControllerTest + 1 NutriAiApplicationTests + 2 existing)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add Spring Security, JWT, and auth infrastructure** - `b2b886e` (feat)
2. **Task 2: Build auth endpoints, SecurityConfig, and GlobalExceptionHandler** - `e0decab` (feat)

## Files Created/Modified
- `backend/src/main/java/com/nutriai/api/auth/JwtService.java` - JWT token generation and validation with HS256
- `backend/src/main/java/com/nutriai/api/auth/AuthService.java` - signup, login, refresh, logout, onboarding, getCurrentUser business logic
- `backend/src/main/java/com/nutriai/api/auth/AuthController.java` - REST endpoints with cookie management for refresh tokens
- `backend/src/main/java/com/nutriai/api/auth/JwtAuthFilter.java` - OncePerRequestFilter extracting Bearer tokens, validating JWT
- `backend/src/main/java/com/nutriai/api/auth/NutritionistAccess.java` - Static utility extracting UUID from SecurityContext
- `backend/src/main/java/com/nutriai/api/auth/RefreshToken.java` - JPA entity for refresh token SHA-256 hashes
- `backend/src/main/java/com/nutriai/api/auth/RefreshTokenRepository.java` - JPA repository for refresh tokens
- `backend/src/main/java/com/nutriai/api/auth/dto/*.java` - 7 DTOs (LoginRequest/Response, SignupRequest/Response, RefreshResponse, MeResponse, OnboardingRequest)
- `backend/src/main/java/com/nutriai/api/config/SecurityConfig.java` - SecurityFilterChain with JWT filter, BCrypt, CORS
- `backend/src/main/java/com/nutriai/api/config/CorsConfig.java` - CorsConfigurationSource replacing WebMvcConfigurer
- `backend/src/main/java/com/nutriai/api/exception/GlobalExceptionHandler.java` - Expanded with 400/401/409/500 handlers
- `backend/src/main/resources/application.yml` - JWT config (secret, expirations, cookie settings)
- `backend/src/main/resources/application-dev.yml` - Dev cookie overrides (secure:false, SameSite:Lax)
- `backend/src/main/resources/db/migration/V2__add_auth_and_onboarding_columns.sql` - Auth/trial columns + refresh_token table
- `backend/src/main/java/com/nutriai/api/model/Nutritionist.java` - Added 8 new fields for auth/onboarding/trial
- `backend/build.gradle` - Added spring-boot-starter-security, jjwt-api/impl/jackson
- `backend/src/test/java/com/nutriai/api/auth/JwtServiceTest.java` - 6 unit tests
- `backend/src/test/java/com/nutriai/api/auth/AuthServiceTest.java` - 8 integration tests
- `backend/src/test/java/com/nutriai/api/auth/AuthControllerTest.java` - 11 MVC tests

## Decisions Made
- Public auth endpoints (signup, login, refresh) use permitAll(); protected auth endpoints (/me, /logout, /onboarding) require JWT — this prevents unauthenticated access to user data while allowing registration and token refresh
- GlobalExceptionHandler kept at existing package (com.nutriai.api.exception) to avoid Spring bean name conflict — the plan had it at com.nutriai.api.common.exception but the existing handler was already there
- CorsConfig rewritten from WebMvcConfigurer to CorsConfigurationSource because Spring Security takes precedence over MVC CORS
- application-dev.yml had broken YAML indentation (1-space instead of 0-space) for logging and nutriai sections — fixed immediately

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Conflicting GlobalExceptionHandler bean names**
- **Found during:** task 2 (Creating GlobalExceptionHandler)
- **Issue:** Existing GlobalExceptionHandler at com.nutriai.api.exception conflicted with new one at com.nutriai.api.common.exception — Spring bean name collision
- **Fix:** Merged handlers into existing package location (com.nutriai.api.exception.GlobalExceptionHandler), added DataIntegrityViolationException (409) and ResponseStatusException handlers, deleted duplicate at common/exception
- **Files modified:** GlobalExceptionHandler.java
- **Verification:** All 29 tests pass, no ConflictingBeanDefinitionException
- **Committed in:** e0decab (task 2 commit)

**2. [Rule 3 - Blocking] RefreshTokenRepository not scanned by JPA**
- **Found during:** task 2 (AuthService integration tests)
- **Issue:** NutriAiApplication had @EnableJpaRepositories(basePackages = "com.nutriai.api.repository") which didn't include com.nutriai.api.auth package where RefreshTokenRepository lives
- **Fix:** Changed to basePackages = {"com.nutriai.api.repository", "com.nutriai.api.auth"}
- **Files modified:** NutriAiApplication.java
- **Verification:** All 29 tests pass, RefreshTokenRepository is now autowired successfully
- **Committed in:** e0decab (task 2 commit)

**3. [Rule 1 - Bug] SecurityConfig permitAll on /api/v1/auth/** allowed unauthenticated access to /me, /logout, /onboarding**
- **Found during:** task 2 (AuthControllerTest — me_withoutToken_returns401 returned 500 instead of 401)
- **Issue:** JwtAuthFilter.shouldNotFilter skipped ALL /api/v1/auth/** paths, and SecurityConfig permitAll matched all auth sub-paths including protected ones
- **Fix:** Split permitAll into specific public endpoints (/signup, /login, /refresh) + updated shouldNotFilter to only skip those + /health. Protected auth endpoints (/me, /logout, /onboarding) now require JWT through the filter chain
- **Files modified:** SecurityConfig.java, JwtAuthFilter.java
- **Verification:** me_withoutToken_returns401 now returns 401, all 29 tests pass
- **Committed in:** e0decab (task 2 commit)

**4. [Rule 1 - Bug] application-dev.yml had broken YAML indentation**
- **Found during:** task 1 (review of existing config)
- **Issue:** logging and nutriai sections had 1-space indentation instead of 0-space, causing YAML parse errors
- **Fix:** Fixed to proper 0-space indentation
- **Files modified:** application-dev.yml
- **Verification:** Application boots successfully with dev profile
- **Committed in:** b2b886e (task 1 commit)

---

**Total deviations:** 4 auto-fixed (2 bugs, 2 blockers)
**Impact on plan:** All auto-fixes were necessary for correctness. No scope creep — SecurityConfig and JwtAuthFilter changes follow the same architecture described in the plan.

## Issues Encountered
- Spring Boot 3.5.0 removed @MockBean — existing HeathControllerTest was already fixed upstream to use @MockitoBean
- GlobalExceptionHandler bean name conflict resolved by merging into existing package location

## Known Stubs
- OnboardingRequest.step field is not used by the controller yet — placeholder for future per-step saving
- CorsConfig is Profile("dev") only — production CORS configuration will be needed when deploying

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Auth backend is complete and all 29 tests pass
- Ready for Phase 3 Plan 02: Frontend integration (wiring LoginView, SignupView, OnboardingView to real API)
- Note: Application boot against real PostgreSQL requires V2 migration to apply cleanly against existing schema

---
*Phase: 03-authentication-onboarding*
*Completed: 2026-04-21*

## Self-Check: PASSED
- All 14 key files verified as existing on disk
- Both commit hashes verified (b2b886e, e0decab)
- All 29 tests passing (BUILD SUCCESSFUL)