# Phase 3 Research: Authentication & Onboarding

**Phase:** 3 — Authentication & Onboarding
**Researched:** 2026-04-20
**Confidence:** HIGH

## Executive Summary

Phase 3 adds real authentication to NutriAI — replacing the mock `localStorage.setItem('nutriai.auth', 'true')` with JWT-based Spring Security, bcrypt password hashing, and refresh token rotation. The backend currently has a `Nutritionist` entity, repository, health endpoint, and V1 Flyway migration, but no Spring Security dependency and no auth endpoints. The frontend has LoginView, SignupView, and OnboardingView components with form handling but only cosmetic auth (calls `login()` → sets localStorage boolean). The key challenge is bridging the two sides: adding Spring Security to the backend filter chain, creating login/signup/refresh/logout endpoints, and wiring the frontend to use real API calls with token management.

## Current State Assessment

### Backend (exists)

- `Nutritionist` entity with UUID id, email, passwordHash, name, role, timestamps
- `NutritionistRepository` extends `JpaRepository<Nutritionist, UUID>` — no custom queries yet
- `UserRole` enum: NUTRITIONIST, ADMIN
- `HealthController` at `/api/v1/health`
- `CorsConfig` (dev profile only, allows `*` on `/api/**`)
- V1 migration: `nutritionist` table with UUID, email (unique), password_hash, name, role, timestamps
- `build.gradle`: Spring Boot 3.5.0, Java 21, **NO spring-boot-starter-security** (comment says "deferred to Phase 3")
- `application.yml`: PostgreSQL connection, `ddl-auto: validate`, Flyway enabled

### Frontend (exists)

- `authStore.ts`: Zustand store with `isAuthenticated` (localStorage boolean), `login()`, `logout()`, `setAuthView()`
- `LoginView.tsx`: Form with email/password/remember, calls `login()` → `navigate('/home')`
- `SignupView.tsx`: 2-step form (personal data + professional profile), calls `login()` → `navigate('/onboarding')`
- `OnboardingView.tsx`: 6-step wizard (carteira, plano, convite, plano escolha, pagamento, pronto)
- `App.tsx`: Router with `AuthGuard` component (checks `isAuthenticated`), `ThemeSync` for public pages
- `api/client.ts`: Axios instance with TODO comments for JWT interceptor (Phase 3)
- `usePublicTheme.ts`: Forces light theme on public routes (`/`, `/login`, `/signup`, `/onboarding`)

### Gaps to Fill

1. **Backend**: Add Spring Security dependency, SecurityConfig, JwtAuthFilter, JwtService, AuthController (login/signup/refresh/logout), RefreshToken entity & repository, signup validation (email uniqueness), bcrypt password encoding, Flyway V2 migration for refresh tokens + trial fields
2. **Frontend**: Replace localStorage auth with real API calls, add token storage (access in memory, refresh in httpOnly cookie), update authStore with real auth state (user info + tokens), update SignupView to send real data to API, update LoginView to handle real auth errors, update OnboardingView to only show after first signup, add token refresh logic to Axios interceptor

## Technical Decisions

### 1. JWT Strategy

**Decision: HS256 with jjwt 0.12.x, access token 15min, refresh token 7d**

- HS256 (symmetric) is sufficient for a single-server SaaS at our scale
- Access token stored in React state (memory) — NOT localStorage (XSS vulnerability)
- Refresh token stored in httpOnly Secure cookie — server sets via `Set-Cookie` header on login/signup/refresh
- Access token carries: sub (nutritionist UUID), email, role, iat, exp
- Refresh token carries: sub (nutritionist UUID), jti (unique ID for revocation), iat, exp
- Token rotation: on refresh, old refresh token is invalidated (deleted from DB), new pair issued

Why not RS256: Single backend server — no microservices needing token verification. RS256 adds key management complexity with no security benefit at our scale.

### 2. Spring Security Configuration

```java
SecurityFilterChain:
  - JwtAuthFilter before UsernamePasswordAuthenticationFilter
  - Stateless sessions (SessionCreationPolicy.STATELESS)
  - CSRF disabled (stateless JWT, no session cookies)
  - Public endpoints: /api/v1/auth/**, /api/v1/health, /swagger-ui/**
  - All other endpoints require authentication
  - CORS configured for frontend origin (dev: localhost:5173, prod: deployed domain)
```

### 3. Password Hashing

**Decision: BCrypt with strength 10 (default Spring Security)**

Using `PasswordEncoder` bean from Spring Security auto-config. The `Nutritionist` entity already has `passwordHash` column.

### 4. Refresh Token Storage

**Decision: PostgreSQL table `refresh_token` with FK to nutritionist**

- Columns: id (UUID), token_hash (hashed jti), nutritionist_id (FK), expires_at, created_at
- On login: create refresh token, store hash in DB, send raw token in httpOnly cookie
- On refresh: look up by hash, verify not expired, verify nutritionist still active, issue new pair
- On logout: delete all refresh tokens for nutritionist (invalidate all sessions)
- jti is hashed before storage (SHA-256) so DB compromise doesn't leak valid refresh tokens

### 5. Trial Activation

**Decision: Add `trial_ends_at` column to `nutritionist` table via V2 migration**

- On signup, `trial_ends_at = NOW() + 30 days`
- `subscription_tier` column (ENUM: TRIAL, INICIANTE, PROFISSIONAL, ILIMITADO) defaults to TRIAL
- `patient_limit` column (INT) defaults to 15 (trial limit = Iniciante baseline)
- Future Phase 8 (Billing) will add Stripe integration and update these columns

