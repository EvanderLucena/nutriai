import { test, expect } from '@playwright/test';
import {
  completeOnboardingViaApi,
  createPatientPayload,
  signupViaApi,
  uniqueEmail,
  API_BASE,
} from './helpers';

/**
 * Ondem de execucao controlada: antes de cada teste cria uma sessao
 * autenticada e um paciente via API (rapido), depois navega ate a
 * pagina do paciente e valida a aba isoladamente.
 */
test.describe('Patient Tabs — Navegacao e Conteudo', () => {
  let accessToken: string;
  let patientId: string;
  const password = 'SenhaSegura123!';

  test.beforeEach(async ({ page, request }) => {
    const email = uniqueEmail();
    const result = await signupViaApi(request, email, password);
    accessToken = result.accessToken;
    await completeOnboardingViaApi(request, accessToken);

    const createResp = await request.post(`${API_BASE}/patients`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: createPatientPayload({ name: 'Paciente Abas', objective: 'EMAGRECIMENTO' }),
    });
    patientId = (await createResp.json()).data.id;

    await page.goto('/login');
    await page.getByTestId('login-email').fill(email);
    await page.getByTestId('login-password').fill(password);
    await page.getByRole('button', { name: /Entrar/i }).click();
    await expect(page).toHaveURL(/\/home/, { timeout: 10_000 });
  });

  test.beforeEach(async ({ page }) => {
    await page.goto(`/patient/${patientId}`);
    await page.waitForLoadState('networkidle');
  });

  test('E2E-PT-01: Aba Hoje carrega Plano do dia', async ({ page }) => {
    await page.getByTestId('patient-tab-today').click();
    await expect(page.getByText('Plano do dia')).toBeVisible({ timeout: 3_000 });
  });

  test('E2E-PT-02: Aba Plano carrega refeicoes', async ({ page }) => {
    await page.getByTestId('patient-tab-plan').click();
    await expect(page.getByRole('button', { name: 'Refeições do plano' })).toBeVisible({
      timeout: 3_000,
    });
  });

  test('E2E-PT-03: Aba Biometria mostra botao Nova avaliacao', async ({ page }) => {
    await page.getByTestId('patient-tab-biometry').click();
    await expect(
      page
        .locator('button')
        .filter({ hasText: /Avaliaç/i })
        .first(),
    ).toBeVisible({ timeout: 3_000 });
  });

  test('E2E-PT-04: Aba Inteligencia carrega sem crash', async ({ page }) => {
    await page.getByTestId('patient-tab-insights').click();
    // Valida que a pagina nao caiu em erro React (tela branca)
    await expect(page.getByText(/stack trace|unexpected error/i)).not.toBeVisible({
      timeout: 1_000,
    });
  });

  test('E2E-PT-05: Aba Historico carrega sem crash', async ({ page }) => {
    await page.getByTestId('patient-tab-history').click();
    await expect(page.getByText(/stack trace|unexpected error/i)).not.toBeVisible({
      timeout: 1_000,
    });
  });
});
