# Architecture Research: NutriAI

**Research Date:** 2026-04-19
**Confidence:** HIGH (Spring Boot + React patterns well-established; MEDIUM on Evolution API specifics; HIGH on Stripe Brazil integration)

## System Overview

NutriAI is a clinical nutrition SaaS for solo nutritionists in Brazil. The production system consists of four deployable units:

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                               │
│  React + TypeScript + Vite + Tailwind (SPA)                 │
│  ┌──────────┐ ┌───────────┐ ┌──────────┐ ┌───────────────┐  │
│  │ Auth     │ │ Dashboard │ │ Patients │ │ Settings/Plans│  │
│  │ Pages    │ │           │ │          │ │               │  │
│  └────┬─────┘ └─────┬─────┘ └────┬─────┘ └──────┬───────┘  │
│       │              │            │               │          │
│  ┌────┴──────────────┴────────────┴───────────────┴───────┐ │
│  │                API Client Layer (axios/fetch)           │ │
│  │                Auth tokens · Error handling · Types      │ │
│  └────────────────────────┬────────────────────────────────┘ │
└───────────────────────────┼──────────────────────────────────┘
                            │ HTTPS (REST + JSON)
                            ▼
┌───────────────────────────────────────────────────────────────┐
│              Spring Boot API (Java 21)                        │
│  ┌──────────────────────────────────────────────────────────┐│
│  │                    API Gateway Layer                      ││
│  │  JWT Auth Filter · CORS · Rate Limiting · Exception Map  ││
│  └───────┬───────────────┬────────────────┬────────────────┘│
│  ┌───────┴──────┐ ┌──────┴───────┐ ┌──────┴──────────┐     │
│  │  Auth Module │ │ Core Module  │ │ WhatsApp Module  │     │
│  │  JWT, signup │ │ Patients,    │ │ Evolution API   │     │
│  │  login,      │ │ Plans, Foods,│ │ proxy, webhooks, │     │
│  │  sessions    │ │ Biometry,    │ │ AI context,      │     │
│  │              │ │ Insights     │ │ message routing   │     │
│  └──────┬───────┘ └──────┬───────┘ └──────┬───────────┘     │
│  ┌──────┴────────────────┴─────────────────┴───────────┐     │
│  │              Payment Module (Stripe)                  │     │
│  │  Subscriptions · Webhooks · Plan enforcement         │     │
│  └──────────────────────────┬──────────────────────────┘     │
│                             │                                │
│  ┌──────────────────────────┴──────────────────────────┐     │
│  │              Data Layer (JPA Repositories)           │     │
│  └──────────────────────────┬──────────────────────────┘     │
└─────────────────────────────┼────────────────────────────────┘
                              │
          ┌───────────────────┼────────────────────┐
          ▼                   ▼                    ▼
    ┌──────────┐    ┌──────────────────┐    ┌──────────────┐
    │PostgreSQL│    │ Evolution API    │    │  Stripe API  │
    │   (DB)   │    │ (WhatsApp GW)   │    │  (Payments)  │
    └──────────┘    └──────────────────┘    └──────────────┘
```

**Key architectural decisions:**

1. **Monorepo with independent deploys** — `/frontend`, `/backend`, `/docker` with shared scripts at root. No Turborepo/Nx (2 projects don't justify the overhead).
2. **Backend is the single authority** — All data mutations flow through the Spring Boot API. Frontend never talks directly to Evolution API or Stripe.
3. **Backend proxies WhatsApp** — The Spring Boot backend wraps all Evolution API calls. The frontend never calls Evolution API directly. This ensures auth, context isolation, and audit trail.
4. **Single PostgreSQL instance** — One database, nutritionist-isolated via `nutritionist_id` column on every tenant-owned entity. Not schema-per-tenant (overkill for solo nutritionists).
5. **Stripe for payments, not Pagar.me** — Stripe supports BRL, PIX, and boleto, has better Java SDK support, and is widely used for SaaS subscriptions in Brazil.

---

## Component Boundaries

### Component Map

| Component | Responsibility | Talks To | Technology |
|-----------|---------------|----------|------------|
| **Frontend SPA** | UI rendering, user interaction, client-side routing | Backend API | React 18 + TypeScript + Vite + Tailwind |
| **Backend API** | Business logic, auth, data persistence, WhatsApp/AI orchestration, payment processing | PostgreSQL, Evolution API, Stripe API, Frontend | Java 21 + Spring Boot 3.4+ |
| **PostgreSQL** | Persistent data storage — users, patients, plans, meals, conversations, subscriptions | Backend API | PostgreSQL 16+ |
| **Evolution API** | WhatsApp message gateway — QR pairing, send/receive, webhooks | Backend API (webhooks → Backend) | Docker container (Node.js) |
| **Stripe API** | Payment processing, subscription management, webhook events | Backend API (webhooks → Backend) | External SaaS |
| **AI Provider** | LLM inference for patient conversations | Backend API (server-to-server) | OpenAI API or equivalent |

### Communication Patterns

| From → To | Protocol | Direction | Pattern |
|-----------|----------|-----------|---------|
| Frontend → Backend | HTTPS REST (JSON) | Request/Response | Synchronous |
| Backend → Evolution API | HTTPS REST | Request/Response | Synchronous |
| Evolution API → Backend | HTTPS POST (webhook) | Event-driven | Async callback |
| Backend → Stripe API | HTTPS REST | Request/Response | Synchronous |
| Stripe → Backend | HTTPS POST (webhook) | Event-driven | Async callback |
| Backend → AI Provider | HTTPS REST | Request/Response | Synchronous |
| Backend → PostgreSQL | TCP (JDBC) | Request/Response | Synchronous (connection pool) |

---

## Data Flow

### 1. Authentication Flow

```
Browser → POST /api/auth/login {email, password}
                ↓
        Backend validates credentials (BCrypt)
        Generates JWT access token (15min) + Refresh token (7d)
                ↓
        Browser stores access token in memory, refresh token in httpOnly cookie
                ↓
        All subsequent API calls include: Authorization: Bearer <access_token>
                ↓
        Backend: JwtAuthFilter validates token, extracts nutritionist_id
        All repository queries auto-filter by nutritionist_id
