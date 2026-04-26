# Code Quality & Pipeline — v1

## Quick Context
NutriAI é um projeto com backend Spring Boot + frontend React/TS que cresceu rápido com ajuda de IA. Hoje não tem CI/CD, não tem análise estática, não tem cobertura medida, e o desenvolvedor é o gargalo de revisão de código. Precisa decidir quais ferramentas e processos adotar — sendo solo dev, cada ferramenta precisa justificar seu custo de manutenção.

## Session Log
- **Date:** 2026-04-23
- **Duration:** ~60 min
- **Energy:** Deep exploration
- **Mode:** Connected (NutriAI context)
- **Methods used:** Natural exploration + structured decision-making

## Decisions Made

### 1. CI/CD Pipeline
**Decision:** 3 workflows (frontend-ci, backend-ci, e2e) + Dependabot + branch protection on main
**Reasoning:** CI/CD is the foundation — without it, all other tools produce results nobody looks at. Path filters ensure backend CI only runs on backend changes and vice versa. E2E is separate because it's slow and needs the full stack. Dependabot automates dependency updates validated by CI.
**Status:** ✅ Decided

### 2. Complexidade Ciclomática
**Decision:** Gradual approach — ESLint `complexity` + `max-lines-per-function` rules on frontend; Checkstyle on backend. Warning for existing code, error for new code.
**Reasoning:** Solo dev gets maximum value from incremental enforcement. Starting aggressive on legacy code causes warning fatigue and abandonment. PMD and Error Prone are staged for later.
**Status:** ✅ Decided

### 3. Cobertura e Mutation Testing
**Decision:** JaCoCo (backend) + @vitest/coverage-v8 (frontend) now, integrated into CI with coverage floors. Mutation testing (PIT + StrykerJS) deferred to later stage.
**Reasoning:** Coverage is cheap to add and provides immediate visibility, even if imperfect. Mutation testing is valuable (especially for catching weak AI-generated tests) but high execution cost. Defer until test suite is larger.
**Status:** ✅ Decided

### 4. Estrutura de Dependência
**Decision:** ArchUnit (backend) + dependency-cruiser (frontend) with 3-5 core rules each.
**Reasoning:** Architecture degrades invisibly, especially with AI-generated code. These tools are the "guardian" that prevents shortcuts. Start with minimal rules (controller→repository, no cycles, views→stores pattern).
**Status:** ✅ Decided

### 5. Multi-Tenant
**Decision:** Keep current row-level FK isolation + add ArchUnit rule enforcing nutritionistId in queries. RLS parked for reconsideration when real users arrive or LGPD formal compliance is needed.
**Reasoning:** Current isolation works. RLS adds defense-in-depth but also adds complexity (per-connection setup, migrations, testing). ArchUnit provides architectural enforcement that catches the "forgot nutritionistId" pattern. When the app has real users and needs formal LGPD compliance, RLS should be reconsidered.
**Status:** ✅ Decided

### 6. PR/CR + IA Revisor
**Decision:** Branch protection on main + PR template with checklist + GSD code-review as primary reviewer. CodeRabbit Pro considered for future ($24/mo for full PR review).
**Reasoning:** Solo dev can't rely on human reviewers. CI acts as first reviewer (mechanical checks), GSD code-review acts as second (logic/architecture), developer does final review (business logic/judgment). This removes 80%+ of manual review burden.
**Status:** ✅ Decided

## Open Questions
1. Qual é o maior risco que você está aceitando por não ter CI hoje? E esse risco aparece quando — no deploy pra produção ou no desenvolvimento diário?
2. Quando Mutation testing se torna prioridade? Qual o trigger?
3. RLS: qual o evento que dispara a reconsideração? Primeiro usuário real? Auditoria LGPD?
4. CodeRabbit Pro: em que ponto o review manual se torna insuficiente e justifica $24/mês?

## Tema Extra: Testes E2E — Estado Atual e Plano de Implementação

### Estado Atual — E2E Sem Mock (JÁ FUNCIONA)

Os testes E2E atuais **já são sem mock**. Eles batem no backend real (Spring Boot) com banco real (PostgreSQL). Isso é significativo e raro — a maioria dos projetos testa só "a página carrega".

**O que os E2E já cobrem (4 spec files, ~40 testes):**

