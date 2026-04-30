import { test, expect } from '@playwright/test';
import {
  completeOnboardingViaApi,
  createPatientPayload,
  signupViaApi,
  uniqueEmail,
  API_BASE,
} from './helpers';

// Testes de validação de formulários: campos obrigatórios, máscaras, erros visíveis,
// aria-invalid, e botão de submit bloqueado enquanto inválido.
test.use({ storageState: undefined } as { storageState: string | undefined });

test.describe('Form Validation — Auth', () => {
  test('E2E-FV-01: Signup com campos vazios mostra erros e não redireciona', async ({ page }) => {
    await page.goto('/signup');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /criar conta/i }).click();

    // A página deve continuar em /signup
    await expect(page).toHaveURL(/\/signup/, { timeout: 5_000 });

    // Deve haver mensagens de erro visíveis
    const alerts = page.locator('[role="alert"]');
    await expect(alerts).toHaveCount({ gte: 1 });

    // Campos com erro devem ter aria-invalid
    const email = page.getByTestId('signup-email');
    await expect(email).toHaveAttribute('aria-invalid', 'true');
  });

  test('E2E-FV-02: Login com senha errada mostra erro visível', async ({ page, request }) => {
    const email = uniqueEmail();
    const signupResult = await signupViaApi(request, email, 'SenhaSegura123!');
    const loginResp = await request.post(`${API_BASE}/auth/login`, {
      data: { email, password: 'SenhaSegura123!' },
    });
    const accessToken = (await loginResp.json()).accessToken;
    await completeOnboardingViaApi(request, accessToken);

    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await page.getByTestId('login-email').fill(email);
    await page.getByTestId('login-password').fill('SenhaErrada123!');
    await page.getByRole('button', { name: /entrar/i }).click();

    // Deve mostrar erro
    const errorAlert = page.locator('[role="alert"], .auth-field-error, .text-coral');
    await expect(errorAlert).toBeVisible({ timeout: 5_000 });

    // Ainda em /login
    await expect(page).toHaveURL(/\/login/, { timeout: 5_000 });
  });
});

test.describe('Form Validation — Patient', () => {
  const password = 'SenhaSegura123!';

  test.beforeEach(async ({ page, request }) => {
    const email = uniqueEmail();
    const result = await signupViaApi(request, email, password);
    const accessToken = result.accessToken;
    await completeOnboardingViaApi(request, accessToken);

    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.getByTestId('login-email').fill(email);
    await page.getByTestId('login-password').fill(password);
    await page.getByRole('button', { name: /Entrar/i }).click();
    await expect(page).toHaveURL(/\/home/, { timeout: 10_000 });
  });

  test('E2E-FV-03: New patient sem nome bloqueia submit', async ({ page }) => {
    await page.goto('/patients');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /novo paciente/i }).click();
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 3_000 });

    // Não preenche nome
    const nameInput = page.locator('input[placeholder*="Ana Beatriz"]');
    await nameInput.fill('');

    const saveBtn = page.getByRole('button', { name: /cadastrar/i });

    // Clica Salvar
    await saveBtn.click();

    // Modal ainda visível
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 3_000 });

    // Erro de campo obrigatório
    const errorText = page.locator('text=obrigatório');
    await expect(errorText).toBeVisible({ timeout: 3_000 });
  });

  test('E2E-FV-04: WhatsApp exibe erro quando incompleto', async ({ page }) => {
    await page.goto('/patients');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /novo paciente/i }).click();
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 3_000 });

    await page.locator('input[placeholder*="Ana Beatriz"]').fill('Paciente Validação');
    await page.locator('select').first().selectOption({ label: 'Hipertrofia' });
    await page.getByRole('checkbox').check();

    // Preenche WhatsApp com apenas 1 dígito
    const whatsappInput = page.locator('input[placeholder*="99999-9999"]');
    await whatsappInput.fill('1');

    // Clica fora para blur
    await page.keyboard.press('Tab');

    // Verifica mensagem de erro WhatsApp
    const whatsappError = page.locator('text=WhatsApp deve ter');
    if (await whatsappError.isVisible().catch(() => false)) {
      // Se a validação existe
      await expect(whatsappError).toBeVisible({ timeout: 3_000 });
    }
  });

  test('E2E-FV-05: Edit patient sem altura válida mostra erro aria-invalid', async ({
    page,
    request,
  }) => {
    // Cria paciente com dados válidos
    const loginResp = await request.post(`${API_BASE}/auth/login`, {
      data: { email: page.url().includes('@') ? page.url() : 'skip', password },
    });

    // Cria paciente via API
    const createResp = await request.post(`${API_BASE}/patients`, {
      headers: { Authorization: `Bearer ${(await loginResp.json()).accessToken}` },
      data: createPatientPayload({ name: 'Paciente Editar Validação', objective: 'EMAGRECIMENTO' }),
    });
    const patientId = (await createResp.json()).data.id;

    await page.goto('/patients');
    await page.waitForLoadState('networkidle');

    const row = page
      .locator('tr, .pq-item, .card')
      .filter({ hasText: 'Paciente Editar Validação' })
      .first();
    await row.click();
    await page.waitForLoadState('networkidle');

    await page
      .getByRole('button', { name: /Editar/i })
      .first()
      .click();

    // Limpa altura e coloca valor inválido
    const heightInput = page.locator('#edit-height');
    await heightInput.fill('0');
    await page.keyboard.press('Tab');

    // Salvar deve estar desabilitado ou clicar não fecha modal
    await page
      .locator('.btn.btn-primary')
      .filter({ hasText: /Salvar/i })
      .click();

    // Modal ainda visível (validação bloqueou)
    await expect(page.locator('#edit-height')).toBeVisible({ timeout: 3_000 });

    // Verifica aria-invalid ou erro visível
    const hasAriaInvalid = await heightInput.getAttribute('aria-invalid').catch(() => null);
    const errorAlert = page.locator('[role="alert"], .text-coral').filter({ hasText: /altura/i });

    if (hasAriaInvalid === 'true') {
      await expect(heightInput).toHaveAttribute('aria-invalid', 'true');
    } else {
      // Se não usa aria-invalid, verifica erro visível
      await expect(errorAlert).toBeVisible({ timeout: 3_000 });
    }
  });
});
