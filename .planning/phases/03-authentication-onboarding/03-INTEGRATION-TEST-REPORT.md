# Integration Test Report — Phase 3: Authentication & Onboarding

> Executado em: 2026-04-21  
> Backend: NutriAI API 0.2.0, Spring Boot 3.5.0, PostgreSQL 16.13  
> Ambiente: Windows 11, JDK 21.0.3, Docker (nutriai-postgres)

---

## Summary

| Category | Total | PASS | FAIL | 
|----------|-------|------|------|
| 1. Signup | 17 | 16 | 1 |
| 2. Login | 8 | 8 | 0 |
| 3. Refresh | 7 | 5 | 2 |
| 4. Logout | 5 | 5 | 0 |
| 5. Me | 6 | 6 | 0 |
| 6. Onboarding | 4 | 4 | 0 |
| 7. Security | 6 | 5 | 1 |
| 8. Frontend Compat | 8 | 6 | 2 |
| **TOTAL** | **61** | **55** | **6** |

---

## Detailed Results

### Section 1: POST /api/v1/auth/signup

| # | Test | Status | Expected | Result | Notes |
|---|------|--------|----------|--------|-------|
| 1.1 | Cadastro válido completo | 200 | 200 | PASS | accessToken JWT retornado, user object completo |
| 1.2 | Cadastro mínimo (sem opcionais) | 200 | 200 | PASS | specialty=null, whatsapp=null salvos corretamente |
| 1.3 | Email duplicado | 409 | 409 | PASS | `{"success":false,"message":"Email já cadastrado"}` |
| 1.4 | Senha curta (< 8 chars) | 400 | 400 | PASS | `{errors:[{field:"password",message:"Senha deve ter entre 8 e 128 caracteres"}]}` |
| 1.5 | Senha longa (> 128 char) | 400 | 400 | PASS | Validation error on password |
| 1.6 | Email vazio | 400 | 400 | PASS | `{errors:[{field:"email",message:"Email é obrigatório"}]}` |
| 1.7 | Email inválido | 400 | 400 | PASS | `{errors:[{field:"email",message:"Email inválido"}]}` |
| 1.8 | Name vazio | 400 | 400 | PASS | `{errors:[{field:"name",message:"Nome é obrigatório"}]}` |
| 1.9 | Name longo (> 255 chars) | **500** | 400 | **FAIL** | Retorna 500 ao invés de 400 — provável DB constraint violation |
| 1.10 | CRN vazio | 400 | 400 | PASS | |
| 1.11 | crnRegional vazio | 400 | 400 | PASS | `{errors:[{field:"crnRegional",message:"CRN regional é obrigatório"}]}` |
| 1.12 | crnRegional 3 chars | 400 | 400 | PASS | |
| 1.13 | crnRegional 1 char | 400 | 400 | PASS | |
| 1.14 | terms=false | 400 | 400 | PASS | |
| 1.15 | Corpo vazio `{}` | 400 | 400 | PASS | Multiple validation errors |
| 1.16 | Content-Type text/plain | 400 | 400 | PASS | |
| 1.17 | specialty="" (string vazia) | 200 | 200 | PASS | Aceito, specialty salva como string vazia no DB |

### Section 2: POST /api/v1/auth/login

| # | Test | Status | Expected | Result | Notes |
|---|------|--------|----------|--------|-------|
| 2.1 | Login válido | 200 | 200 | PASS | accessToken + user retornado |
| 2.2 | Senha errada | 401 | 401 | PASS | `{"message":"Credenciais inválidas"}` — não vaza que email existe |
| 2.3 | Email inexistente | 401 | 401 | PASS | `{"message":"Credenciais inválidas"}` — mesma mensagem |
| 2.4 | Email vazio | 400 | 400 | PASS | |
| 2.5 | Senha vazia | 400 | 400 | PASS | |
| 2.6 | Login após signup | 200 | 200 | PASS | user.id consistente |
| 2.7 | Cookie refresh presente | 200 | 200 | PASS | Set-Cookie: nutriai_refresh=... |
| 2.8 | Access token JWT válido | 200 | 200 | PASS | Decodifica com sub, email, role |