| Spec | Testes | O que valida |
|------|--------|-------------|
| `auth.spec.ts` | 16 testes | Signup completo UI→API, login válido/inválido, campos obrigatórios, API contract (accessToken, user shape, passwordHash ausente), proteção de rotas, enum rejection |
| `patient-management.spec.ts` | 17 testes | Render da página, conversão UI enum→API (pt-BR label "Hipertrofia" → 400, enum key "HIPERTROFIA" → 201), CRUD completo, isolamento cross-tenant (nutritionist A não acessa paciente de B), paginação |
| `food-catalog.spec.ts` | 16 testes | BASE/PRESET creation, enum rejection (lowercase, pt-BR labels), delete, paginação, UI→API integration |
| `meal-plans.spec.ts` | 9 testes | Auto-created plan com 6 meals, add slot/option/extras, update targets, cross-tenant isolation, unauthenticated access |

**Padrões de qualidade nos E2E:**
- **Enum contract testing**: testa que labels pt-BR ("Hipertrofia") dão 400 e enum keys ("HIPERTROFIA") dão 201/200
- **API contract validation**: verifica `body.success`, `body.data.id`, tipos de campos, ausência de `passwordHash`
- **Cross-tenant isolation**: cria nutritionist A e B, verifica que A não acessa dados de B (403/404)
- **UI→API round-trip**: preenche form no browser, submete, verifica via API que o dado chegou correto

### 4 Gaps a Resolver

#### Gap 1: Testes E2E não rodam no CI (CRÍTICO)
**Problema:** Testes existem e são bons, mas exigem setup manual (subir docker-compose, rodar playwright).
**Solução:** GitHub Actions workflow `e2e.yml`:
```
1. docker-compose up -d (sobe postgres + backend + frontend)
2. curl http://localhost:8080/api/v1/health (espera backend)
3. curl http://localhost:5173 (espera frontend)
4. npx playwright test
5. Upload traces/artifacts se falhar
6. docker-compose down
```
**Nota:** O `playwright.config.ts` atual já sobe o frontend via `webServer`, mas **não** sobe o backend nem o Postgres. O docker-compose resolve isso no CI.

#### Gap 2: Setup de autenticação injeta localStorage (frágil)
**Problema:** `setupAuth()` em `patient-management.spec.ts:6-18` faz `page.evaluate(() => localStorage.setItem(...))` em vez de logar pela UI. Se o formato do Zustand persist muda, testes quebram silenciosamente.
**Solução gradual:**
- **Curto prazo:** Manter o hack, mas centralizar no helper (já parcial)
- **Médio prazo:** Helper que loga via UI (`page.goto('/login')` + fill + submit)
- **Longo prazo:** Playwright `storageState` (salva estado após login real, reusa nos specs)

#### Gap 3: Não há cleanup de dados entre testes
**Problema:** Cada teste cria dados via API mas nunca apaga. Rodar 10x seguidas acumula dados. `uniqueEmail()` com timestamp reduz colisões mas não elimina.
**Solução:**
- **No CI:** Container efêmero — DB é limpo automaticamente entre runs
- **Local:** `test.afterAll` que limpa dados de teste, ou rodar contra dev DB com reset

#### Gap 4: Backend unit tests usam H2, E2E usa Postgres
**Problema:** Testes unitários do backend (`*Test.java`) rodam em H2 (in-memory). E2E rodam em Postgres real. Diferenças de comportamento (tipo JSON, funções nativas, case sensitivity) podem causar bugs que só aparecem em produção.
**Solução:** Testcontainers — substitui H2 por container Postgres efêmero nos testes de integração. Grátis (Apache 2.0), suportado pelo Spring Boot.

### Plano de Implementação E2E

| Passo | O quê | Esforço | Impacto |
|-------|-------|---------|---------|
| **1** | CI workflow `e2e.yml` com docker-compose + health checks + playwright | ~2h | **Crítico** — sem isso testes não contam |
| **2** | Extrair `setupAuth` para Playwright StorageState (login real, reutiliza estado) | ~1h | Reduz fragilidade |
| **3** | Testcontainers no backend (substituir H2 por Postgres real nos integration tests) | ~2h | Elimina gap H2/Postgres |
| **4** | `test.afterAll` cleanup ou reset DB entre specs | ~30min | Evita contaminação |

**O que NÃO muda:** A estrutura dos testes (helpers, enum validation, contract tests, cross-tenant isolation) já está excelente. Não redesenhar — só automatizar execução e reduzir fragilidade do setup.

## Implementation Priority

