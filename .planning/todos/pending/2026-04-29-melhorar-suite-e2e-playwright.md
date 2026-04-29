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

### Fase 1 — Fundação (corrigir o que já existe)
1. **Substituir login fake por login real via UI** no `auth.setup.ts`
2. **Extrair `API_BASE_URL`** para variável de config do Playwright (remover hardcode `http://localhost:8080/api/v1`)
3. **Corrigir `completeOnboardingViaApi`** para verificar `response.ok()` e retornar status
4. **Substituir 6 `waitForTimeout`** por `waitForResponse`, `waitForURL`, ou `waitForSelector`

### Fase 2 — Jornadas reais (novos specs)
5. **Spec de jornada completa**: signup UI → login UI → criar paciente via UI → criar alimento via UI → montar plano → criar biometria → verificar dashboard reflete dados
6. **Spec de validação de formulários**: testar campos obrigatórios, máscaras (WhatsApp, CRN), erros visíveis, aria-invalid, botão submit bloqueado enquanto inválido
7. **Spec de abas do paciente**: navegar entre Hoje → Plano → Biometria → Histórico, verificar conteúdo de cada aba

### Fase 3 — Qualidade da suite
8. **Remover URL matching condicional** (e.g. `/(onboarding|home)/` → assert destino exato)
9. **Tornar E2E obrigatório no merge** uma vez que a suite esteja estável
10. **Consertar E2E-PM-17** para realmente validar edição de paciente (clicar edit, alterar campo, submit, verificar via API)
