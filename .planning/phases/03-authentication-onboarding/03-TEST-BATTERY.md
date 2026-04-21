# Test Battery — Phase 3: Authentication & Onboarding

> Mapeamento completo de 61 testes de integração para executar contra o backend real (PostgreSQL).
> Status: **EXECUTADO** — 55 PASS, 6 FAIL/SKIP. Ver relatório completo em `03-INTEGRATION-TEST-REPORT.md`.

---

## 1. POST /api/v1/auth/signup (17 testes)

| # | Teste | Request Body (delta) | Status Esperado | Validação |
|---|-------|---------------------|-----------------|-----------|
| 1.1 | Cadastro válido completo | Todos campos obrigatórios + opcionais | 200 | `accessToken` é JWT válido, `user.id` é UUID, `user.onboardingCompleted === false`, cookie `nutriai_refresh` presente |
| 1.2 | Cadastro mínimo (só obrigatórios) | Sem `specialty`, sem `whatsapp` | 200 | `user.id` presente, campos omitidos são `null` no banco |
| 1.3 | Email duplicado | email já cadastrado | 409 | `{ success: false, message: "Email já cadastrado" }` |
| 1.4 | Senha curta (< 8 chars) | `password: "1234567"` | 400 | `{ errors: [{ field: "password", message: "Senha deve ter entre 8 e 128 caracteres" }] }` |
| 1.5 | Senha longa (> 128 chars) | `password: "a"*129` | 400 | `{ errors: [{ field: "password", ... }] }` |
| 1.6 | Email vazio | `email: ""` | 400 | `{ errors: [{ field: "email", message: "Email é obrigatório" }] }` |
| 1.7 | Email inválido (sem @) | `email: "notanemail"` | 400 | `{ errors: [{ field: "email", message: "Email inválido" }] }` |
| 1.8 | Name vazio | `name: ""` | 400 | `{ errors: [{ field: "name", message: "Nome é obrigatório" }] }` |
| 1.9 | Name longo (> 255 chars) | `name: "a"*256` | 400 | `{ errors: [{ field: "name", ... }] }` |
| 1.10 | CRN vazio | `crn: ""` | 400 | `{ errors: [{ field: "crn", message: "CRN é obrigatório" }] }` |
| 1.11 | crnRegional vazio | `crnRegional: ""` | 400 | `{ errors: [{ field: "crnRegional", message: "CRN regional é obrigatório" }] }` |
| 1.12 | crnRegional com 3 chars | `crnRegional: "SPX"` | 400 | `{ errors: [{ field: "crnRegional", message: "CRN regional deve ter 2 caracteres" }] }` |
| 1.13 | crnRegional com 1 char | `crnRegional: "S"` | 400 | `{ errors: [{ field: "crnRegional", ... }] }` |
| 1.14 | terms=false | `terms: false` | 400 | `{ errors: [{ field: "terms", message: "Você deve aceitar os termos" }] }` |
| 1.15 | Sem corpo (body vazio) | `{}` ou sem body | 400 | Erro de validação |
| 1.16 | Content-Type errado | `Content-Type: text/plain` | 415 | Ou 400 — Spring não consegue parsear |
| 1.17 | specialty="" (string vazia) | `specialty: ""` | 200 ou 400? | **VERIFY**: `@Size(max=50)` — string vazia tem length=0, passa na validação. Verificar se backend salva como `null` ou `""` |

### Corpo base para cadastro válido
```json
{
  "name": "Dra. Ana Costa",
  "email": "ana@teste.com",
  "password": "SenhaSegura123!",
  "crn": "24781",
  "crnRegional": "SP",
  "specialty": "clinica",
  "whatsapp": "(11) 99999-9999",
  "terms": true
}
```

---

## 2. POST /api/v1/auth/login (8 testes)

| # | Teste | Request | Status Esperado | Validação |
|---|-------|---------|-----------------|-----------|
| 2.1 | Login válido | email + senha corretos | 200 | `accessToken` é JWT, `user` tem dados corretos, cookie `nutriai_refresh` presente |
| 2.2 | Senha errada | `password: "wrongpass"` | 401 | `{ message: "Credenciais inválidas" }` |
| 2.3 | Email inexistente | `email: "nobody@teste.com"` | 401 | `{ message: "Credenciais inválidas" }` (sem vazar que email não existe) |
| 2.4 | Email vazio | `email: ""` | 400 | Erro de validação |
| 2.5 | Senha vazia | `password: ""` | 400 | Erro de validação |
| 2.6 | Login após signup | Usar dados do teste 1.1 | 200 | `user.id` === id do signup |
| 2.7 | Cookie refresh presente | Login válido | 200 | `Set-Cookie` header contém `nutriai_refresh=<token>` |
| 2.8 | Access token JWT válido | Após login | 200 | Decodificar JWT — `sub` = email, `role` = "NUTRITIONIST", `exp` > now + 14min |

### Corpo base para login
```json
{
  "email": "ana@teste.com",
  "password": "SenhaSegura123!"
}
```

