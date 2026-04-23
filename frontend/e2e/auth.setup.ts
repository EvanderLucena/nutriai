import { test as setup, expect } from '@playwright/test';
import { uniqueEmail, signupViaApi } from './helpers';

const API = 'http://localhost:8080/api/v1';

setup('authenticate', async ({ page, request }) => {
  const email = uniqueEmail();
  const password = 'SenhaSegura123!';

  const result = await signupViaApi(request, email, password);

  const onboardResp = await request.post(`${API}/auth/onboarding`, {
    headers: { Authorization: `Bearer ${result.accessToken}` },
  });
  expect(onboardResp.ok()).toBeTruthy();

  await page.goto('/login');
  await page.waitForLoadState('networkidle');

  await page.evaluate(({ token }) => {
    localStorage.setItem('nutriai-auth', JSON.stringify({
      state: {
        isAuthenticated: true,
        accessToken: token,
        user: { id: 'e2e-user', name: 'E2E Auth User', email: 'e2e@test.com', role: 'NUTRITIONIST', onboardingCompleted: true },
      },
      version: 0,
    }));
  }, { token: result.accessToken });

  await page.goto('/home');
  await page.waitForLoadState('networkidle');

  await page.context().storageState({ path: 'e2e/.auth/user.json' });
});