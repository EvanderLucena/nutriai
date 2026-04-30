import { test, expect } from '@playwright/test';
import {
  completeOnboardingViaApi,
  createPatientPayload,
  signupViaApi,
  uniqueEmail,
  API_BASE,
} from './helpers';

// Testes de validacao de formularios: campos obrigatorios, mascaras, erros visiveis,
// aria-invalid, e botao de submit bloqueado enquanto invalido.
test.use({ storageState: undefined } as { storageState: string | undefined });

test.describe('Form Validation — Auth', () => {
  test('E2E-FV-01: Signup com campos vazios mostra erros e nao redireciona', async ({ page }) => {
    await page.goto('/signup');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /criar conta/i }).click();

    // A pagina deve continuar em /signup
    await expect(page).toHaveURL(/\/signup/, { timeout: 5_000 });

    // Deve haver mensagens de erro visiveis
    const alerts = page.locator('[role="alert"]');
    await expect(alerts).toHaveCount({ gte: 1 });

    // Campos com erro devem ter aria-invalid
    const email = page.getByTestId('signup-email');
    await expect(email).toHaveAttribute('aria-invalid', 'true');
  });

  test('E2E-FV-02: Login com senha errada mostra erro visivel', async ({ page, request }) => {
    const email = uniqueEmail();
    await signupViaApi(request, email, 'SenhaSegura123!');
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

    // Nao preenche nome
    const nameInput = page.locator('input[placeholder*="Ana Beatriz"]');
    await nameInput.fill('');

    const saveBtn = page.getByRole('button', { name: /cadastrar/i });

    // Clica Salvar
    await saveBtn.click();

    // Modal ainda visivel
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 3_000 });

    // Erro de campo obrigatorio
    const errorText = page.locator('text=obrigatorio');
    await expect(errorText).toBeVisible({ timeout: 3_000 });
  });

  test('E2E-FV-04: WhatsApp exibe erro quando incompleto', async ({ page }) => {
    await page.goto('/patients');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /novo paciente/i }).click();
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 3_000 });

    await page.locator('input[placeholder*="Ana Beatriz"]').fill('Paciente Validacao');
    await page.locator('select').first().selectOption({ label: 'Hipertrofia' });
    await page.getByRole('checkbox').check();

    // Preenche WhatsApp com apenas 1 digito
    const whatsappInput = page.locator('input[placeholder*="99999-9999"]');
    await whatsappInput.fill('1');

    // Clica fora para blur
    await page.keyboard.press('Tab');

    // O botao Cadastrar deve estar desabilitado (validacao de 10 digitos)
    // OU uma mensagem de erro deve aparecer
    const saveBtn = page.getByRole('button', { name: /cadastrar/i });
    const isDisabled = await saveBtn.isDisabled().catch(() => false);
    if (!isDisabled) {
      const whatsappError = page.locator('text=WhatsApp deve ter pelo menos 10 digitos');
      await expect(whatsappError).toBeVisible({ timeout: 3_000 });
    }
  });

  test('E2E-FV-05: Edit patient com altura invalida bloqueia submit e mostra erro', async ({
    page,
  }) => {
    // Cria paciente via UI (ja autenticado pelo beforeEach)
    await page.goto('/patients');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /novo paciente/i }).click();
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 3_000 });

    await page.locator('input[placeholder*="Ana Beatriz"]').fill('Paciente Editar Validacao');
    await page.locator('select').first().selectOption({ label: 'Hipertrofia' });
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: /cadastrar/i }).click();
    await page.waitForResponse((r) => r.url().includes('/patients') && r.status() === 201, {
      timeout: 15_000,
    });

    // Vai para o paciente criado
    const row = page
      .locator('tr, .pq-item, .card')
      .filter({ hasText: 'Paciente Editar Validacao' })
      .first();
    await row.click();
    await page.waitForLoadState('networkidle');

    // Abre edit modal
    await page
      .getByRole('button', { name: /Editar/i })
      .first()
      .click();
    await expect(page.locator('#edit-objective')).toBeVisible({ timeout: 3_000 });

    // Limpa altura e coloca 0
    const heightInput = page.locator('#edit-height');
    await heightInput.fill('0');
    await page.keyboard.press('Tab');

    // Tenta salvar
    await page
      .locator('.btn.btn-primary')
      .filter({ hasText: /Salvar/i })
      .click();

    // Modal ainda visivel (validacao bloqueou submit)
    await expect(page.locator('#edit-objective')).toBeVisible({ timeout: 5_000 });

    // Verifica mensagem de erro de altura
    const heightError = page.locator('text=Altura deve estar entre 50 e 250 cm');
    await expect(heightError).toBeVisible({ timeout: 3_000 });
  });
});
