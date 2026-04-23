import { test as setup, expect } from '@playwright/test';
import { uniqueEmail } from './helpers';

const authFile = 'e2e/.auth/user.json';

setup('authenticate', async ({ page }) => {
  const email = uniqueEmail();
  const password = 'SenhaSegura123!';

  const resp = await page.request.post('http://localhost:8080/api/v1/auth/signup', {
    data: {
      name: 'E2E Authenticated User',
      email,
      password,
      crn: '99998',
      crnRegional: 'SP',
      terms: true,
    },
  });

  expect(resp.ok(), `Signup failed: ${resp.status()} ${await resp.text().catch(() => '')}`).toBeTruthy();
  const body = await resp.json();

  await page.goto('/login');
  await page.waitForLoadState('networkidle');

  await page.evaluate(({ token, user }) => {
    localStorage.setItem('nutriai-auth', JSON.stringify({
      state: {
        isAuthenticated: true,
        accessToken: token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role, onboardingCompleted: user.onboardingCompleted },
      },
      version: 0,
    }));
  }, { token: body.accessToken, user: body.user });

  await page.context().storageState({ path: authFile });
});