```

**Key design:** No session state on server. JWT carries `nutritionist_id` as claim. Refresh token stored in DB for revocation capability.

### 2. Patient Registers Meal via WhatsApp

```
Patient sends WhatsApp message: "Comi um pão de queijo e um café com leite"
                ↓
Evolution API receives message → POST webhook to Backend /api/webhooks/whatsapp
                ↓
Backend: 
  1. Parse webhook payload → extract instance → find associated nutritionist
  2. Look up patient by phone number → find active meal plan
  3. Build AI prompt with: patient's plan, recent meals, nutritionist guidelines
  4. Call AI provider → structured extraction (food items, quantities, macros)
  5. Save meal log to DB (timeline entry with kind="log")
  6. Build contextual response (adherence feedback, suggestions)
  7. Call Evolution API → POST /message/sendText/<instance> back to patient
```

**Key design:** The backend is the orchestrator. It enriches the AI context with the patient's specific meal plan before calling the LLM. The AI never sees information from other nutritionists' patients.

### 3. Nutritionist Creates Meal Plan

```
Nutritionist → Frontend: Edit plan → add meal/option/food
                ↓
POST /api/patients/{id}/plan {meals: [...]}
                ↓
Backend:
  1. Verify nutritionist owns this patient (nutritionist_id check)
  2. Validate meal plan structure (macros, food references)
  3. Persist plan to DB (meals, options, food items)
  4. Return saved plan with computed macros
                ↓
Frontend updates local state with saved plan
```

### 4. Subscription Lifecycle

```
Nutritionist → Frontend: Click "Assinar Profissional"
                ↓
POST /api/subscriptions/checkout {planId: "profissional"}
                ↓
Backend:
  1. Create Stripe Checkout Session (mode: subscription)
  2. Return checkout URL
                ↓
Nutritionist → Stripe hosted checkout → payment → redirect to app
                ↓
Stripe → POST webhook /api/webhooks/stripe
  Event: checkout.session.completed
                ↓
Backend:
  1. Verify webhook signature
  2. Update subscription status → ACTIVE
  3. Set patient_limit based on plan (15/30/unlimited)
  4. Nutritionist can now create patients up to limit
```

---

## Frontend Architecture

### Migration Strategy: CDN React → Vite + TypeScript

The current prototype is a single HTML file loading 14 JSX scripts via Babel standalone with no build step. The migration must:

1. **Preserve all UI** — Every screen, component, and interaction from the prototype must be replicated
2. **Upgrade module system** — From `window` globals to ES modules with proper imports/exports
3. **Upgrade routing** — From state-based `view` switching to React Router with real URLs
4. **Add build pipeline** — Vite for bundling, TypeScript for type safety, Tailwind for styling

### Project Structure

```
frontend/
├── index.html                    # Entry point (Vite)
├── vite.config.ts                # Vite config (proxy, env)
├── tailwind.config.ts            # Tailwind theme (maps CSS vars)
├── tsconfig.json
├── package.json
├── public/
│   └── favicon.svg
└── src/
    ├── main.tsx                  # ReactDOM.createRoot entry
    ├── App.tsx                   # Router setup, auth provider
    ├── api/
    │   ├── client.ts             # Axios instance (base URL, interceptors)
    │   ├── auth.ts               # Login, signup, refresh token
    │   ├── patients.ts           # CRUD + timeline
    │   ├── plans.ts              # Meal plan operations
    │   ├── foods.ts              # Food catalog
    │   ├── insights.ts           # Analytics
    │   └── types.ts              # API response/request types
    ├── auth/
    │   ├── AuthProvider.tsx       # Context provider (user, tokens)
    │   ├── useAuth.ts            # Hook for auth state
    │   ├── ProtectedRoute.tsx     # Redirect to login if unauthenticated
    │   └── LoginPage.tsx         # Login form
    ├── hooks/
    │   ├── usePatients.ts        # Data fetching + mutation hooks
    │   ├── usePlan.ts
    │   ├── useFoods.ts
    │   └── useTheme.ts           # Light/dark theme toggle
    ├── views/
    │   ├── landing/               # LandingView → public route
    │   │   └── LandingView.tsx
    │   ├── auth/                  # Login, Signup, Onboarding
    │   │   ├── LoginView.tsx
    │   │   ├── SignupView.tsx
    │   │   └── OnboardingView.tsx
    │   ├── home/                  # Dashboard
    │   │   └── HomeView.tsx
    │   ├── patients/              # Patient list + detail
    │   │   ├── PatientsView.tsx
    │   │   └── PatientView.tsx
    │   ├── plans/                 # Meal plan editor
    │   │   └── PlansView.tsx
    │   ├── foods/                 # Food catalog
    │   │   └── FoodsView.tsx
    │   └── insights/              # Analytics
    │       └── InsightsView.tsx
    ├── components/
    │   ├── shell/                 # Navigation chrome
    │   │   ├── Rail.tsx
    │   │   ├── Sidebar.tsx
    │   │   └── Topbar.tsx
    │   ├── ui/                    # Shared UI primitives
    │   │   ├── Button.tsx
    │   │   ├── Modal.tsx
    │   │   ├── Pagination.tsx
    │   │   ├── Avatar.tsx
    │   │   └── ...
    │   ├── viz/                   # Data visualizations
    │   │   ├── Ring.tsx
    │   │   ├── MacroRings.tsx
    │   │   ├── Sparkline.tsx
    │   │   └── ...
    │   └── patients/              # Patient-specific components
    │       ├── PatientGrid.tsx
    │       ├── PatientTable.tsx
    │       ├── Timeline.tsx
    │       ├── ExtractionEditor.tsx
    │       └── ...
    ├── icons/
    │   └── index.tsx              # All 29 SVG icons as React components
    └── styles/
        └── globals.css            # Tailwind directives + CSS custom properties
