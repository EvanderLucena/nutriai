import { test, expect } from '@playwright/test';
import { uniqueEmail } from './helpers';

test.describe('Signup', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/signup');
    await page.waitForLoadState('networkidle');
  });

  test('E2E-01: Signup completo redireciona para onboarding', async ({ page }) => {
    const email = uniqueEmail();

    await page.getByTestId('signup-name').fill('Dra. E2E Teste');
    await page.getByTestId('signup-email').fill(email);
    await page.getByTestId('signup-password').fill('SenhaSegura123!');
    await page.getByRole('button', { name: 'Continuar' }).click();

    await page.getByTestId('signup-crn').fill('99999');
    await page.getByTestId('signup-crn-regional').selectOption('SP');
    await page.getByTestId('signup-terms').check();
    await page.getByRole('button', { name: 'Criar conta' }).click();

    await expect(page).toHaveURL(/\/onboarding/, { timeout: 15_000 });
  });

  test('E2E-02: Email duplicado mostra erro', async ({ page }) => {
    const email = uniqueEmail();

    // First signup
    await page.getByTestId('signup-name').fill('Usuário Original');
    await page.getByTestId('signup-email').fill(email);
    await page.getByTestId('signup-password').fill('SenhaSegura123!');
    await page.getByRole('button', { name: 'Continuar' }).click();
    await page.getByTestId('signup-crn').fill('99999');
    await page.getByTestId('signup-crn-regional').selectOption('SP');
    await page.getByTestId('signup-terms').check();
    await page.getByRole('button', { name: 'Criar conta' }).click();
    await page.waitForURL(/\/onboarding|\/home/, { timeout: 10_000 });

    // Clear auth and try same email
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());
    await page.goto('/signup');
    await page.waitForLoadState('networkidle');

    await page.getByTestId('signup-name').fill('Usuário Duplicado');
    await page.getByTestId('signup-email').fill(email);
    await page.getByTestId('signup-password').fill('OutraSenha456!');
    await page.getByRole('button', { name: 'Continuar' }).click();
    await page.getByTestId('signup-crn').fill('99998');
    await page.getByTestId('signup-crn-regional').selectOption('RJ');
    await page.getByTestId('signup-terms').check();
    await page.getByRole('button', { name: 'Criar conta' }).click();

    await expect(page.locator('.auth-error')).toBeVisible({ timeout: 5_000 });
  });

  test('E2E-05: Navegação signup → login', async ({ page }) => {
    await page.getByRole('link', { name: /Entrar/i }).click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('E2E-17: Step 1 com campos vazios', async ({ page }) => {
    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(page).toHaveURL(/\/signup/);
  });
});

test.describe('Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
  });

  test('E2E-07: Senha errada mostra erro', async ({ page }) => {
    await page.getByTestId('login-email').fill('wrong@test.com');
    await page.getByTestId('login-password').fill('wrongpassword');
    await page.getByRole('button', { name: /Entrar/i }).click();

    await expect(page.getByRole('button', { name: /entrando/i })).toBeVisible({ timeout: 3_000 }).catch(() => {});
    await expect(page.locator('.auth-error')).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('Auth Protection', () => {
  test('E2E-11: Rota protegida sem auth redireciona para landing', async ({ page }) => {
    await page.goto('/home');
    await expect(page).toHaveURL(/\/$|\/login/, { timeout: 5_000 });
  });
});