1. **CI/CD Pipeline** (GitHub Actions) — foundation, enables everything else
2. **CI workflow `e2e.yml`** — E2E tests only count if they run automatically
3. **Branch protection + PR template** — minimal process
4. **Checkstyle + ESLint complexity rules** — low entry barrier
5. **JaCoCo + vitest coverage** — visibility
6. **Playwright StorageState setup** — reduce auth fragility in E2E
7. **Testcontainers (backend)** — eliminate H2/Postgres gap
8. **ArchUnit + dependency-cruiser** — architectural guard
9. **GSD code-review integration** — already available, integrate into workflow

## Current State Assessment

### What Works Well
- TypeScript strict mode catches bugs at compile time
- ESLint 9 + Prettier 3 configured on frontend
- Tests exist (12 backend, 8 frontend unit, 4 E2E specs)
- Row-level tenant isolation via FK + scoped queries
- Flyway for schema migration discipline
- Bean Validation for input validation

### Critical Gaps (Now Being Addressed)
- Zero CI/CD — no GitHub Actions workflows
- Zero static analysis on backend (no Checkstyle/PMD/SpotBugs/JaCoCo)
- Zero measured coverage (frontend or backend)
- Zero pre-commit hooks
- `@PreAuthorize` only on FoodController — PatientController and PlanController lack declarative auth
- No RLS at PostgreSQL level — all isolation is application-enforced
- No audit logging (LGPD concern for health data)
- No Dependabot

## Ideas Inventory

### Raw
- Adicionar PMD ao build.gradle (later, after Checkstyle)
- Adicionar Error Prone ao compilador Java (later)
- Adicionar Husky + lint-staged (pre-commit hooks)
- Adicionar eslint-plugin-jsx-a11y (accessibility)
- Adicionar eslint-config-prettier (resolve conflicts)
- Adicionar springdoc-openapi (API documentation)
- Configurar RLS no PostgreSQL (parked for reconsideration)
- Configurar audit logging for LGPD compliance

### Developing
- Isolamento multi-tenant atual (row-level FK) — now with ArchUnit enforcement

### Refined
- E2E no CI (docker-compose + health checks + playwright) — 4 gaps identificados, plano detalhado
- Playwright StorageState para auth setup (reduz fragilidade do localStorage hack)
- Testcontainers no backend (elimina gap H2/Postgres nos tests)
- E2E cleanup entre testes (afterAll ou DB reset)

### Ready
- CI/CD Pipeline (GitHub Actions: 3 workflows + Dependabot + branch protection)
- Checkstyle + ESLint complexity rules (gradual, warning→error)
- JaCoCo + vitest coverage (CI integration with floors)
- ArchUnit + dependency-cruiser (3-5 core rules each)
- GSD code-review as primary IA reviewer
- PR template with automated checklist

### Parked
- Mutation testing (PIT + StrykerJS) — when test suite >30 files or weak AI tests detected
- CodeRabbit Pro ($24/mo) — when manual review becomes insufficient
- RLS no PostgreSQL — when real users arrive or LGPD formal compliance needed
- SonarQube Community — more infra than value for solo dev at this stage
- ESLint complexity rules — solo dev attrition high, marginal benefit
- dependency-cruiser — ArchUnit covers backend; frontend arch is simple enough

### Deferred (medium priority)
- Playwright StorageState — refactor auth setup when authStore format changes or more specs added

### Eliminated
- DB-per-tenant / Schema-per-tenant — overkill for solo-nutritionist model
- GitHub Copilot Review — subscription paused for new signups

## Como Executar — Método e Ordem

### Usar GSD ou não?

**NÃO usar GSD pra implementar ferramentas de qualidade.** São tarefas de infraestrutura, não features. GSD overkill pra adicionar plugin ao build.gradle ou criar YAML. Fazer direto em 1-2 commits cada.

**Usar GSD pra:**
- Continuar Phase 5 (verificar E2E, fechar a phase)
- Futuras phases (6+)

**Não usar GSD pra:**
- Criar `.github/workflows/*.yml`
- Adicionar Checkstyle/JaCoCo/ArchUnit ao `build.gradle`
- Configurar ESLint rules
- Adicionar `@vitest/coverage-v8`

### Bug Fixes da Phase 5 (FEITO)

Verificação dos bugs do `05-REVIEW.md`:

| Bug | Status |
|-----|--------|
| CR-01: `@RequestParam` → `@RequestBody` | ✅ Corrigido |
| WR-02: `updateMealSlot` retorno incompleto | ✅ Corrigido |
| WR-04: Keystroke spam (PlanFoodRow) | ✅ Corrigido |
| WR-05: Keystroke spam (ExtrasSection) | ✅ Corrigido |
| WR-07: Food.type plain String | ✅ Corrigido (type eliminado via P5-03) |
| WR-08: reactivatePatient sem plano | ✅ Corrigido |
| P5-03: Food unification refactoring | ✅ Executado (V10+V11+V12 migrations) |
| WR-01: `patientId` ignorado nos endpoints | 🟡 Aceito como risco documentado (não muda seguranca, mudar URLs quebra API) |
| WR-03: Delete sem optimistic update | ✅ Corrigido (useDeleteMealSlot, useDeleteOption, useDeleteFoodItem, useDeleteExtra) |

### Execution Plan — Ordem Prática

| # | Tarefa | Método | Esforço | Resultado |
|---|--------|--------|---------|-----------|
| 1 | GitHub Actions `frontend-ci.yml` | Direto | ~30min | CI roda tsc + lint + test + build em todo PR |
| 2 | GitHub Actions `backend-ci.yml` | Direto | ~30min | CI roda compileJava + test em todo PR |
| 3 | Branch protection em main | GitHub Settings | ~10min | Exige CI verde pra merge |
| 4 | Dependabot config | Direto | ~10min | Auto PRs de dep updates |
| 5 | PR template | Direto | ~15min | Checklist no GitHub |
| 6 | GSD code-review antes de cada merge | Fluxo de trabalho | 0 | Já disponível |
| 7 | Checkstyle backend | Direto | ~45min | Static analysis no CI |
| 8 | ESLint complexity + max-lines rules | Direto | ~15min | CC limit no CI |
| 9 | JaCoCo backend + vitest coverage front | Direto | ~1h | Coverage no CI |
| 10 | ArchUnit backend | Direto | ~1h | Architecture guard nos testes |
| 11 | dependency-cruiser frontend | Direto | ~30min | Dependency rules |
| 12 | GitHub Actions `e2e.yml` | Direto | ~1h | E2E automático |
| 13 | Playwright StorageState | Direto | ~30min | Auth setup robusto |
| 14 | Testcontainers backend | Direto | ~1h | Elimina H2/Postgres gap |

**Total estimado:** ~7h de trabalho direto, sem overhead de GSD

## v2 — Implementation (2026-04-24)

### O que foi implementado do brainstorm

| # | Item | Status | Detalhe |
|---|------|--------|---------|
| 1 | `frontend-ci.yml` | ✅ Já existia | tsc + lint + test + build |
| 2 | `backend-ci.yml` | ✅ Já existia | compileJava + check (checkstyle + JaCoCo + tests) |
| 3 | Branch protection | ✅ Já existia | 2 approvals, ai-review required |
| 4 | Dependabot | ✅ Melhorado | Labels (dependencies+frontend/backend/ci), Playwright major ignore |
| 5 | PR template | ✅ Melhorado | Checklist condicional front/back com regras do projeto |
| 6 | AI reviewer (GSD) | ✅ Já existia | ai-review.yml com tiered severity |
| 7 | Checkstyle | ✅ Já existia | No `./gradlew check` |
| 8 | ESLint complexity | 🅿️ Parked | Solo dev, marginal benefit |
| 9 | JaCoCo + vitest coverage | ✅ Já existia | Com coverage floors |
| 10 | ArchUnit | ✅ Já existia | 6 regras de arquitetura |
| 11 | dependency-cruiser | 🅿️ Parked | Frontend arch simples, ArchUnit cobre backend |
| 12 | `e2e.yml` | ✅ Já existia | Docker compose + Playwright |
| 13 | Playwright StorageState | 🔜 Deferred | Funciona hoje, refatorar quando necessário |
| 14 | Testcontainers | ✅ Já existia | integrationTest com Postgres real |

### Decisões finais

- **ESLint complexity**: park — custo de manutenção alto pra solo dev, TypeScript strict já pega erros
- **dependency-cruiser**: park — view→store→api é simples, ArchUnit cobre backend
- **Playwright StorageState**: defer — funciona hoje, refatorar quando authStore mudar
- **Mutation testing**: deferred — executar quando test suite >30 arquivos

### Conclusão

Toda a fundação CI/CD do brainstorm v1 está implementada. Itens parked ficam documentados para reconsideração quando o projeto escalar (contribuidores externos, test suite maior, compliance LGPD formal).