```

### State Management

**Use React's built-in state management. Do NOT add Redux, Zustand, or other global state libraries (yet).**

Rationale:
- The prototype uses prop drilling from a single root, which already works
- For production, add **React Query (TanStack Query)** for server state (API data)
- Use **React Context** only for auth state (token, user, logout)
- Local component state via `useState` for UI concerns (modals, form inputs, filters)
- React Query's cache invalidation handles cross-component data sync without a global store

```
State categories:
┌─────────────────────────────────────────────────────┐
│  Server State (React Query)                         │
│  - Patients list, patient details                    │
│  - Meal plans, food catalog                         │
│  - Insights, biometry history                       │
│  - Subscription status                               │
│  → Fetched from API, cached, auto-invalidated        │
├─────────────────────────────────────────────────────┤
│  Auth State (React Context)                          │
│  - User info, access token, refresh token           │
│  - Login/logout actions                              │
│  → Shared via AuthProvider wrapping the app          │
├─────────────────────────────────────────────────────┤
│  UI State (Component useState)                       │
│  - Theme toggle, sidebar open/closed                │
│  - Active tab, modal open/close, filter values       │
│  - Form inputs                                       │
│  → Local to component, never needs global access    │
└─────────────────────────────────────────────────────┘
```

### Routing (React Router v7)

```
Routes:
/                          → LandingView (public)
/login                     → LoginView (public)
/signup                    → SignupView (public)
/onboarding                → OnboardingView (authenticated)

/dashboard                 → HomeView (authenticated)
/patients                  → PatientsView (authenticated)
/patients/:id              → PatientView (authenticated)
/patients/:id/plan         → PlansView (embedded tab, same route)
/foods                     → FoodsView (authenticated)
/insights                  → InsightsView (authenticated)
/settings                  → SettingsView (authenticated)
/subscription              → SubscriptionView (authenticated)
```

Pattern:
```tsx
// App.tsx
function App() {
  return (
    <AuthProvider>
      <QueryClientProvider>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </AuthProvider>
  );
}

// Protected routes layout
function AuthenticatedLayout() {
  return (
    <div className="app">
      <Rail />
      <Sidebar />
      <main className="main">
        <Topbar />
        <Outlet />
      </main>
    </div>
  );
}
```

### Vite Configuration

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
});
```

Dev CORS handled by Vite proxy. Production: backend serves CORS headers for the deployed frontend origin.

### Tailwind Migration Strategy

**Current state:** 1726 lines of CSS with custom properties (`--ink`, `--paper`, `--lime`, `--coral`, etc.) and `[data-theme="light"/"dark"]` selectors.

**Migration approach:**

1. **Preserve CSS custom properties** — Move `:root` variables into `globals.css` under `@theme` directive
2. **Map existing colors to Tailwind config** — The custom properties become Tailwind theme values:

```typescript
// tailwind.config.ts
export default {
  darkMode: 'class', // use .dark class on <html>
  theme: {
    extend: {
      colors: {
        ink: 'var(--ink)',
        paper: 'var(--paper)',
        lime: { DEFAULT: 'var(--lime)', dim: 'var(--lime-dim)' },
        coral: { DEFAULT: 'var(--coral)', dim: 'var(--coral-dim)' },
        sage: { DEFAULT: 'var(--sage)', dim: 'var(--sage-dim)' },
        amber: 'var(--amber)',
        sky: 'var(--sky)',
        // ... map all existing custom properties
      },
      fontFamily: {
        ui: ['var(--font-ui)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
        serif: ['var(--font-serif)', 'serif'],
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        DEFAULT: 'var(--radius)',
        lg: 'var(--radius-lg)',
      },
    },
  },
};
```

3. **Incremental conversion** — In early phases, keep `styles.css` imported. Gradually replace inline styles with Tailwind utility classes. CSS custom properties + Tailwind utilities can coexist.

---

## Backend Architecture

### Package Structure (Feature-based, not layer-based)

Spring Boot recommends organizing by feature when the domain is cohesive. NutriAI's domain centers around nutritionists managing patients.

