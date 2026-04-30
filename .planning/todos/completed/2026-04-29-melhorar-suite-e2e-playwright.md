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

### Fase 1 — Fundação (COMPLETA)
1. ✅ **Substituir login fake por login real** — `auth.setup.ts` usa fill + click + redirect
2. ✅ **Extrair `API_BASE`** — centralizado em `helpers.ts`
3. ✅ **Corrigir `completeOnboardingViaApi`** — lança com status + body em falha
4. ✅ **Remover 6 `waitForTimeout`** — substituídos por `toBeVisible`/`toHaveURL`

### Investigado: UI→API Integration (PR #62 v3)
- PM-17 era validação frontend impedindo submit (altura=0, whatsapp="(")
- Fix: preencher campos obrigatórios inválidos antes de Salvar
- Altura 50-250cm mantida (reviewer marcou HIGH se removida)

### Fase 2 — Jornadas reais (COMPLETA)
5. ✅ **Spec de jornada completa** — `journey.spec.ts` — signup UI → paciente → alimento → plano → biometria → dashboard → exclusão (PR #69)
6. ✅ **Spec de validação de formulários** — `form-validation.spec.ts` — signup/login/patient new/edit (PR #66)
7. ✅ **Spec de abas do paciente** — `patient-tabs.spec.ts` — Hoje/Plano/Biometria/Inteligência/Histórico (PR #68)

### Fase 3a — URL Matching (COMPLETA, PR #71)
8. ✅ **Remover URL matching condicional** em `auth.spec.ts` — asserts honestos sobre redirect real:
  - Login → `/onboarding` (não `/home`) porque `signupViaApi` cria user com `onboardingCompleted=false`
  - Proteção sem auth → `/` (não `/login`) porque `AuthGuard` redireciona para landing

### Fase 3b — Branch Protection (COMPLETA, PR #72)
9. ✅ **Tornar E2E obrigatório no merge** — workflow `e2e.yml` reescrito com `dorny/paths-filter`:
  - Job `changes` detecta alterações relevantes (frontend/backend/e2e.yml)
  - Job `e2e` roda testes reais quando há mudanças
  - Job `e2e-skip` passa verde imediatamente quando nada mudou
  - Check `e2e` **sempre** aparece na lista de PRs (antes só aparecia com path trigger)

## Finalizado

Todas as fases completas. Próximos passos manuais do usuário:
- [ ] Adicionar `e2e` à lista de **required status checks** em Settings → Branches → main
- [ ] Verificar que PR de docs-only mostra `e2e-skip` verde antes de ativar required
