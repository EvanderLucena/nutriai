import { test, expect } from '@playwright/test';
import { completeOnboardingViaApi, uniqueEmail, signupViaApi } from './helpers';

test.describe('Jornada — Auth', () => {
  test('E2E-J-01: signup UI → onboarding completo → home', async ({ page }) => {
    const email = uniqueEmail();
    const password = 'SenhaSegura123!';

    await test.step('1. Signup via UI', async () => {
      await page.goto('/signup');

      await page.getByTestId('signup-name').fill('Dra. Jornada E2E');
      await page.getByTestId('signup-email').fill(email);
      await page.getByTestId('signup-password').fill(password);
      await page.getByRole('button', { name: /continuar/i }).click();

      // Step 2
      await page.getByTestId('signup-crn').fill('99999');
      await page.getByTestId('signup-crn-regional').selectOption({ label: 'SP' });

      await page.getByRole('checkbox').check();
      await page.getByRole('button', { name: /criar conta/i }).click();

      await expect(page).toHaveURL(/\/onboarding/, { timeout: 10_000 });
    });

    await test.step('2. Onboarding completo', async () => {
      await expect(page.getByText(/Conheça sua carteira/i).first()).toBeVisible({
        timeout: 5_000,
      });
      await page.getByRole('button', { name: /Adicionar depois/i }).click();

      await expect(
        page.getByRole('heading', { name: /Configure seu (primeiro )?plano/i }),
      ).toBeVisible({ timeout: 5_000 });
      await page.getByRole('button', { name: /Configurar plano/i }).click();

      await expect(page.getByRole('heading', { name: /Convide seus pacientes/i })).toBeVisible({
        timeout: 5_000,
      });
      await page.getByRole('button', { name: /Enviar convites/i }).click();

      await expect(page.getByRole('heading', { name: /Escolha seu plano/i })).toBeVisible({
        timeout: 5_000,
      });
      await page
        .getByText(/Profissional/i)
        .first()
        .click();
      await page.getByRole('button', { name: /Continuar/i }).click();

      await expect(page.getByRole('heading', { name: /Dados de pagamento/i })).toBeVisible({
        timeout: 5_000,
      });
      await page.getByPlaceholder(/Nome como aparece no cartão/i).fill('Dra Jornada E2E');
      await page.getByPlaceholder(/000\.000\.000-00/i).fill('12345678901');
      await page.getByPlaceholder(/0000 0000 0000 0000/i).fill('4242424242424242');
      await page.getByPlaceholder(/MM\/AA/i).fill('1230');
      await page.getByPlaceholder(/000/i).last().fill('123');
      await page.getByRole('button', { name: /Ativar trial de 30 dias/i }).click();

      await expect(page.getByText(/Pronto!/i)).toBeVisible({ timeout: 5_000 });
      await page.getByRole('button', { name: /Ir pro painel/i }).click();
      await expect(page).toHaveURL(/\/home/, { timeout: 10_000 });
    });

    await test.step('3. Dashboard visivel', async () => {
      await expect(page.getByText(/Pacientes ativos/i)).toBeVisible({ timeout: 5_000 });
    });
  });

  test('E2E-J-02: login → logout por rota dedicada invalida sessão', async ({ page, request }) => {
    const email = uniqueEmail();
    const password = 'SenhaSegura123!';
    const result = await signupViaApi(request, email, password);
    await completeOnboardingViaApi(request, result.accessToken);

    await page.goto('/login');
    await page.getByTestId('login-email').fill(email);
    await page.getByTestId('login-password').fill(password);
    await page.getByRole('button', { name: /Entrar/i }).click();
    await expect(page).toHaveURL(/\/home/, { timeout: 10_000 });

    await page.goto('/logout');
    await expect(page).toHaveURL(/\/$/, { timeout: 10_000 });

    await page.goto('/home');
    await expect(page).toHaveURL(/\/$/, { timeout: 10_000 });
  });
});
