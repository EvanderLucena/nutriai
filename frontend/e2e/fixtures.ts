import { test as base, type Page } from '@playwright/test';
import { uniqueEmail, signupViaApi, completeOnboardingViaApi } from './helpers';

export interface AuthenticatedPage {
  page: Page;
  accessToken: string;
  email: string;
  password: string;
}

/**
 * Playwright fixture that creates a fresh authenticated nutritionist via API
 * (sign-up + onboarding) and sets the page storage state to reuse sessions
 * within a describe block, eliminating duplicated logins.
 */
export const test = base.extend<{
  authenticatedPage: AuthenticatedPage;
}>({
  authenticatedPage: [
    async ({ page, request }, use) => {
      const email = uniqueEmail();
      const password = 'SenhaSegura123!';

      // 1. Create account via API (fast path)
      const result = await signupViaApi(request, email, password);
      await completeOnboardingViaApi(request, result.accessToken);

      // 2. Perform one UI login so Playwright captures storageState
      await page.goto('/login');
      await page.getByTestId('login-email').fill(email);
      await page.getByTestId('login-password').fill(password);
      await page.getByRole('button', { name: /Entrar/i }).click();
      await page.waitForURL(/\/(home|patients)/, { timeout: 10_000 });

      // 3. Export context state so subsequent tests in the same worker
      //    can reuse it without going through the login UI again.
      //    This is a *per-worker* optimization, not global storageState.
      const state = await page.context().storageState();
      await page.context().clearCookies();
      await page.context().addCookies(state.cookies);

      const auth: AuthenticatedPage = {
        page,
        accessToken: result.accessToken,
        email,
        password,
      };

      await use(auth);

      // Cleanup: nothing to do here — the created user lives in the database
      // and will be cleaned by the caller via `afterAll` when needed.
    },
    { auto: false }, // must be requested explicitly: `test.use({ authenticatedPage })`
  ],
});

export { expect } from '@playwright/test';
