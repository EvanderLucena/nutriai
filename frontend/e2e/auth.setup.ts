import { test as setup, expect } from '@playwright/test';
import { uniqueEmail, signupViaApi, completeOnboardingViaApi } from './helpers';

setup('authenticate', async ({ page, request }) => {
  const email = uniqueEmail();
  const password = 'SenhaSegura123!';

  const result = await signupViaApi(request, email, password);
  await completeOnboardingViaApi(request, result.accessToken);

  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.getByTestId('login-email').fill(email);
  await page.getByTestId('login-password').fill(password);
  await page.getByRole('button', { name: /Entrar/i }).click();

  await expect(page).toHaveURL(/\/home/, { timeout: 10_000 });
  await page.waitForLoadState('networkidle');

  await page.context().storageState({ path: 'e2e/.auth/user.json' });
});