---

## 3. POST /api/v1/auth/refresh (7 testes)

| # | Teste | Request | Status Esperado | Validação |
|---|-------|---------|-----------------|-----------|
| 3.1 | Refresh válido com cookie | Cookie `nutriai_refresh` do login | 200 | Novo `accessToken`, novo cookie `nutriai_refresh` (rotation) |
| 3.2 | Token antigo após rotation | Cookie do refresh anterior | 401 | Token antigo foi deletado do banco — rotation funcionou |
| 3.3 | Sem cookie | Nenhum cookie | 401 | `{ message: "Refresh token não encontrado" }` |
| 3.4 | Cookie inválido (string qualquer) | `nutriai_refresh=invalidtoken` | 401 | JWT validation falha |
| 3.5 | Novo access token funciona | Usar novo access token do refresh | 200 | `GET /me` retorna dados do usuário |
| 3.6 | Double-click protection | 2 requests simultâneas com mesmo refresh | Um 200, um 401 | Race condition: primeiro consome o token, segundo falha |
| 3.7 | Refresh após logout | Cookie de refresh de sessão que fez logout | 401 | Token foi deletado do banco no logout |

---

## 4. POST /api/v1/auth/logout (5 testes)

| # | Teste | Request | Status Esperado | Validação |
|---|-------|---------|-----------------|-----------|
| 4.1 | Logout válido | `Authorization: Bearer <access_token>` | 200 | `{ success: true, message: "Logout realizado com sucesso" }`, cookie limpo (Max-Age=0) |
| 4.2 | Sem token (não autenticado) | Sem header Authorization | 401 | `"Não autenticado"` |
| 4.3 | Token inválido | `Authorization: Bearer invalid` | 401 | `"Não autenticado"` |
| 4.4 | Refresh não funciona após logout | Após logout, tentar /refresh | 401 | Todos refresh tokens do usuário foram deletados |
| 4.5 | Access token JWT ainda funciona (stateless) | Usar access token antigo em /me logo após logout | 200 | JWT é stateless — access token continua válido até expirar (não revoga JWTs) |

---

## 5. GET /api/v1/auth/me (6 testes)

| # | Teste | Request | Status Esperado | Validação |
|---|-------|---------|-----------------|-----------|
| 5.1 | Token válido | `Authorization: Bearer <access_token>` | 200 | `MeResponse` com todos campos: id, name, email, role, crn, crnRegional, specialty, whatsapp, onboardingCompleted, trialEndsAt, subscriptionTier, patientLimit |
| 5.2 | Sem token | Sem header | 401 | `"Não autenticado"` |
| 5.3 | Token inválido | `Authorization: Bearer invalid` | 401 | `"Não autenticado"` |
| 5.4 | trialEndsAt no response | Após signup | 200 | `trialEndsAt` ≈ now + 30 dias, `subscriptionTier === "TRIAL"`, `patientLimit === 15` |
| 5.5 | Campos opcionais null | Signup sem specialty/whatsapp | 200 | `specialty: null`, `whatsapp: null` na resposta |
| 5.6 | MeResponse shape completo | Após signup completo | 200 | Verificar serialização: UUID como string, LocalDateTime como ISO, Boolean como boolean |

---

## 6. POST /api/v1/auth/onboarding (4 testes)

| # | Teste | Request | Status Esperado | Validação |
|---|-------|---------|-----------------|-----------|
| 6.1 | Completar onboarding | `Authorization: Bearer <token>`, body vazio ou `{}` | 200 | `{ success: true, message: "Onboarding concluído" }` |
| 6.2 | Verificar via /me | Após 6.1, `GET /me` | 200 | `onboardingCompleted === true` |
| 6.3 | Sem token | Sem Authorization | 401 | `"Não autenticado"` |
| 6.4 | Idempotente — chamar 2x | Segundo call ao /onboarding | 200 | Não deve falhar, `onboardingCompleted` continua `true` |

---

## 7. Testes de Segurança (6 testes)

| # | Teste | Método | Status Esperado | Validação |
|---|-------|--------|-----------------|-----------|
| 7.1 | Senha armazenada como BCrypt hash | Verificar direto no banco: `SELECT password_hash FROM nutritionist WHERE email = '...'` | — | `password_hash` começa com `$2a$10$`, NÃO contém senha em plaintext |
| 7.2 | Endpoint protegido sem auth | `GET /api/v1/auth/me` sem token | 401 | SecurityConfig funciona |
| 7.3 | CORS rejeita origem não permitida | `Origin: http://evil.com` | 403 ou sem CORS headers | `Access-Control-Allow-Origin` não contém `evil.com` |
| 7.4 | CORS aceita localhost:5173 | `Origin: http://localhost:5173` | 200 + CORS headers | `Access-Control-Allow-Origin: http://localhost:5173` |
| 7.5 | SQL injection no login | `email: "' OR 1=1 --"` | 401 | Não deve logar, não deve causar erro 500 |
| 7.6 | Cookie flags (HttpOnly, SameSite, Path) | Após login/signup | — | Cookie tem `HttpOnly`, `SameSite=Lax`, `Path=/api/v1/auth` |