```
backend/
├── src/main/java/com/nutriai/
│   ├── NutriAiApplication.java              # @SpringBootApplication
│   │
│   ├── auth/                                 # Authentication & Authorization
│   │   ├── AuthController.java
│   │   ├── AuthService.java
│   │   ├── JwtService.java
│   │   ├── JwtAuthFilter.java
│   │   ├── RefreshTokenRepository.java
│   │   └── dto/
│   │       ├── LoginRequest.java
│   │       ├── LoginResponse.java
│   │       └── SignupRequest.java
│   │
│   ├── nutritionist/                         # Nutritionist profile & settings
│   │   ├── Nutritionist.java                 # Entity
│   │   ├── NutritionistRepository.java
│   │   ├── NutritionistService.java
│   │   └── NutritionistController.java
│   │
│   ├── patient/                              # Patient CRUD & management
│   │   ├── Patient.java
│   │   ├── PatientRepository.java
│   │   ├── PatientService.java
│   │   ├── PatientController.java
│   │   └── dto/
│   │       ├── PatientSummaryResponse.java
│   │       ├── PatientDetailResponse.java
│   │       └── CreatePatientRequest.java
│   │
│   ├── plan/                                 # Meal plans
│   │   ├── MealPlan.java
│   │   ├── Meal.java
│   │   ├── MealOption.java
│   │   ├── FoodItem.java
│   │   ├── PlanRepository.java
│   │   ├── PlanService.java
│   │   ├── PlanController.java
│   │   └── dto/
│   │
│   ├── food/                                 # Food catalog
│   │   ├── Food.java
│   │   ├── FoodRepository.java
│   │   ├── FoodService.java
│   │   ├── FoodController.java
│   │   └── dto/
│   │
│   ├── biometry/                             # Biometric assessments
│   │   ├── Biometry.java
│   │   ├── BiometryRepository.java
│   │   ├── BiometryService.java
│   │   └── BiometryController.java
│   │
│   ├── whatsapp/                             # WhatsApp integration
│   │   ├── WhatsAppWebhookController.java    # Receives Evolution API webhooks
│   │   ├── WhatsAppService.java             # Orchestrates AI + message routing
│   │   ├── EvolutionApiClient.java           # HTTP client for Evolution API
│   │   ├── AiService.java                    # LLM integration
│   │   ├── ConversationService.java          # Manages conversation context
│   │   └── dto/
│   │       ├── WhatsAppIncomingMessage.java
│   │       ├── WhatsAppOutgoingMessage.java
│   │       └── EvolutionWebhookPayload.java
│   │
│   ├── subscription/                         # Payment & plan enforcement
│   │   ├── Subscription.java
│   │   ├── SubscriptionRepository.java
│   │   ├── SubscriptionService.java
│   │   ├── SubscriptionController.java
│   │   ├── StripeService.java                # Stripe API wrapper
│   │   ├── StripeWebhookController.java       # Receives Stripe webhooks
│   │   └── dto/
│   │
│   ├── common/                               # Cross-cutting concerns
│   │   ├── config/
│   │   │   ├── SecurityConfig.java            # Spring Security filter chain
│   │   │   ├── CorsConfig.java
│   │   │   └── JacksonConfig.java
│   │   ├── exception/
│   │   │   ├── GlobalExceptionHandler.java    # @ControllerAdvice
│   │   │   ├── ResourceNotFoundException.java
│   │   │   ├── UnauthorizedException.java
│   │   │   └── PlanLimitExceededException.java
│   │   ├── dto/
│   │   │   ├── ApiResponse.java               # Standard response wrapper
│   │   │   └── PaginatedResponse.java
│   │   └── auditing/
│   │       └── NutritionistIsolationFilter.java # Ensures nutritionist_id scoping
│   │
│   └── insight/                              # Analytics & insights
│       ├── InsightService.java
│       └── InsightController.java
│
├── src/main/resources/
│   ├── application.yml                        # Main config
│   ├── application-dev.yml                    # Dev profile
│   ├── application-prod.yml                   # Prod profile
│   └── db/migration/                           # Flyway migrations
│       ├── V1__create_nutritionist.sql
│       ├── V2__create_patient.sql
│       ├── V3__create_meal_plan.sql
│       ├── V4__create_food_catalog.sql
│       ├── V5__create_biometry.sql
│       ├── V6__create_conversation.sql
│       ├── V7__create_subscription.sql
│       └── V8__create_whatsapp_instance.sql
│
└── src/test/java/com/nutriai/
    ├── auth/
    ├── patient/
    ├── plan/
    └── ...
```

### API Versioning

Use URL path versioning: `/api/v1/...`

Rationale: Simple, explicit, easy to proxy. Header-based versioning adds complexity without benefit for a solo-developer SaaS.

```java
@RestController
@RequestMapping("/api/v1/patients")
public class PatientController {
    // ...
}
```

### DTO Pattern

**Always use DTOs for API boundaries. Never expose JPA entities directly.**

- Request DTOs: `CreatePatientRequest`, `UpdatePlanRequest`
- Response DTOs: `PatientSummaryResponse`, `MealPlanResponse`
- Use MapStruct for entity ↔ DTO mapping (optional but recommended for scale)

### Service Layer Design

```java
@Service
@Transactional(readOnly = true)
public class PatientService {

    private final PatientRepository patientRepository;
    private final NutritionistContext nutritionistContext; // gets current nutritionist from security

    public List<PatientSummaryResponse> listPatients(String status, String search, Pageable pageable) {
        Long nutritionistId = nutritionistContext.getId();
        // All queries ALWAYS filter by nutritionist_id
        return patientRepository.findByNutritionistIdFiltered(nutritionistId, status, search, pageable)
            .map(PatientMapper::toSummaryResponse);
    }

    @Transactional
    public PatientDetailResponse createPatient(CreatePatientRequest request) {
        Long nutritionistId = nutritionistContext.getId();
        subscriptionService.enforcePatientLimit(nutritionistId); // checks plan limit
        Patient patient = PatientMapper.toEntity(request, nutritionistId);
        return PatientMapper.toDetailResponse(patientRepository.save(patient));
    }
}
```

