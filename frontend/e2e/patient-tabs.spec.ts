import { test, expect } from '@playwright/test';
import {
  completeOnboardingViaApi,
  createPatientPayload,
  signupViaApi,
  uniqueEmail,
  API_BASE,
} from './helpers';

// Navegacao entre abas do paciente: Hoje → Plano → Biometria → Inteligencia → Historico
// Valida que cada aba carrega conteudo especifico sem crashar
test.use({ storageState: undefined } as { storageState: string | undefined });

test.describe('Patient Tabs — Navegacao e Conteudo', () => {
  let accessToken: string;
  let patientId: string;
  const password = 'SenhaSegura123!';

  test.beforeEach(async ({ page, request }) => {
    const email = uniqueEmail();
    const result = await signupViaApi(request, email, password);
    accessToken = result.accessToken;
    await completeOnboardingViaApi(request, accessToken);

    // Cria paciente com dados para ter conteudo nas abas
    const createResp = await request.post(`${API_BASE}/patients`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: createPatientPayload({ name: 'Paciente Abas', objective: 'EMAGRECIMENTO' }),
    });
    patientId = (await createResp.json()).data.id;

    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.getByTestId('login-email').fill(email);
    await page.getByTestId('login-password').fill(password);
    await page.getByRole('button', { name: /Entrar/i }).click();
    await expect(page).toHaveURL(/\/home/, { timeout: 10_000 });
  });

  test('E2E-PT-01: Abas carregam sem erros e mostram conteudo especifico', async ({ page }) => {
    await page.goto(`/patient/${patientId}`);
    await page.waitForLoadState('networkidle');

    const tabs = ['Hoje', 'Plano', 'Biometria', 'Inteligencia', 'Historico'];

    for (const tabName of tabs) {
      // Clica na aba — obrigatoriamente deve estar presente
      const tabBtn = page.getByRole('button', { name: new RegExp(`^${tabName}$`, 'i') });

      // Se a aba nao estiver visivel (ex: overflow responsivo), scrolla horizontalmente
      await tabBtn.scrollIntoViewIfNeeded().catch(() => null);
      await expect(tabBtn).toBeVisible({ timeout: 3_000 });
      await tabBtn.click();
      await page.waitForLoadState('networkidle');

      // Cada aba deve mostrar pelo menos 1 elemento de conteudo (heading, card, text)
      const content = page.locator('h1, h2, h3, .card, [class*="card"]').first();
      await expect(content).toBeVisible({ timeout: 3_000 });

      // Nao deve haver erro React (tela branca com "Error" ou stack trace)
      const errorScreen = page.locator('text=/stack trace|unexpected error|runtime error/i');
      await expect(errorScreen).not.toBeVisible({ timeout: 1_000 });

      // Verifica conteudo especifico por aba
      if (tabName === 'Hoje') {
        await expect(page.locator('text=Plano do dia')).toBeVisible({ timeout: 3_000 });
      } else if (tabName === 'Plano') {
        await expect(page.locator('text=Refeicoes')).toBeVisible({ timeout: 3_000 });
      } else if (tabName === 'Biometria') {
        // Pode estar vazio (sem avaliacao), mas o botao de adicionar deve existir
        const addBtn = page.getByRole('button', { name: /nova avaliacao|adicionar/i });
        await expect(addBtn).toBeVisible({ timeout: 3_000 });
      } else if (tabName === 'Inteligencia') {
        await expect(page.locator('text=Adesao')).toBeVisible({ timeout: 3_000 });
      } else if (tabName === 'Historico') {
        await expect(page.locator('text=Historico')).toBeVisible({ timeout: 3_000 });
      }
    }
  });
});
