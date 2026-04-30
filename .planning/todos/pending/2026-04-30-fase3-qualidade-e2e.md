---
created: 2026-04-30T01:55:00.000Z
title: Fase 3 — Qualidade da Suite E2E
area: testing
files:
  - frontend/e2e/auth.spec.ts:1-200
  - .github/settings.yml
---

## Problem

URL matching condicional em `auth.spec.ts` torna os testes frágeis:
- `/(onboarding|home)/` aceita 2 URLs diferentes — se onboarding quebrar e redirecionar pra home, o teste passa
- `/(home|onboarding)/` no login é ambíguo (login pode resultar em onboarding ou home dependendo do estado)
- Branch protection não exige E2E passar — PR pode ser mergeado com suites quebradas

## Solution

### PR #70 — URL matching exato
1. **auth.spec.ts linha 21**: `/(onboarding|home)/` → assert onboarding exato
2. **auth.spec.ts linha 71**: `/(home|onboarding)/` → assert home exato (onboarding já completado no beforeEach)
3. **auth.spec.ts linhas 189, 193, 198**: `/\/\/login/` → assert /login exato

### PR #71 — E2E required no merge
1. **Branch protection**: Adicionar `e2e` como check obrigatório
2. **Documentação**: Atualizar AGENTS.md com regra

## Divisão por PR

| PR | Escopo | Tamanho estimado |
|----|--------|-----------------|
| #70 | Fix URL matching em auth.spec.ts | ~10 linhas, 1 arquivo |
| #71 | Branch protection E2E required | ~5 linhas, 1 arquivo |

## Riscos
- Branch protection altera comportamento de merge — pode bloquear PRs legítimos se E2E flaky
- Mitigação: E2E já está estável (100% pass rate nas últimas 5 runs)
