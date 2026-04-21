---
phase: 03-authentication-onboarding
plan: 02
subsystem: auth
tags: [jwt, zustand, axios, react-router, interceptors, auth-flow]

# Dependency graph
requires:
  - phase: 03-01
    provides: Backend auth API endpoints (signup, login, refresh, logout, me, onboarding)
provides:
  - Frontend JWT auth module (auth.ts API calls, client.ts interceptors, authStore.ts real auth state)
  - LoginView wired to POST /api/v1/auth/login
  - SignupView wired to POST /api/v1/auth/signup
  - OnboardingView wired to POST /api/v1/auth/onboarding
  - AuthGuard and RedirectIfAuthenticated route protection in App.tsx
  - InitializeAuth component for token validation on app load
affects: [03-03, 04-patients, 08-billing]

# Tech tracking
tech-stack:
  added: [zustand/middleware persist]
  patterns: [JWT access token in memory only, refresh token in httpOnly cookie, 401 interceptor with refresh queue, Zustand persist for user info hydration]

key-files:
  created:
    - frontend/src/api/auth.ts
  modified:
    - frontend/src/types/index.ts
    - frontend/src/api/types.ts
    - frontend/src/api/client.ts
    - frontend/src/stores/authStore.ts
    - frontend/src/views/LoginView.tsx
    - frontend/src/views/SignupView.tsx
    - frontend/src/views/OnboardingView.tsx
    - frontend/src/App.tsx

key-decisions:
  - "Access token stored in Zustand in-memory state (NOT localStorage) to prevent XSS theft"
  - "User info persisted via zustand/middleware persist for hydration across page refreshes"
  - "Old nutriai.auth localStorage key cleaned up in initializeAuth"
  - "401 responses trigger refresh with request queue to avoid race conditions"
  - "OnboardingView calls completeOnboarding API only on final step, navigates home even on API failure"

patterns-established:
  - "Auth API module pattern: thin wrappers around apiClient that return typed responses"
  - "Auth store pattern: Zustand with persist for user hydration, in-memory for sensitive tokens"
  - "Route guard pattern: AuthGuard protects authenticated routes, RedirectIfAuthenticated protects public routes"
  - "Token refresh pattern: Axios 401 interceptor with isRefreshing flag and failedQueue to prevent duplicate refresh calls"

requirements-completed: [AUTH-01, AUTH-02, AUTH-03, AUTH-05]

# Metrics
duration: 12min
completed: 2026-04-21
---

# Phase 3 Plan 2: Wire Frontend Auth Views to Real API Summary

**JWT auth flow with Axios interceptors, Zustand persist, and route guards replacing mock localStorage auth**

## Performance

- **Duration:** 12 min
- **Started:** 2026-04-21T00:59:51Z
- **Completed:** 2026-04-21T01:12:15Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Created auth API module (auth.ts) with signup, login, refresh, logout, getCurrentUser, and completeOnboarding functions
- Replaced mock localStorage auth with real JWT auth: access token in memory, user info persisted via zustand/middleware
- Axios client updated with Bearer token request interceptor and 401 response interceptor with refresh queue
- LoginView, SignupView, OnboardingView wired to real API endpoints with loading states and error handling
- App.tsx route guards: AuthGuard redirects unauthenticated users, RedirectIfAuthenticated redirects authenticated users, InitializeAuth validates tokens on load

## Task Commits

Each task was committed atomically:

1. **task 1: Create auth API module and refactor authStore for real JWT authentication** - `61739ee` (feat)
2. **task 2: Wire LoginView, SignupView, OnboardingView, and App.tsx to real auth** - `123c77b` (feat)

## Files Created/Modified
- `frontend/src/api/auth.ts` - Auth API functions (signup, login, refresh, logout, getCurrentUser, completeOnboarding)
- `frontend/src/api/client.ts` - Axios instance with JWT request interceptor and 401 refresh response interceptor
- `frontend/src/api/types.ts` - Added auth type re-exports
- `frontend/src/types/index.ts` - Added AuthUser, LoginRequest, SignupRequest, AuthResponse, MeResponse types
- `frontend/src/stores/authStore.ts` - Refactored from mock localStorage to real JWT auth with Zustand persist
- `frontend/src/views/LoginView.tsx` - async login with email/password, loading/error states
- `frontend/src/views/SignupView.tsx` - async signup with real API call, navigates to /onboarding
- `frontend/src/views/OnboardingView.tsx` - calls completeOnboarding API on final step
- `frontend/src/App.tsx` - AuthGuard, RedirectIfAuthenticated, InitializeAuth components

## Decisions Made
- Access token stored in Zustand state (in memory) — NOT localStorage — to prevent XSS theft (threat model T-03-08)
- User info (id, name, email, role, onboardingCompleted) persisted to localStorage via zustand/middleware persist for hydration across page refreshes
- 401 interceptor uses isRefreshing flag + failedQueue array to prevent duplicate refresh calls when multiple requests fail simultaneously
- Backend validation (Spring @Valid) is the source of truth for form validation; frontend validation is UX convenience only (threat model T-03-10 accept disposition)
- OnboardingView navigates to /home even if completeOnboarding API fails (defensive UX)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript type error in OnboardingView**
- **Found during:** task 2 (wiring OnboardingView)
- **Issue:** `MeResponse.role` is `string` but `AuthUser.role` is `'NUTRITIONIST' | 'ADMIN'` — direct spread caused type mismatch
- **Fix:** Cast `role` with `as AuthUser['role']` when updating user state from MeResponse
- **Files modified:** `frontend/src/views/OnboardingView.tsx`
- **Verification:** `npx tsc --noEmit` passes with zero errors
- **Committed in:** 123c77b (part of task 2 commit)

**2. [Rule 1 - Bug] Removed unused `navigate` import in LoginView**
- **Found during:** task 2 (wiring LoginView)
- **Issue:** `navigate` was imported but never used since authStore state changes trigger route changes via AuthGuard
- **Fix:** Removed `useNavigate` import and `navigate` variable from LoginView
- **Files modified:** `frontend/src/views/LoginView.tsx`
- **Verification:** `npx tsc --noEmit` passes with zero errors
- **Committed in:** 123c77b (part of task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 bugs)
**Impact on plan:** Both fixes were minor TypeScript issues that arose from the plan's type definitions. No scope creep.

## Issues Encountered
None — all TypeScript compilation and production build checks passed on first attempt after the two auto-fixes.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Auth flow is complete on the frontend side: signup, login, logout, refresh, and onboarding
- Ready for Plan 03-03 (if any) or Phase 4 (Patients CRUD) which can now make authenticated API calls via `apiClient`
- The `Authorization: Bearer <token>` header is automatically attached by the Axios interceptor for all authenticated requests
- Note: Backend must be running for auth endpoints to work (CORS and Vite proxy must be configured)

---
*Phase: 03-authentication-onboarding*
*Completed: 2026-04-21*

## Self-Check: PASSED

- Commit 61739ee: Found in git log ✓
- Commit 123c77b: Found in git log ✓
- frontend/src/api/auth.ts: Created ✓
- frontend/src/api/client.ts: Modified ✓
- frontend/src/stores/authStore.ts: Modified ✓
- frontend/src/types/index.ts: Modified ✓
- frontend/src/views/LoginView.tsx: Modified ✓
- frontend/src/views/SignupView.tsx: Modified ✓
- frontend/src/views/OnboardingView.tsx: Modified ✓
- frontend/src/App.tsx: Modified ✓
- `npx tsc --noEmit`: Zero errors ✓
- `npm run build`: Production build succeeds ✓