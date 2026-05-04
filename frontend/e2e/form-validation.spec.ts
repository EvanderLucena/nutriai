import { test, expect } from '@playwright/test';
import { completeOnboardingViaApi, signupViaApi, uniqueEmail, API_BASE } from './helpers';
import { test as authTest } from './fixtures';

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

  test('E2E-FV-06: Signup com email duplicado mostra erro 409 visivel', async ({
    page,
    request,
  }) => {
    const email = uniqueEmail();
    await signupViaApi(request, email, 'SenhaSegura123!');

    await page.goto('/signup');
    await page.waitForLoadState('networkidle');

    await page.getByTestId('signup-name').fill('Usuario Duplicado');
    await page.getByTestId('signup-email').fill(email);
    await page.getByTestId('signup-password').fill('SenhaSegura123!');
    await page.getByTestId('signup-crn').fill('12345');

    // Clica em Avançar e depois Concluir (2 steps)
    await page.getByRole('button', { name: /avançar/i }).click();
    await page.waitForLoadState('networkidle');

    await page.getByTestId('signup-crn-regional').selectOption('SP');
    await page.getByTestId('signup-consent').check();
    await page.getByRole('button', { name: /concluir|criar conta/i }).click();

    // Deve mostrar erro de email duplicado
    const errorAlert = page.locator('[role="alert"], .text-coral, .auth-field-error');
    await expect(errorAlert).toBeVisible({ timeout: 8_000 });

    // Permanece em /signup
    await expect(page).toHaveURL(/\/signup/, { timeout: 5_000 });
  });
});

// Patient tests usa authenticatedPage fixture para evitar login duplicado
authTest.describe('Form Validation — Patient', () => {
  authTest('E2E-FV-03: New patient sem nome bloqueia submit', async ({ authenticatedPage }) => {
    const { page } = authenticatedPage;

    await page.goto('/patients');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /novo paciente/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 3_000 });

    // Deixa nome vazio e tenta clicar submit — botão deve estar desabilitado
    const submitBtn = page.getByTestId('newpatient-submit');
    await expect(submitBtn).toBeDisabled();
  });

  authTest('E2E-FV-04: WhatsApp exibe erro quando incompleto', async ({ authenticatedPage }) => {
    const { page } = authenticatedPage;

    await page.goto('/patients');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /novo paciente/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 3_000 });

    await page.getByTestId('newpatient-name').fill('Paciente Validacao');
    await page.getByTestId('newpatient-objective').selectOption({ label: 'Hipertrofia' });
    await page.getByTestId('newpatient-terms').check();

    // Preenche WhatsApp com apenas 1 digito
    await page.getByTestId('newpatient-whatsapp').fill('1');

    // Blur para disparar validacao
    await page.keyboard.press('Tab');

    // O botao Cadastrar deve estar desabilitado (validacao de 10 digitos)
    // OU uma mensagem de erro deve aparecer
    const submitBtn = page.getByTestId('newpatient-submit');
    const isDisabled = await submitBtn.isDisabled().catch(() => false);
    if (!isDisabled) {
      const whatsappError = page
        .getByRole('alert')
        .filter({ hasText: /WhatsApp deve ter pelo menos 10 digitos/i });
      await expect(whatsappError).toBeVisible({ timeout: 3_000 });
    }
  });

  authTest(
    'E2E-FV-05: Edit patient com altura invalida bloqueia submit e mostra erro',
    async ({ authenticatedPage }) => {
      const { page } = authenticatedPage;

      // Cria paciente via UI
      await page.goto('/patients');
      await page.waitForLoadState('networkidle');

      await page.getByRole('button', { name: /novo paciente/i }).click();
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 3_000 });

      await page.getByTestId('newpatient-name').fill('Paciente Editar Validacao');
      await page.getByTestId('newpatient-objective').selectOption({ label: 'Hipertrofia' });
      await page.getByTestId('newpatient-terms').check();
      await page.getByTestId('newpatient-submit').click();
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
      await expect(page.getByTestId('editpatient-objective')).toBeVisible({ timeout: 3_000 });

      // Limpa altura e coloca 0
      const heightInput = page.getByTestId('editpatient-height');
      await heightInput.fill('0');
      await page.keyboard.press('Tab');

      // Tenta salvar
      await page.getByTestId('editpatient-submit').click();

      // Modal ainda visivel (validacao bloqueou submit)
      await expect(page.getByTestId('editpatient-objective')).toBeVisible({ timeout: 5_000 });

      // Verifica mensagem de erro de altura
      const heightError = page.locator('text=Altura deve estar entre 50 e 250 cm');
      await expect(heightError).toBeVisible({ timeout: 3_000 });
    },
  );
});
