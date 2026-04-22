import { test, expect } from '@playwright/test';
import { uniqueEmail, signupViaApi } from './helpers';

test.describe('Auth — Signup', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/signup');
    await page.waitForLoadState('networkidle');
  });

  test('E2E-AUTH-01: Signup completo redireciona para onboarding', async ({ page }) => {
    const email = uniqueEmail();

    await page.getByTestId('signup-name').fill('Dra. E2E Teste');
    await page.getByTestId('signup-email').fill(email);
    await page.getByTestId('signup-password').fill('SenhaSegura123!');
    await page.getByRole('button', { name: 'Continuar' }).click();

    await expect(page.getByTestId('signup-crn')).toBeVisible({ timeout: 5_000 });

    await page.getByTestId('signup-crn').fill('99999');
    await page.getByTestId('signup-crn-regional').selectOption('SP');
    await page.getByTestId('signup-terms').check();
    await page.getByRole('button', { name: 'Criar conta' }).click();

    await expect(page).toHaveURL(/\/onboarding/, { timeout: 15_000 });
  });

  test('E2E-AUTH-02: Email duplicado mostra erro', async ({ page }) => {
    const email = uniqueEmail();

    await page.getByTestId('signup-name').fill('Usuário Original');
    await page.getByTestId('signup-email').fill(email);
    await page.getByTestId('signup-password').fill('SenhaSegura123!');
    await page.getByRole('button', { name: 'Continuar' }).click();
    await page.getByTestId('signup-crn').fill('99999');
    await page.getByTestId('signup-crn-regional').selectOption('SP');
    await page.getByTestId('signup-terms').check();
    await page.getByRole('button', { name: 'Criar conta' }).click();
    await page.waitForURL(/\/onboarding|\/home/, { timeout: 10_000 });

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

  test('E2E-AUTH-03: Senha curta não permite submit', async ({ page }) => {
    await page.getByTestId('signup-name').fill('Nome Teste');
    await page.getByTestId('signup-email').fill(uniqueEmail());
    await page.getByTestId('signup-password').fill('123');
    await page.getByRole('button', { name: 'Continuar' }).click();

    await expect(page).toHaveURL(/\/signup/);
  });

  test('E2E-AUTH-04: Campos vazios no step 1 mantém na página', async ({ page }) => {
    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(page).toHaveURL(/\/signup/);
  });

  test('E2E-AUTH-05: Navegação signup → login', async ({ page }) => {
    await page.getByRole('link', { name: /Entrar/i }).click();
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Auth — Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
  });

  test('E2E-AUTH-06: Login com credenciais válidas redireciona para home', async ({ page }) => {
    const email = uniqueEmail();
    await signupViaApi(email);

    await page.getByTestId('login-email').fill(email);
    await page.getByTestId('login-password').fill('SenhaSegura123!');
    await page.getByRole('button', { name: /Entrar/i }).click();

    await expect(page).toHaveURL(/\/home|\/onboarding/, { timeout: 10_000 });
  });

  test('E2E-AUTH-07: Senha errada mostra erro', async ({ page }) => {
    await page.getByTestId('login-email').fill('wrong@test.com');
    await page.getByTestId('login-password').fill('wrongpassword');
    await page.getByRole('button', { name: /Entrar/i }).click();

    await expect(page.locator('.auth-error')).toBeVisible({ timeout: 10_000 });
  });

  test('E2E-AUTH-08: Email vazio não envia formulário', async ({ page }) => {
    await page.getByTestId('login-password').fill('SenhaSegura123!');
    const btn = page.getByRole('button', { name: /Entrar/i });
    await expect(btn).toBeDisabled();
  });

  test('E2E-AUTH-09: Navegação login → signup', async ({ page }) => {
    await page.getByRole('link', { name: /Criar conta/i }).click();
    await expect(page).toHaveURL(/\/signup/);
  });
});

test.describe('Auth — Protection', () => {
  test('E2E-AUTH-10: Rota protegida sem auth redireciona para landing', async ({ page }) => {
    await page.goto('/home');
    await expect(page).toHaveURL(/\/$|\/login/, { timeout: 5_000 });
  });

  test('E2E-AUTH-11: Rota /patients sem auth redireciona', async ({ page }) => {
    await page.goto('/patients');
    await expect(page).toHaveURL(/\/$|\/login/, { timeout: 5_000 });
  });

  test('E2E-AUTH-12: Rota /foods sem auth redireciona', async ({ page }) => {
    await page.goto('/foods');
    await expect(page).toHaveURL(/\/$|\/login/, { timeout: 5_000 });
  });
});

test.describe('Auth — API Contract', () => {
  test('E2E-AUTH-13: Signup retorna accessToken e user', async ({ request }) => {
    const email = uniqueEmail();
    const response = await request.post('http://localhost:8080/api/v1/auth/signup', {
      data: {
        name: 'Dra. Contrato Teste',
        email,
        password: 'SenhaSegura123!',
        crn: '54321',
        crnRegional: 'SP',
        terms: true,
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('accessToken');
    expect(body.accessToken).toBeTypeOf('string');
    expect(body.user).toBeDefined();
    expect(body.user.email).toBe(email);
    expect(body.user.role).toBe('NUTRITIONIST');
  });

  test('E2E-AUTH-14: Login retorna accessToken e user', async ({ request }) => {
    const email = uniqueEmail();
    await signupViaApi(email);

    const response = await request.post('http://localhost:8080/api/v1/auth/login', {
      data: { email, password: 'SenhaSegura123!' },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('accessToken');
    expect(body.user).toBeDefined();
    expect(body.user.email).toBe(email);
  });

  test('E2E-AUTH-15: Login com senha errada retorna 401', async ({ request }) => {
    const email = uniqueEmail();
    await signupViaApi(email);

    const response = await request.post('http://localhost:8080/api/v1/auth/login', {
      data: { email, password: 'senhaerrada' },
    });

    expect(response.status()).toBe(401);
  });

  test('E2E-AUTH-16: GET /auth/me sem token retorna 401', async ({ request }) => {
    const response = await request.get('http://localhost:8080/api/v1/auth/me');
    expect(response.status()).toBe(401);
  });

  test('E2E-AUTH-17: GET /auth/me com token válido retorna usuário', async ({ request }) => {
    const { accessToken } = await signupViaApi(uniqueEmail());

    const response = await request.get('http://localhost:8080/api/v1/auth/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('id');
    expect(body).toHaveProperty('email');
    expect(body).toHaveProperty('role');
  });
});