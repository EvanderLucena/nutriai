# E2E Test Plan — Phase 3 Auth (Playwright)

> Objetivo: Testar o fluxo real de ponta-a-ponta — navegador → Vite → Spring Boot → PostgreSQL — garantindo que signup, login, refresh, logout, onboarding e proteção de rotas funcionam como um usuário real experimenta.

---

## Pré-requisitos

- Node.js 20+ (já temos)
- Playwright instalado como devDependency do frontend
- Backend rodando (`./gradlew bootRun` ou jar)
- Frontend rodando (`npm run dev` — Vite na 5173)
- PostgreSQL rodando (Docker `nutriai-postgres`)
- Banco limpo (ou com dados de teste controlados)

## Setup

### Instalar Playwright

```bash
cd frontend
npm install -D @playwright/test
npx playwright install chromium
```

### Configuração

Criar `frontend/playwright.config.ts`:

```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // auth tests precisam de sequência
  retries: 1,
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  webServer: [
    {
      command: 'npm run dev',
      port: 5173,
      reuseExistingServer: true,
      cwd: '.',
    },
  ],
});
```

### Estrutura de diretórios

```
frontend/
  e2e/
    auth.spec.ts        — testes de autenticação
    helpers.ts          — utilitários (gerar email único, limpar DB, etc.)
  playwright.config.ts
```

---

## Testes E2E

### 1. Signup Flow

| ID | Teste | Passos | Assert |
|----|-------|--------|--------|
| E2E-01 | Signup completo → redirect onboarding | 1. Ir para /signup<br>2. Preencher nome, email, senha<br>3. Clicar "Continuar"<br>4. Preencher CRN, regional, termos<br>5. Clicar "Criar conta" | Redireciona para /onboarding<br>User no authStore tem `onboardingCompleted: false` |
| E2E-02 | Email duplicado mostra erro | 1. Criar conta com email X<br>2. Tentar signup novamente com mesmo email | Mostra erro "Email já cadastrado" (verificar se `.auth-error` está visível) |
| E2E-03 | Validação de senha curta | 1. Ir para /signup<br>2. Digitar senha com 7 caracteres<br>3. Submeter step 1 | Mostra erro de validação (field error ou auth-error) |
| E2E-04 | Validação terms=false | 1. Ir para /signup<br>2. Preencher step 1<br>3. Não marcar checkbox de termos<br>4. Submeter step 2 | Mostra erro |
| E2E-05 | Navegação signup → login | 1. Ir para /signup<br>2. Clicar "Já tem conta? Entrar" | Redireciona para /login |

### 2. Login Flow

| ID | Teste | Passos | Assert |
|----|-------|--------|--------|
| E2E-06 | Login válido → redirect home | 1. Criar conta via API<br>2. Ir para /login<br>3. Preencher email+senha<br>4. Submeter | Redireciona para /home<br>authStore.isAuthenticated === true |
| E2E-07 | Senha errada mostra erro | 1. Ir para /login<br>2. Email válido, senha errada | Mostra "Credenciais inválidas" |
| E2E-08 | Email inexistente mostra erro | 1. Ir para /login<br>2. Email que não existe | Mostra "Credenciais inválidas" |
| E2E-09 | Login → logout → login novamente | 1. Logar<br>2. Clicar logout (se disponível)<br>3. Logar novamente | Funciona, novo token criado |
| E2E-10 | Redirect se já logado | 1. Logar<br>2. Navegar para /login | Redireciona para /home |

### 3. Auth Protection

| ID | Teste | Passos | Assert |
|----|-------|--------|--------|
| E2E-11 | Rota protegida sem auth | 1. Navegar para /home sem login | Redireciona para / (landing) |
| E2E-12 | Rota protegida com auth | 1. Logar<br>2. Navegar para /patients | Renderiza PatientsView |
| E2E-13 | Refresh token automático | 1. Logar<br>2. Espera access token expirar (mock ou tempo)<br>3. Navegar para /me | Deve funcionar sem re-login |
| E2E-14 | Sessão persiste após reload | 1. Logar<br>2. Recarregar página | Continua autenticado |

### 4. Onboarding Flow

| ID | Teste | Passos | Assert |
|----|-------|--------|--------|
| E2E-15 | Completar onboarding → redirect home | 1. Signup<br>2. Avançar steps do onboarding<br>3. Completar último step | Redireciona para /home<br>user.onboardingCompleted === true |
| E2E-16 | Onboarding obrigatório pós-signup | 1. Signup<br>2. Tentar navegar para /patients direto | Redireciona para /onboarding |

### 5. Edge Cases

| ID | Teste | Passos | Assert |
|----|-------|--------|--------|
| E2E-17 | Campo obrigatório vazio no step 1 | 1. /signup<br>2. Deixar nome vazio<br>3. Submeter | Botão "Continuar" disabled OU erro local |
| E2E-18 | Field-level errors do backend | 1. /signup<br>2. Preencher email inválido (sem @)<br>3. Submeter | Erro aparece inline ao lado do campo de email |

---

## Helpers (e2e/helpers.ts)

```ts
import { Page } from '@playwright/test';
import { request } from '@playwright/test';

// Gera email único para testes paralelos
export function uniqueEmail(): string {
  return `e2e_${Date.now()}_${Math.random().toString(36).slice(2, 7)}@test.com`;
}

// Cria conta via API direta (sem UI) para setup de testes
export async function signupViaApi(email: string, password = 'SenhaSegura123!') {
  const ctx = await request.newContext({ baseURL: 'http://localhost:8080/api/v1' });
  const resp = await ctx.post('/auth/signup', {
    data: {
      name: 'E2E Test User',
      email,
      password,
      crn: '99999',
      crnRegional: 'SP',
      terms: true,
    },
  });
  const body = await resp.json();
  return { accessToken: body.accessToken, userId: body.user.id };
}

// Login via API
export async function loginViaApi(email: string, password = 'SenhaSegura123!') {
  const ctx = await request.newContext({ baseURL: 'http://localhost:8080/api/v1' });
  const resp = await ctx.post('/auth/login', { data: { email, password } });
  const body = await resp.json();
  return body.accessToken;
}
```

---

## Ordem de Execução

1. **Setup global**: garantir backend + DB rodando
2. **E2E-01 a E2E-05** (signup) — sequenciais pois dependem de estado limpo
3. **E2E-06 a E2E-10** (login) — usam conta criada via API
4. **E2E-11 a E2E-14** (proteção) — usam conta + login
5. **E2E-15 a E2E-16** (onboarding) — usam conta nova
6. **E2E-17 a E2E-18** (edge cases)

## CI Integration

Futuro: adicionar ao GitHub Actions com:
- Service container PostgreSQL
- Step para iniciar Spring Boot
- Step para iniciar Vite
- `npx playwright test`

## Manutenção

- Sempre que adicionar novo campo no SignupRequest, criar teste E2E correspondente
- Sempre que alterar redirect logic (AuthGuard, OnboardingGuard), testar E2E-11 a E2E-16
- Sempre que alterar authStore, rodar suite completa