### 6. Frontend Token Management

**Decision: Zustand authStore holds user info + access token in memory; Axios interceptor attaches Bearer token; 401 response triggers refresh**

```
AuthFlow:
1. Login API → { accessToken, user: { id, name, email, role } } + Set-Cookie: refreshToken
2. authStore: { isAuthenticated: true, user, accessToken }
3. Axios request interceptor: attach Authorization: Bearer <accessToken>
4. Axios response interceptor: on 401 → call /auth/refresh → update accessToken → retry
5. On refresh success: new accessToken in memory, new Set-Cookie for refresh
6. On refresh failure: logout (clear store, redirect to /login)
7. Logout: POST /auth/logout → delete refresh cookie → clear store → navigate to /
```

### 7. Onboarding Flow After Real Signup

- Signup creates account with TRIAL tier + trial_ends_at
- Signup response includes tokens (same as login) + `onboardingCompleted: false` flag
- Frontend: if `onboardingCompleted === false` → redirect to `/onboarding` (not `/home`)
- Onboarding completion: POST /api/v1/auth/onboarding → sets `onboardingCompleted = true`
- Add `onboarding_completed` BOOLEAN column to nutritionist (default false)

### 8. Flyway V2 Migration

**Adds to nutritionist table:**
- `crn` VARCHAR(20)
- `crn_regional` VARCHAR(2)
- `specialty` VARCHAR(50)
- `whatsapp` VARCHAR(20)
- `onboarding_completed` BOOLEAN DEFAULT false
- `trial_ends_at` TIMESTAMP
- `subscription_tier` VARCHAR(20) DEFAULT 'TRIAL'
- `patient_limit` INT DEFAULT 15

**Creates refresh_token table:**
- id (UUID PK)
- token_hash (VARCHAR, unique)
- nutritionist_id (UUID FK)
- expires_at (TIMESTAMP)
- created_at (TIMESTAMP)

## API Contract

### POST /api/v1/auth/signup
**Request:** `{ name, email, password, crn, crnRegional, specialty?, whatsapp, terms }`
**Response:** `{ accessToken, user: { id, name, email, role, onboardingCompleted } }` + Set-Cookie: refreshToken
**Errors:** 409 if email exists, 400 if validation fails

### POST /api/v1/auth/login
**Request:** `{ email, password }`
**Response:** `{ accessToken, user: { id, name, email, role, onboardingCompleted } }` + Set-Cookie: refreshToken
**Errors:** 401 if invalid credentials

### POST /api/v1/auth/refresh
**Request:** Cookie: refreshToken
**Response:** `{ accessToken, user: { id, name, email, role, onboardingCompleted } }` + Set-Cookie: new refreshToken
**Errors:** 401 if refresh token invalid/expired

### POST /api/v1/auth/logout
**Request:** Authorization: Bearer <accessToken>
**Response:** 200 OK + Clear-Cookie: refreshToken
**Effect:** Deletes all refresh tokens for this nutritionist

### POST /api/v1/auth/onboarding
**Request:** Authorization: Bearer <accessToken>, `{ step: number }` or completion flag
**Response:** 200 OK
**Effect:** Sets `onboarding_completed = true` for current nutritionist

### GET /api/v1/auth/me
**Request:** Authorization: Bearer <accessToken>
**Response:** `{ id, name, email, role, onboardingCompleted, trialEndsAt, subscriptionTier }`

## Security Considerations

1. **BCrypt** for password hashing — never store or log plain passwords
2. **HS256** JWT secret minimum 256 bits (32 bytes) — from env var `NUTRIAI_JWT_SECRET`
3. **httpOnly + Secure + SameSite=Strict** on refresh token cookie
4. **No token in localStorage** — access token in React state only (memory)
5. **Refresh token rotation** — old token invalidated on each refresh (prevents replay)
6. **Refresh token hash** in DB — SHA-256 of jti before storage
7. **Rate limiting** on login/refresh endpoints (future: bucket limiter, Phase 10)
8. **CORS** — restrict to frontend origin in production (not `*`)
9. **Signup validation** — email format, password min 8 chars, CRN required, terms accepted

## Dependencies to Add

### Backend (build.gradle)
```
implementation 'org.springframework.boot:spring-boot-starter-security'
implementation 'io.jsonwebtoken:jjwt-api:0.12.6'
runtimeOnly 'io.jsonwebtoken:jjwt-impl:0.12.6'
runtimeOnly 'io.jsonwebtoken:jjwt-jackson:0.12.6'
```

### Frontend (package.json)
No new dependencies needed — axios, zustand, react-router already installed.

## Key Risks

1. **Spring Security + existing CorsConfig conflict**: Current `CorsConfig` uses `WebMvcConfigurer`. Spring Security has its own CORS handling. Must configure CORS in `SecurityFilterChain` and potentially remove the `WebMvcConfigurer` version.
2. **Flyway V2 migration on existing DB**: If PostgreSQL already has V1 applied, V2 adds columns with defaults — should be safe (non-destructive ALTER TABLE).
3. **Cookie path/same-site**: Vite dev server (5173) and backend (8080) are on different ports. Cookie `SameSite=Lax` for dev (not Strict, which blocks cross-origin). Production: same domain → `SameSite=Strict`.
4. **Onboarding state persistence**: If user closes browser mid-onboarding, they should resume from where they left off. `onboarding_completed=false` check on login handles this.

---
*Research completed: 2026-04-20*