---

## 8. Verificação Frontend-Backend Compatibilidade (8 testes)

| # | Teste | Descrição | Resultado Esperado | Status |
|---|-------|-----------|-------------------|--------|
| 8.1 | `terms` como boolean | SignupView envia `terms: true` (boolean) | Backend `@AssertTrue` recebe boolean — OK | ⬜ |
| 8.2 | LoginView envia email+password | `LoginRequest` record espera exatamente `email` + `password` | Campos batem — OK | ⬜ |
| 8.3 | `crnRegional` como string 2 chars | Select envia "SP" (string) | `@Size(min=2, max=2)` — OK | ⬜ |
| 8.4 | Erro 409 exibido no frontend | Email duplicado → 409 | `authStore` captura `message: "Email já cadastrado"` | ⬜ |
| 8.5 | **GAP: Erro 400 field-level não extraído** | Validação retorna `{ errors: [{ field, message }] }` mas `authStore` e `SignupView` só mostram mensagem genérica | `localError = message` — NÃO mapeia erros por campo. **Correção necessária na Wave 3** | ❌ GAP |
| 8.6 | `specialty=""` vs `undefined` | SignupView envia `form.specialty \|\| undefined` → se specialty="", envia `undefined` (JSON sem o campo) | `@Size(max=50)` no backend: `null` passa, `""` também passa (length=0). Sem campo → `null`. OK | ⬜ |
| 8.7 | Refresh automático (401 interceptor) | `client.ts` tenta refresh quando access token expira | Se /refresh retorna 200, nova request é reenvada com token novo | ⬜ |
| 8.8 | Logout limpa state | `authStore.logout()` chama API + limpa Zustand + limpa persistência | `isAuthenticated=false`, `user=null`, `accessToken=null`, localStorage limpo | ⬜ |

---

## Bug Conhecido: Set-Cookie Duplicado

`AuthController.setRefreshTokenCookie()` chama `response.addCookie()` E `response.addHeader("Set-Cookie", ...)`, resultando em **dois headers Set-Cookie** na resposta. Isso pode causar comportamento indefinido em navegadores.

- **Linha**: `AuthController.java:155-162`
- **Impacto**: Navegadores podem usar apenas o último Set-Cookie header, ou ambos
- **Correção sugerida**: Remover `response.addCookie()` e usar apenas `response.addHeader("Set-Cookie", buildCookieHeaderValue(...))` que já inclui `SameSite`

---

## Ordem de Execução

1. **Verificar PostgreSQL**: container rodando, banco acessível
2. **Subir backend**: `./gradlew bootRun` (Flyway cria tabelas V1+V2)
3. **Seção 1 — Signup**: testes 1.1 a 1.17 (cria usuários no banco)
4. **Seção 2 — Login**: testes 2.1 a 2.8 (usa usuário do 1.1)
5. **Seção 5 — Me**: testes 5.1 a 5.6 (usa token do login)
6. **Seção 3 — Refresh**: testes 3.1 a 3.7 (usa cookie do login)
7. **Seção 6 — Onboarding**: testes 6.1 a 6.4 (usa token do login)
8. **Seção 4 — Logout**: testes 4.1 a 4.5 (depois de tudo, pois invalida tokens)
9. **Seção 7 — Segurança**: testes 7.1 a 7.6 (validações isoladas)
10. **Seção 8 — Frontend compat**: testes 8.1 a 8.8 (análise estática + manual)

---

## Resumo

| Categoria | Total | Críticos | 
|-----------|-------|----------|
| 1. Signup | 17 | 4 (1.1, 1.2, 1.3, 1.17) |
| 2. Login | 8 | 3 (2.1, 2.2, 2.7) |
| 3. Refresh | 7 | 3 (3.1, 3.2, 3.6) |
| 4. Logout | 5 | 2 (4.1, 4.4) |
| 5. Me | 6 | 2 (5.1, 5.4) |
| 6. Onboarding | 4 | 1 (6.1) |
| 7. Segurança | 6 | 3 (7.1, 7.5, 7.6) |
| 8. Frontend | 8 | 1 (8.5 — GAP) |
| **TOTAL** | **61** | **19** |

### Gaps Identificados (pré-execução)

1. **8.5 — Frontend não extrai field-level errors**: `GlobalExceptionHandler` retorna `{ errors: [{ field, message }] }` mas `authStore` e `SignupView` só usam `message` genérico. Necessário criar mapper de erros por campo para exibir erro inline ao lado do input correto.
2. **Bug Set-Cookie duplicado**: `AuthController` envia cookie via `addCookie()` + `addHeader()`. Corrigir antes da Wave 3.
3. **1.17 — specialty="" vs undefined**: Verificar no teste real se string vazia é salva como `""` ou `null`. O frontend envia `undefined` (campo omitido), mas se alguém enviar `""` direto, o backend aceita.