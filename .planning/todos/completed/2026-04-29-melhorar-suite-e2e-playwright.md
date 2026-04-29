---
created: 2026-04-29T10:38:54.088Z
title: Melhorar suite E2E Playwright
area: testing
files:
  - frontend/e2e/auth.setup.ts:1-35
  - frontend/e2e/helpers.ts:1-58
  - frontend/e2e/auth.spec.ts:1-178
  - frontend/e2e/patient-management.spec.ts:1-301
  - frontend/e2e/food-catalog.spec.ts:1-345
  - frontend/e2e/meal-plans.spec.ts:1-123
  - frontend/e2e/biometry-dashboard.spec.ts:1-459
  - frontend/e2e/numeric-normalization.spec.ts:1-164
  - frontend/playwright.config.ts:1-38
  - TASKS.md:120-130
---

## Problem

A suite E2E tem 85 testes, mas **67% são apenas contratos de API** (usando o `request` fixture do Playwright diretamente, sem navegador). Só 3 testes fazem integração UI→API real. O projeto `authenticated` inteiro injeta auth via localStorage em vez de passar pelo fluxo real de login — se a tela de login quebrar, a suite passa mesmo assim.

6 chamadas a `waitForTimeout` (sleeps fixos de 500ms a 2s) tornam os testes lentos e frágeis. Não existe nenhum teste de jornada completa do usuário (signup → criar paciente → alimento → plano → biometria → dashboard). Validação de formulários na UI (máscaras, erros visíveis, submit bloqueado) não é coberta. Estados de loading/empty/error nunca são verificados via navegador.

O CI de E2E roda condicionalmente e **não bloqueia merge** — mesmo que falhe, o PR pode ser mergeado. As 8 pendências listadas no TASKS.md (linhas 122-130) continuam em aberto.

## Solution

### Fase 1 — Fundação (concluída em PR #61)
1. ~~**Substituir login fake por login real via UI** no `auth.setup.ts`** — login real com fill + click + redirect
2. ~~**Extrair `API_BASE`** para `helpers.ts` (remover hardcode)~~ — `API_BASE` centralizado
3. ~~**Corrigir `completeOnboardingViaApi`** para lançar erro em falha~~ — agora lança com status + body
4. ~~**Substituir `waitForTimeout`** por waits observáveis (`toBeVisible`, `toHaveURL`)~~ — 6 removidos

### Fase 2 — Jornadas reais (PENDENTE, depende de investigar seletores na CI com trace)
5. **Spec de jornada completa**: signup UI → login UI → criar paciente → alimento → plano → biometria → dashboard
6. **Spec de validação de formulários**: máscaras, erros visíveis, aria-invalid, submit bloqueado
7. **Spec de abas do paciente**: Hoje → Plano → Biometria → Histórico

### Fase 3 — Qualidade da suite (PENDENTE)
8. **Remover URL matching condicional** (e.g. `/(onboarding|home)/` → assert destino exato) — `auth.spec.ts` ainda tem
9. **Tornar E2E obrigatório no merge** — CI já alterou, mas E2E não foi requerido neste PR
10. ~~**Consertar E2E-PM-17**~~ — completado no PR #61 (testa abrir modal, alterar objetivo, salvar, verificar via API)

### Notas de execução
- Os testes de integração UI→API (E2E-PM-17, E2E-FC-16, E2E-PM-16) foram extraídos para `ui-integration.spec.ts` com projeto `ui-integration` separado (`storageState: undefined`).
- CI Docker Chromium tem problema com `page.evaluate` cross-origin em `about:blank`. Testes que necessitam `localStorage.clear()` antes de login real foram postergados.
- O placeholder `ui-integration.spec.ts` existe para follow-up com trace da CI (baixar artifact e inspecionar com `npx playwright show-trace`).