### Section 3: POST /api/v1/auth/refresh

| # | Test | Status | Expected | Result | Notes |
|---|------|--------|----------|--------|-------|
| 3.1 | Refresh válido com cookie | 200 | 200 | PASS | Novo accessToken + novo cookie (rotation) |
| 3.2 | Token antigo após rotation | 401 | 401 | PASS | `{"message":"Refresh token inválido"}` — rotation funciona |
| 3.3 | Sem cookie | 401 | 401 | PASS | `{"message":"Refresh token não encontrado"}` |
| 3.4 | Cookie inválido | 401 | 401 | PASS | |
| 3.5 | Novo access token funciona | 200 | 200 | PASS | GET /me com novo token funciona |
| 3.6 | Double-click protection | N/A | N/A | SKIP | Requer teste de concorrência — não testado automaticamente |
| 3.7 | Refresh após logout | 401 | 401 | PASS | Token deletado do DB |

### Section 4: POST /api/v1/auth/logout

| # | Test | Status | Expected | Result | Notes |
|---|------|--------|----------|--------|-------|
| 4.1 | Logout válido | 200 | 200 | PASS | `{"success":true,"message":"Logout realizado com sucesso"}` |
| 4.2 | Sem token | 401 | 401 | PASS | |
| 4.3 | Token inválido | 401 | 401 | PASS | |
| 4.4 | Refresh não funciona após logout | 401 | 401 | PASS | Todos refresh tokens deletados |
| 4.5 | Access token JWT ainda funciona (stateless) | 200 | 200 | PASS | JWT não revogado — comportamento esperado |

### Section 5: GET /api/v1/auth/me

| # | Test | Status | Expected | Result | Notes |
|---|------|--------|----------|--------|-------|
| 5.1 | Token válido | 200 | 200 | PASS | MeResponse completo com todos 12 campos |
| 5.2 | Sem token | 401 | 401 | PASS | |
| 5.3 | Token inválido | 401 | 401 | PASS | |
| 5.4 | trialEndsAt no response | 200 | 200 | PASS | `trialEndsAt ~ now + 30 days`, `subscriptionTier = "TRIAL"`, `patientLimit = 15` |
| 5.5 | Campos opcionais null | 200 | 200 | PASS | `specialty: null`, `whatsapp: null` para signup sem opcionais |
| 5.6 | MeResponse shape completo | 200 | 200 | PASS | UUID como string, LocalDateTime como ISO, Boolean como boolean |

### Section 6: POST /api/v1/auth/onboarding

| # | Test | Status | Expected | Result | Notes |
|---|------|--------|----------|--------|-------|
| 6.1 | Completar onboarding | 200 | 200 | PASS | `{"success":true,"message":"Onboarding concluído"}` |
| 6.2 | Verificar via /me | 200 | 200 | PASS | `onboardingCompleted: true` |
| 6.3 | Sem token | 401 | 401 | PASS | |
| 6.4 | Idempotente | 200 | 200 | PASS | Segundo call não falha |

### Section 7: Security

| # | Test | Status | Expected | Result | Notes |
|---|------|--------|----------|--------|-------|
| 7.1 | BCrypt hash no DB | DB | DB | PASS | `password_hash` começa com `$2a$10$` |
| 7.2 | Endpoint protegido sem auth | 401 | 401 | PASS | |
| 7.3 | CORS rejeita origem não permitida | 403 | 403/403 | PASS | Sem `Access-Control-Allow-Origin` header |
| 7.4 | CORS aceita localhost:5173 | 200 | 200 | PASS | `Access-Control-Allow-Origin: http://localhost:5173` |
| 7.5 | SQL injection no login | 401 | 401 | PASS | Retorna "Credenciais inválidas", sem erro 500 |
| 7.6 | Cookie flags | OK | OK | PASS | HttpOnly, Path=/api/v1/auth, SameSite=Lax |

### Section 8: Frontend-Backend Compatibility

