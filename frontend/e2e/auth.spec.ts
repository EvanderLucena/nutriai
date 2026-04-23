import { test, expect } from '@playwright/test';
import { uniqueEmail, signupViaApi } from './helpers';

const API = 'http://localhost:8080/api/v1';

test.describe('Auth — Signup UI→API Integration', () => {
  test('E2E-AUTH-01: Signup completo UI→API redireciona para onboarding', async ({ page }) => {
    const email = uniqueEmail();
    await page.goto('/signup');
    await page.waitForLoadState('networkidle');

    await page.getByTestId('signup-name').fill('Dra. E2E Teste');
    await page.getByTestId('signup-email').fill(email);
    await page.getByTestId('signup-password').fill('SenhaSegura123!');
    await page.getByRole('button', { name: 'Continuar' }).click();

    await expect(page.getByTestId('signup-crn')).toBeVisible({ timeout: 5_000 });
    await page.getByTestId('signup-crn').fill('99999');
    await page.getByTestId('signup-crn-regional').selectOption('SP');
    await page.getByTestId('signup-terms').check();
    await page.getByRole('button', { name: 'Criar conta' }).click();

    await expect(page).toHaveURL(/\/(onboarding|home)/, { timeout: 15_000 });
  });

  test('E2E-AUTH-02: Email duplicado mostra erro visível ao usuário', async ({ page, request }) => {
    const email = uniqueEmail();
    await signupViaApi(request, email);

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
    await page.goto('/signup');
    await page.waitForLoadState('networkidle');
    await page.getByTestId('signup-name').fill('Nome Teste');
    await page.getByTestId('signup-email').fill(uniqueEmail());
    await page.getByTestId('signup-password').fill('123');
    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(page).toHaveURL(/\/signup/);
  });

  test('E2E-AUTH-04: Campos vazios mantém na página', async ({ page }) => {
    await page.goto('/signup');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(page).toHaveURL(/\/signup/);
  });
});

test.describe('Auth — Login UI→API Integration', () => {
  test('E2E-AUTH-05: Login válido redireciona para home', async ({ page, request }) => {
    const email = uniqueEmail();
    await signupViaApi(request, email);

    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.getByTestId('login-email').fill(email);
    await page.getByTestId('login-password').fill('SenhaSegura123!');
    await page.getByRole('button', { name: /Entrar/i }).click();

    await expect(page).toHaveURL(/\/home|\/onboarding/, { timeout: 10_000 });
  });

  test('E2E-AUTH-06: Senha errada mostra erro visível ao usuário', async ({ page, request }) => {
    const email = uniqueEmail();
    await signupViaApi(request, email);

    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.getByTestId('login-email').fill(email);
    await page.getByTestId('login-password').fill('wrongpassword');
    await page.getByRole('button', { name: /Entrar/i }).click();

    await expect(page.locator('.auth-error')).toBeVisible({ timeout: 10_000 });
  });

  test('E2E-AUTH-07: Email vazio mantém botão desabilitado', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.getByTestId('login-password').fill('SenhaSegura123!');
    const btn = page.getByRole('button', { name: /Entrar/i });
    await expect(btn).toBeDisabled();
  });
});

test.describe('Auth — API Contract & Value Rejection', () => {
  test('E2E-AUTH-08: Signup API retorna accessToken e user', async ({ request }) => {
    const email = uniqueEmail();
    const response = await request.post(`${API}/auth/signup`, {
      data: { name: 'Dra. Contrato', email, password: 'SenhaSegura123!', crn: '54321', crnRegional: 'SP', terms: true },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('accessToken');
    expect(typeof body.accessToken).toBe('string');
    expect(body.user).toBeDefined();
    expect(body.user.email).toBe(email);
    expect(body.user.role).toBe('NUTRITIONIST');
    expect(body.user).not.toHaveProperty('passwordHash');
  });

  test('E2E-AUTH-09: Login API retorna accessToken e user', async ({ request }) => {
    const email = uniqueEmail();
    await signupViaApi(request, email);

    const response = await request.post(`${API}/auth/login`, { data: { email, password: 'SenhaSegura123!' } });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('accessToken');
    expect(body.user).toBeDefined();
    expect(body.user).not.toHaveProperty('passwordHash');
  });

  test('E2E-AUTH-10: Login com senha errada retorna 401', async ({ request }) => {
    const email = uniqueEmail();
    await signupViaApi(request, email);

    const response = await request.post(`${API}/auth/login`, { data: { email, password: 'senhaerrada' } });
    expect(response.status()).toBe(401);
  });

  test('E2E-AUTH-11: GET /auth/me sem token retorna 401', async ({ request }) => {
    const response = await request.get(`${API}/auth/me`);
    expect(response.status()).toBe(401);
  });

  test('E2E-AUTH-12: GET /auth/me com token válido retorna usuário sem senha', async ({ request }) => {
    const { accessToken } = await signupViaApi(request, uniqueEmail());
    const response = await request.get(`${API}/auth/me`, { headers: { Authorization: `Bearer ${accessToken}` } });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('id');
    expect(body).not.toHaveProperty('passwordHash');
  });

  test('E2E-AUTH-13: Signup sem campos obrigatórios retorna 400', async ({ request }) => {
    const response = await request.post(`${API}/auth/signup`, { data: { email: uniqueEmail() } });
    expect(response.status()).toBe(400);
  });

  test('E2E-AUTH-14: Signup com email duplicado retorna 409', async ({ request }) => {
    const email = uniqueEmail();
    await signupViaApi(request, email);
    const response = await request.post(`${API}/auth/signup`, {
      data: { name: 'Duplicado', email, password: 'SenhaSegura123!', crn: '11111', crnRegional: 'SP', terms: true },
    });
    expect(response.status()).toBe(409);
  });
});

test.describe('Auth — Protection', () => {
  test('E2E-AUTH-15: Rota protegida sem auth redireciona para landing', async ({ page }) => {
    await page.goto('/home');
    await expect(page).toHaveURL(/\/$|\/login/, { timeout: 5_000 });
  });

  test('E2E-AUTH-16: Rota /patients sem auth redireciona', async ({ page }) => {
    await page.goto('/patients');
    await expect(page).toHaveURL(/\/$|\/login/, { timeout: 5_000 });
  });

  test('E2E-AUTH-17: Rota /foods sem auth redireciona', async ({ page }) => {
    await page.goto('/foods');
    await expect(page).toHaveURL(/\/$|\/login/, { timeout: 5_000 });
  });
});