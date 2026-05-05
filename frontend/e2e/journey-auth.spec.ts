import { test, expect } from '@playwright/test';
import { uniqueEmail } from './helpers';

test.describe('Jornada — Auth', () => {
  test('E2E-J-01: signup UI → onboarding → home', async ({ page }) => {
    const email = `e2e_${Date.now()}_${Math.random().toString(36).slice(2, 7)}@test.com`;
    const password = 'SenhaSegura123!';

    await test.step('1. Signup via UI', async () => {
      await page.goto('/signup');
      await page.waitForLoadState('networkidle');

      await page.getByTestId('signup-name').fill('Dra. Jornada E2E');
      await page.getByTestId('signup-email').fill(email);
      await page.getByTestId('signup-password').fill(password);
      await page.getByRole('button', { name: /continuar/i }).click();

      // Step 2
      await page.getByTestId('signup-crn').fill('99999');
      await page.getByTestId('signup-crn-regional').selectOption({ label: 'SP' });

      await page.getByRole('checkbox').check();
      await page.getByRole('button', { name: /criar conta/i }).click();

      await expect(page).toHaveURL(/\/(onboarding|home)/, { timeout: 10_000 });
    });

    await test.step('2. Onboarding (pular)', async () => {
      if (page.url().includes('/onboarding')) {
        // O onboarding tem um botão "PULAR POR ENQUANTO" no topo direito
        const skipBtn = page.locator('text=/pular/i').first();
        if (await skipBtn.isVisible().catch(() => false)) {
          await skipBtn.click();
        }
        await expect(page).toHaveURL(/\/home/, { timeout: 10_000 });
      }
    });

    await test.step('3. Dashboard visivel', async () => {
      await expect(page.getByText(/Pacientes ativos/i)).toBeVisible({ timeout: 5_000 });
    });
  });
});