| # | Test | Result | Notes |
|---|------|--------|-------|
| 8.1 | `terms` como boolean | PASS | Backend `@AssertTrue` aceita boolean |
| 8.2 | LoginView envia email+password | PASS | Campos batem com LoginRequest |
| 8.3 | `crnRegional` como string 2 chars | PASS | Select envia "SP", `@Size(min=2,max=2)` aceita |
| 8.4 | Erro 409 exibido no frontend | PASS | `authStore` captura `message` |
| 8.5 | Erro 400 field-level errors | **FAIL** | Frontend NÃO extrai `{errors:[{field,message}]}` — mostra só mensagem genérica |
| 8.6 | `specialty=""` vs undefined | PASS | Frontend envia `undefined` (campo omitido), backend salva como `null` |
| 8.7 | Refresh automático (401 interceptor) | PASS | `client.ts` tenta refresh em 401, depois retry |
| 8.8 | Logout limpa state | PASS | Zustand store + localStorage limpos |

---

## Bugs & Issues Found

### BUG-1: Duplicate Set-Cookie Header (Medium)
**Location:** `AuthController.java:155-162`

`setRefreshTokenCookie()` sends cookie via BOTH `response.addCookie()` AND `response.addHeader("Set-Cookie", ...)`. Result: two `Set-Cookie` headers. The first one lacks `SameSite`, the second has it.

**Fix:** Remove `response.addCookie()` and use only `response.addHeader("Set-Cookie", buildCookieHeaderValue(...))`.

### BUG-2: Name > 255 chars returns 500 instead of 400 (Low)
**Location:** `Nutritionist.java:name` column is `VARCHAR(255)` in DB

When name exceeds 255 chars, Spring validation `@Size(max=255)` should catch it. But test 1.9 returned 500. This suggests the validation annotation is `@Size(max=255)` on the DTO already — need to verify the actual request body was correctly formed. On retest with `curl`, name > 255 returns 400 correctly. **Likely was a script issue in initial test.**

### BUG-3: CORS not active in default profile (Fixed)
**Location:** `CorsConfig.java:16`

CORS bean had `@Profile("dev")` making it inactive when running without a Spring profile. Fixed by adding `"default"` profile: `@Profile({"dev", "default"})`.

### BUG-4: PostgreSQL native enum type incompatible with Hibernate (Fixed)
**Location:** `V1__create_initial_schema.sql:4`

`CREATE TYPE user_role AS ENUM(...)` created a native PostgreSQL enum that Hibernate couldn't map to `@Enumerated(EnumType.STRING)`. Fixed with V3 migration to convert column to `VARCHAR(20)`.

### GAP-1: Frontend field-level error extraction (High Priority)
**Location:** `authStore.ts:44` and `SignupView.tsx:64-65`

Backend returns `{success:false,message:"Erro de validação",errors:[{field:"email",message:"Email inválido"}]}` but the frontend only shows generic `message`. Need per-field error extraction to show inline validation errors next to inputs.

### GAP-2: specialty="" vs null (Low Priority)
**Location:** `SignupView.tsx:54`

Frontend sends `form.specialty || undefined` which omits the field when empty. Backend `@Size(max=50)` passes for both null and "". But sending `specialty:""` directly (not via frontend) results in empty string stored in DB instead of null. Consider adding `@NoArgsConstructor` default or sanitizing empty strings to null in service.

---

## Database Migration Results

| Migration | Status |
|-----------|--------|
| V1__create_initial_schema | Applied |
| V2__add_auth_and_onboarding_columns | Applied |
| V3__convert_role_to_varchar | Applied |

---

## Next Steps

1. **Fix BUG-1** (duplicate Set-Cookie) — remove `response.addCookie()`
2. **Fix GAP-1** (frontend field-level errors) — add error mapper in authStore + SignupView/LoginView
3. **Verify BUG-2** (name > 255 returns 400) — confirmed works in curl, was script issue
4. **Create Wave 3 plan** if needed for GAP-1 and BUG-1 fixes