### Error Handling

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(404).body(ApiResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(PlanLimitExceededException.class)
    public ResponseEntity<ApiResponse<Void>> handlePlanLimit(PlanLimitExceededException ex) {
        return ResponseEntity.status(403).body(ApiResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidation(MethodArgumentNotValidException ex) {
        // Collect field errors, return structured validation response
        return ResponseEntity.status(422).body(ApiResponse.validationError(errors));
    }
}
```

Standard API response wrapper:

```java
public record ApiResponse<T>(
    boolean success,
    T data,
    List<String> errors,
    String message
) {
    public static <T> ApiResponse<T> ok(T data) { return new ApiResponse<>(true, data, null, null); }
    public static <T> ApiResponse<T> error(String message) { return new ApiResponse<>(false, null, null, message); }
}
```

---

## Database Design

### ER Diagram (Conceptual)

```
┌─────────────────────┐       ┌─────────────────────────┐
│   nutritionist      │       │   subscription           │
├─────────────────────┤       ├─────────────────────────┤
│ id (PK, UUID)       │──1:1──│ nutritionist_id (FK)     │
│ email (unique)      │       │ stripe_customer_id      │
│ password_hash       │       │ stripe_subscription_id  │
│ name                │       │ plan_type               │
│ crn (registro)      │       │ status                  │
│ phone               │       │ patient_limit           │
│ created_at          │       │ current_period_start    │
│ updated_at          │       │ current_period_end      │
└─────────────────────┘       │ trial_ends_at           │
       │                      │ created_at              │
       │ 1:N                  └─────────────────────────┘
       │
       ▼
┌─────────────────────┐       ┌─────────────────────────┐
│   patient           │       │   whatsapp_instance     │
├─────────────────────┤       ├─────────────────────────┤
│ id (PK, UUID)       │──1:1──│ patient_id (FK)         │
│ nutritionist_id(FK) │       │ evolution_instance_name │
│ name                │       │ instance_api_key        │
│ initials            │       │ status                  │
│ age                 │       │ created_at              │
│ sex                 │       └─────────────────────────┘
│ phone               │              │
│ objective           │              │ 1:N
│ status              │              ▼
│ since               │       ┌─────────────────────────┐
│ adherence           │       │   conversation_message  │
│ created_at          │       ├─────────────────────────┤
│ updated_at          │       │ id (PK, UUID)           │
└─────────────────────┘       │ instance_name (FK)      │
       │                      │ patient_phone           │
       │ 1:N                  │ direction (inbound/out) │
       ├──────────────────┐   │ content                 │
       │                  │   │ ai_processed            │
       ▼                  ▼   │ timestamp               │
┌─────────────────┐ ┌───────────────────┐
│ meal_plan       │ │   biometry        │
├─────────────────┤ ├───────────────────┤
│ id (PK, UUID)  │ │ id (PK, UUID)    │
│ patient_id (FK) │ │ patient_id (FK)  │
│ name            │ │ date             │
│ is_active       │ │ method           │
│ created_at      │ │ weight           │
│ updated_at      │ │ fat_percentage   │
└───────┬─────────┘ │ lean_mass        │
        │ 1:N       │ water_percentage  │
        ▼           │ visceral_fat     │
┌─────────────────┐ │ bmr              │
│ meal            │ │ created_at       │
├─────────────────┤ └───────────────────┘
│ id (PK, UUID)  │
│ plan_id (FK)   │
│ label          │       ┌─────────────────────────┐
│ time           │       │   food_catalog           │
│ sort_order     │       ├─────────────────────────┤
└───────┬─────────┘       │ id (PK, UUID)           │
        │ 1:N             │ nutritionist_id (FK)    │
        ▼                 │ type (base/preset)     │
┌─────────────────┐       │ name                   │
│ meal_option    │       │ category               │
├─────────────────┤       │ base_per_100g (jsonb)  │
│ id (PK, UUID)  │       │ portions (jsonb)        │
│ meal_id (FK)   │       │ used_count              │
│ name           │       │ created_at              │
│ sort_order     │       │ updated_at              │
└───────┬─────────┘       └─────────────────────────┘
        │ 1:N
        ▼
┌─────────────────┐
│ food_item      │
├─────────────────┤
│ id (PK, UUID)  │
│ option_id (FK) │
│ food_id (FK)   │ ← references food_catalog
│ quantity_g     │
│ preparation    │
│ kcal           │
│ prot           │
│ carb           │
│ fat            │
│ sort_order     │
└─────────────────┘

┌─────────────────────────┐
│   meal_log (timeline)   │  ← populated by WhatsApp AI
├─────────────────────────┤
│ id (PK, UUID)           │
│ patient_id (FK)         │
│ date                    │
│ meal_label              │  ( café da manhã, almoço, etc. )
│ kind (plan|log|skipped) │
│ items_json (jsonb)      │
│ macros_json (jsonb)      │
│ adherence_pct           │
│ ai_note                 │
│ source (manual|whatsapp)│
│ created_at              │
└─────────────────────────┘
```

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **UUID primary keys** | No sequential泄露, works well with distributed systems, safe for public-facing APIs |
| **nutritionist_id on every tenant-owned entity** | Simple row-level isolation. Every query includes `WHERE nutritionist_id = ?`. No complex schema-per-tenant or tenant-resolver middleware |
| **JSONB for portions, macros, items** | Semi-structured data that varies by food. Avoids dozens of join tables for minimal query benefit |
| **meal_log as separate table, not modification of meal** | Timeline entries are append-only. Logs track what patient actually ate vs what was planned |
| **whatsapp_instance per patient** | Evolution API uses instance-based isolation. Each patient gets their own instance name, allowing the nutritionist's number to handle multiple patients |
| **Flyway migrations** | Version-controlled schema evolution. Essential for multi-environment (dev/staging/prod) consistency |

### Migration Strategy

1. Start with migration V1 creating `nutritionist` and `patient` tables
2. Build incrementally — add tables as features are implemented
3. Use Flyway's versioned migrations (not repeatable) for DDL
4. Seed data scripts for food catalog (TACO-based Brazilian food data)

---

## WhatsApp Integration Architecture

### How Evolution API Works

Evolution API is a self-hosted Node.js service that acts as a WhatsApp Web bridge. It manages one or more "instances" — each instance is a WhatsApp connection tied to a phone number.

**Key flows:**
1. **Instance creation:** Backend calls `POST /instance/create` → Gets `instanceName` + `apiKey` + QR code
2. **Connection:** Nutritionist scans QR code with their phone → Instance status becomes "open"
3. **Sending:** Backend calls `POST /message/sendText/{instanceName}` to send messages
4. **Receiving:** Evolution API POSTs webhook events to Backend whenever a message arrives
5. **Shared number strategy:** One WhatsApp number per nutritionist (not per patient). The system routes based on the patient's phone number in the webhook payload.

### Instance Management

```
┌──────────────────────────────────────────────────────┐
│ Nutritionist Signup                                   │
│   1. Create account → Backend creates Stripe customer │
│   2. Onboarding → Backend creates Evolution instance  │
│      POST /instance/create → {instanceName, apiKey}   │
│   3. Nutritionist scans QR code with their phone      │
│   4. Webhook: CONNECTION_UPDATE → status: "open"       │
│   5. Backend stores instance_name + api_key per        │
│      nutritionist in DB                                │
│                                                        │
│ Nutritionist sends link to patient:                   │
│   "Olá! Use este link para conversar comigo:"          │
│   https://wa.me/55119XXXXXXXX?text=Olá                  │
│                                                        │
│ Patient sends WhatsApp message:                       │
│   1. Evolution API receives message                    │
│   2. POST webhook → Backend /api/v1/webhooks/whatsapp  │
│   3. Backend matches phone → patient → nutritionist    │
│   4. Backend builds AI context from patient's plan     │
│   5. Backend calls AI, gets response                   │
│   6. Backend calls Evolution API to send response      │
└──────────────────────────────────────────────────────┘
```

### Webhook Processing Pipeline

```java
@Component
public class WhatsAppWebhookProcessor {

    // Step 1: Receive and validate webhook
    public void processIncomingMessage(EvolutionWebhookPayload payload) {
        // Verify webhook authenticity (API key header)
        // Extract instanceName, sender phone, message content
    }

    // Step 2: Resolve nutritionist and patient
    private ResolvedContext resolveContext(String instanceName, String senderPhone) {
        // Find nutritionist by instance_name
        // Find patient by phone number belonging to that nutritionist
        // If patient not found → send default message "fale com seu nutricionista"
    }

    // Step 3: Build AI context
    private String buildAiPrompt(Patient patient, MealPlan activePlan, List<MealLog> recentMeals) {
        // Include: patient objectives, active meal plan, today's meals so far,
        // nutritionist's guidelines, recent conversation
    }

    // Step 4: Call AI and parse structured response
    private AiResponse callAi(String prompt) {
        // OpenAI API call with structured output
        // Parse: food items extracted, macros calculated, adherence note
    }

    // Step 5: Persist and respond
    private void saveAndRespond(AiResponse ai, Patient patient, String instanceName) {
        // Save MealLog entry
        // Send text response back via Evolution API
    }
}
```

### AI Context Isolation

**Critical security requirement:** Each AI call MUST only include context from the specific patient's data. Never cross-pollinate between nutritionists or patients.

```
AI Prompt Construction:
├── System prompt: "You are a nutrition assistant for [patient name]..."
├── Patient info: objectives, restrictions, allergies
├── Active meal plan: today's planned meals with macros
├── Recent meal logs: what the patient has eaten today
├── Nutritionist guidelines: custom instructions from the nutritionist
└── Conversation history: last N messages from this patient
```

---

## Payment Architecture

### Stripe Integration (Brazilian Market)

**Why Stripe over Pagar.me:**
- Superior Java SDK (official, well-documented, type-safe)
- BRL support with PIX and boleto
- Better webhook reliability for subscription lifecycle
- More mature subscription management (Customer Portal)
- Global SaaS standard — easier to find examples and support

**Brazilian payment methods to support:**
- **Credit card** — Primary method, immediate confirmation
- **PIX** — Instant payment, very popular in Brazil (Stripe supports via Checkout)
- **Boleto** — Bank slip, 1-3 day confirmation delay (available but lower priority)

### Subscription Lifecycle

```
States:
  TRIAL      → 30 days free, full access
  ACTIVE     → Paid subscription, access by plan limits
  PAST_DUE   → Payment failed, grace period (7 days)
  CANCELED   → Access ends at period end
  EXPIRED    → Access revoked, data preserved 90 days

Transitions:
  Signup → TRIAL (30 days)
  Trial ending → ACTIVE (first payment)
  Payment success → ACTIVE (renewal)
  Payment failure → PAST_DUE 
  PAST_DUE + 7 days → EXPIRED
  User cancel → CANCELED (access until period end)
  CANCELED + period end → EXPIRED
  Reactivation → ACTIVE
```

### Stripe Webhook Events to Handle

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Activate subscription after checkout |
| `invoice.paid` | Extend access period, update DB |
| `invoice.payment_failed` | Mark subscription as PAST_DUE, notify nutritionist |
| `customer.subscription.updated` | Sync plan changes (upgrade/downgrade) |
| `customer.subscription.deleted` | Mark subscription as CANCELED/EXPIRED |
| `payment_intent.succeeded` | Confirm one-time payment (if needed) |

### Plan Enforcement

Every patient-creating operation checks the subscription:

```java
@Service
public class SubscriptionService {

    public void enforcePatientLimit(Long nutritionistId) {
        Subscription sub = subscriptionRepository.findByNutritionistId(nutritionistId);
        if (sub.getStatus() == EXPIRED || sub.getStatus() == CANCELED) {
            throw new SubscriptionRequiredException();
        }
        int currentPatients = patientRepository.countByNutritionistId(nutritionistId);
        if (currentPatients >= sub.getPatientLimit()) {
            throw new PlanLimitExceededException(sub.getPlanType(), sub.getPatientLimit());
        }
    }
}
```

---

## Authentication & Authorization

### JWT Flow

```
┌──────────┐                          ┌──────────┐
│  Browser │                          │  Backend │
└────┬─────┘                          └────┬─────┘
     │  POST /api/v1/auth/login            │
     │  { email, password }                │
     │────────────────────────────────────►│
     │                                      │
     │  ← 200 { accessToken, refreshToken } │
     │     (access: 15min, refresh: 7d)     │
     │◄─────────────────────────────────────│
     │                                      │
     │  GET /api/v1/patients                │
     │  Authorization: Bearer <access>      │
     │────────────────────────────────────►│
     │                                      │
     │  ← 200 { patients... }              │
     │◄─────────────────────────────────────│
     │                                      │
     │  (15 minutes later, access expired)  │
     │                                      │
     │  POST /api/v1/auth/refresh           │
     │  { refreshToken }                    │
     │────────────────────────────────────►│
     │                                      │
     │  ← 200 { newAccessToken }           │
     │◄─────────────────────────────────────│
```

### Spring Security Configuration

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable()) // API uses JWT, not cookies
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(sm -> sm.sessionCreationPolicy(STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/v1/auth/**").permitAll()
                .requestMatchers("/api/v1/webhooks/**").permitAll() // webhook signatures verified separately
                .requestMatchers("/api/v1/landing/**").permitAll()
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}
```

### Nutritionist Isolation

**No multi-tenancy middleware.** Simple `nutritionist_id` column filtering on every query.

Every secured endpoint extracts `nutritionist_id` from the JWT token. Repository methods always include `findByNutritionistId(...)` or `@Query("WHERE n.id = :nutritionistId AND ...")`.

This means:
- A nutritionist can NEVER see another nutritionist's patients, plans, or data
- No shared database schemas
- No tenant resolver overhead
- Simple, auditable, and correct

---

## Suggested Build Order

The build order is determined by component dependencies — what must exist before other things can work.

### Phase 1: Foundation (Weeks 1-2)

**Deliverable:** Running monorepo with frontend scaffold, backend scaffold, PostgreSQL, and Docker Compose.

| # | Component | What | Why First |
|---|-----------|------|-----------|
| 1 | Monorepo setup | `/frontend`, `/backend`, `/docker` + root scripts | Everything depends on project structure |
| 2 | Docker Compose | PostgreSQL + backend + Evolution API containers | Local dev environment works end-to-end |
| 3 | Backend skeleton | Spring Boot 3.4+, Java 21, Flyway, SecurityConfig, CORS | All backend work needs this foundation |
| 4 | Frontend scaffold | Vite + React + TypeScript + Tailwind + React Router | All frontend work needs this foundation |
| 5 | Auth endpoints | `/auth/signup`, `/auth/login`, `/auth/refresh`, JWT | Every other endpoint needs auth context |
| 6 | Auth frontend | Login, Signup pages, AuthProvider, ProtectedRoute | Can't build authenticated views without auth |

**Critical pitfall:** Don't skip Flyway migrations from day one. Schema changes in code review, not manual DB edits.

### Phase 2: Core Domain (Weeks 3-5)

**Deliverable:** Nutritionist can log in, manage patients, create meal plans, browse food catalog.

| # | Component | What | Why This Order |
|---|-----------|------|----------------|
| 7 | Nutritionist CRUD | Profile, settings | Needed before patients (nutritionist is the owner) |
| 8 | Patient CRUD | Create, list, detail, edit, status | Central entity, everything depends on it |
| 9 | Food catalog | Base foods, presets, categories, search | Plans reference foods |
| 10 | Meal plans | Create/edit plans with meals, options, food items | Depends on patients and foods |
| 11 | Biometry | Record biometric assessments | Depends on patients |
| 12 | Frontend migration | Port all authenticated views from prototype | UI already designed, needs real API |

**Critical pitfall:** Always include `nutritionist_id` filtering from the first query. It's much harder to retrofit row-level security than to build it in from day one.

### Phase 3: WhatsApp Intelligence (Weeks 6-8)

**Deliverable:** Patient can chat via WhatsApp, AI responds with meal plan context, meal logs appear in timeline.

| # | Component | What | Why This Order |
|---|-----------|------|----------------|
| 13 | Evolution API setup | Instance creation, QR connection, webhook config | Can't receive messages without gateway |
| 14 | Webhook receiver | Parse incoming WhatsApp messages | Need incoming messages before AI |
| 15 | AI service | Context building → LLM call → response | Depends on patient data and plan context |
| 16 | Message orchestrator | WhatsApp incoming → AI → WhatsApp outgoing | Ties webhook + AI + sending together |
| 17 | Meal log ingestion | AI-parsed meals → meal_log table | Persist AI-extracted data |
| 18 | Timeline frontend | Display meal logs in patient detail view | Visualize WhatsApp-collected data |

**Critical pitfall:** Set up NGROK or similar tunneling for local webhook testing early. Evolution API needs a real URL to POST to.

### Phase 4: Payment & Subscription (Weeks 9-10)

**Deliverable:** Nutritionist can subscribe, pay, and has plan-based patient limits enforced.

| # | Component | What | Why This Order |
|---|-----------|------|----------------|
| 19 | Stripe setup | Products, prices, customer portal config | Need Stripe products before checkout |
| 20 | Checkout flow | Frontend → Stripe Checkout → success webhook | Core payment UX |
| 21 | Webhook handler | Process Stripe events → update subscription status | Critical for reliable payment state |
| 22 | Plan enforcement | Check subscription before creating patients | Must prevent free-tier abuse |
| 23 | Subscription UI | Plan selection, status, upgrade/downgrade | Frontend for subscription lifecycle |

**Critical pitfall:** Always verify Stripe webhook signatures. Never trust client-side payment confirmation.

### Phase 5: Polish & Launch (Weeks 11-12)

| # | Component | What |
|---|-----------|------|
| 24 | Landing page | Migrate from prototype, connect to real signup |
| 25 | Onboarding flow | Connect to real instance creation + WhatsApp setup |
| 26 | LGPD compliance | Privacy policy, terms, consent, data export |
| 27 | CI/CD | GitHub Actions → VPS deploy |
| 28 | Monitoring | Health checks, error tracking, logging |

### Build Dependency Graph

```
Phase 1:  Monorepo → Docker → Backend Skeleton → Frontend Scaffold → Auth
                │                                                              │
                ├──────────────────────────────────────────────────────────────┘
                ▼
Phase 2:  Nutritionist → Patients → Food Catalog → Meal Plans → Biometry
                │                                                      │
                ├──────────────────────────────────────────────────────┘
                ▼
Phase 3:  Evolution API Setup → Webhook Receiver → AI Service → Orchestrator → Meal Log → Timeline UI
                │                                                                              │
                ▼
Phase 4:  Stripe Setup → Checkout → Webhooks → Plan Enforcement → Subscription UI
                │
                ▼
Phase 5:  Landing Page → Onboarding → LGPD → CI/CD → Monitoring
```

---

## Patterns to Follow

### Pattern 1: Repository with Nutritionist Scoping
**What:** Every JPA repository query includes `nutritionist_id` as a WHERE clause parameter.  
**When:** Always, for any entity owned by a nutritionist.  
**Why:** This is the data isolation boundary. Missing it means data leaks between nutritionists.

```java
@Repository
public interface PatientRepository extends JpaRepository<Patient, UUID> {
    List<Patient> findByNutritionistId(Long nutritionistId);
    Optional<Patient> findByIdAndNutritionistId(UUID id, Long nutritionistId);
    int countByNutritionistId(Long nutritionistId);
}
```

### Pattern 2: DTO Boundary
**What:** JPA entities never leave the service layer. Controllers always receive/return DTOs.  
**When:** Every API endpoint.  
**Why:** Decouples API contract from database schema, prevents over-posting, enables independent evolution.

### Pattern 3: Webhook Verification
**What:** Incoming webhooks (Evolution API, Stripe) are verified with signature/header validation before processing.  
**When:** Every webhook endpoint.  
**Why:** Prevents spoofed events from corrupting data or triggering unauthorized actions.

### Pattern 4: Optimistic Locking
**What:** JPA `@Version` on entities that can be concurrently edited (meal plans, patient records).  
**When:** Any entity with update operations that may have concurrent editors.  
**Why:** Prevents lost updates when nutritionist edits in the browser while AI updates meal logs.

```java
@Entity
public class MealPlan {
    @Version
    private Long version;
    // ...
}
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Fat Controllers
**What:** Business logic in `@RestController` methods  
**Why bad:** Can't be reused, can't be tested in isolation, mixes HTTP concerns with domain logic  
**Instead:** Keep controllers thin — delegate to `@Service` classes

### Anti-Pattern 2: God Object Patient
**What:** Putting all patient-related data (biometry, plans, meals, conversations) into one massive entity  
**Why bad:** Becomes unmaintainable, slow queries loading unnecessary data, merge conflicts  
**Instead:** Separate aggregates — Patient, MealPlan, Biometry, Conversation are independent entities linked by `patient_id`

### Anti-Pattern 3: Frontend Calls Evolution API Directly
**What:** Frontend making HTTP calls directly to Evolution API  
**Why bad:** Exposes API keys, no auth context, can't enforce nutritionist isolation, no audit trail  
**Instead:** Backend proxies all Evolution API calls. Frontend only talks to Backend API.

### Anti-Pattern 4: Global React State for API Data
**What:** Storing patients, plans, foods in a global Zustand/Redux store  
**Why bad:** Stale data, complex cache invalidation, duplicate server state  
**Instead:** Use TanStack Query for server state. Local state only for UI concerns.

### Anti-Pattern 5: Skipping Migrations
**What:** Manually altering the database schema or using `spring.jpa.hibernate.ddl-auto=update`  
**Why bad:** Schema drifts between environments, no rollback capability, production surprises  
**Instead:** Always use Flyway versioned migrations. Run them in CI.

---

*Architecture research: 2026-04-19*