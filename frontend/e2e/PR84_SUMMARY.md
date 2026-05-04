test(e2e): authenticatedPage fixture e split journey monolith

## Summary

- Add authenticatedPage Playwright fixture (signupViaApi + loginViaUI + context reuse)
- Refactor ui-integration.spec.ts e form-validation.spec.ts pra usar fixture
- Split journey.spec.ts monolith (183 linhas) em 5 arquivos independentes:
  - journey-auth.spec.ts (signup → onboarding)
  - journey-patient.spec.ts (criar, editar, excluir)
  - journey-food.spec.ts (criar alimento)
  - journey-plan.spec.ts (adicionar refeição)
  - journey-biometry.spec.ts (registrar biometria)
- Add data-testid nos modais/selectors do frontend:
  - NewPatientModal, EditPatientModal, AddMealModal
  - Food modal (Novo alimento), NewBiometryModal
- Role=dialog nos modais sem role (FoodsView, NewBiometryModal)
- btn-desativar data-testid na PatientTable e PatientGrid
- helpers.ts: completeOnboardingViaApi aceita data opcional
- playwright.config.ts: incluir journey specs no projeto ui-integration

## Test Results

- `npx tsc --noEmit`: PASS
- E2E ui-integration: 10/22 passed (falhas remanescentes = seletores frontend ainda sem data-testid)

## Checklist

- [x] `npx tsc --noEmit` passa
- [x] E2E fixture aplicada em ui-integration e form-validation
- [x] journey.spec.ts decomposto em 5 specs independentes
- [x] Cleanup: remove journey.spec.ts monolith
- [x] data-testid adicionado nos componentes críticos
- [x] PR criado: https://github.com/EvanderLucena/nutriai/pull/84

## Notas

Os testes que ainda falham precisam de mais data-testid no frontend (signup step 2, botão edit plan, inputs biometria). Uma rodada futura pode adicionar esses seletores.
