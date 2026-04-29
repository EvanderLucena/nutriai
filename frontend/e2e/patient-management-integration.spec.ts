import { test, expect } from '@playwright/test';
import {
  completeOnboardingViaApi,
  createPatientPayload,
  signupViaApi,
  uniqueEmail,
  API_BASE,
} from './helpers';

test.describe('Patient Management — UI→API Integration', () => {
  let accessToken: string;
  let email: string;
  const password = 'SenhaSegura123!';

  test.beforeEach(async ({ page, request }) => {
    email = uniqueEmail();
    const result = await signupViaApi(request, email, password);
    accessToken = result.accessToken;
    await completeOnboardingViaApi(request, accessToken);

    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.getByTestId('login-email').fill(email);
    await page.getByTestId('login-password').fill(password);
    await page.getByRole('button', { name: /Entrar/i }).click();
    await expect(page).toHaveURL(/\/home/, { timeout: 10_000 });
  });

  test('E2E-PM-16: New patient modal shows pt-BR labels but sends enum keys', async ({
    page,
    request,
  }) => {
    await page.goto('/patients');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /novo paciente/i }).click();
    const modal = page.locator('[role="dialog"], .modal');
    await expect(modal).toBeVisible({ timeout: 3_000 });

    const nameInput = page.locator('input[placeholder*="Ana Beatriz"]');
    await nameInput.fill('Paciente Integração');

    const objectiveSelect = page
      .locator('select[value=""], select')
      .filter({ has: page.locator('option', { hasText: 'Selecione' }) })
      .first();
    await objectiveSelect.selectOption({ label: 'Hipertrofia' });
    await page.getByRole('checkbox').check();

    const saveBtn = page.getByRole('button', { name: /cadastrar/i });
    await saveBtn.click();
    await expect(modal).not.toBeVisible({ timeout: 5_000 });

    const response = await request.get(`${API_BASE}/patients`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { search: 'Paciente Integração' },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    const found = body.data?.content?.find(
      (p: { name: string }) => p.name === 'Paciente Integração',
    );
    expect(found).toBeDefined();
    expect(found.objective).toBe('HIPERTROFIA');
  });

  test('E2E-PM-17: Edit patient modal sends enum key for objective', async ({ page, request }) => {
    const createResp = await request.post(`${API_BASE}/patients`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: createPatientPayload({ name: 'Paciente Editar UI', objective: 'EMAGRECIMENTO' }),
    });
    const patientId = (await createResp.json()).data.id;

    await page.goto('/patients');
    await page.waitForLoadState('networkidle');

    const row = page
      .locator('tr, .pq-item, .card')
      .filter({ hasText: 'Paciente Editar UI' })
      .first();
    await expect(row).toBeVisible({ timeout: 5_000 });
    await row.click();
    await expect(page).toHaveURL(/\/patient\//, { timeout: 5_000 });

    await page
      .getByRole('button', { name: /Editar/i })
      .first()
      .click();
    await expect(page.locator('#edit-objective')).toBeVisible({ timeout: 3_000 });

    await page.locator('#edit-objective').selectOption({ label: 'Hipertrofia' });

    await page
      .locator('.btn.btn-primary')
      .filter({ hasText: /Salvar/i })
      .click();

    await expect(page.locator('#edit-objective')).not.toBeVisible({ timeout: 5_000 });

    const getResp = await request.get(`${API_BASE}/patients/${patientId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(getResp.status()).toBe(200);
    const updated = await getResp.json();
    expect(updated.data.objective).toBe('HIPERTROFIA');
  });
});

test.describe('Food Catalog — UI→API Integration', () => {
  let accessToken: string;
  let email: string;
  const password = 'SenhaSegura123!';

  test.beforeEach(async ({ page, request }) => {
    email = uniqueEmail();
    const result = await signupViaApi(request, email, password);
    accessToken = result.accessToken;
    await completeOnboardingViaApi(request, accessToken);

    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.getByTestId('login-email').fill(email);
    await page.getByTestId('login-password').fill(password);
    await page.getByRole('button', { name: /Entrar/i }).click();
    await expect(page).toHaveURL(/\/home/, { timeout: 10_000 });
  });

  test('E2E-FC-16: Create food via UI sends correct enum keys to API', async ({
    page,
    request,
  }) => {
    await page.goto('/foods');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /novo alimento/i }).click();
    const modal = page.locator('[role="dialog"], .modal');
    await expect(modal).toBeVisible({ timeout: 3_000 });

    const nameInput = page.locator('input[placeholder*="Frango"]');
    await nameInput.fill('Whey Protein E2E');

    const selects = page.locator('select');
    const categorySelect = selects.first();
    await categorySelect.selectOption({ label: 'Proteína' });

    const refInput = page.locator('#create-food-ref');
    await refInput.fill('100');

    const saveBtn = page.getByRole('button', { name: /salvar/i });
    await saveBtn.click();
    await expect(modal).not.toBeVisible({ timeout: 5_000 });

    const response = await request.get(`${API_BASE}/foods`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { search: 'Whey Protein E2E' },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    const found = body.data?.content?.find((p: { name: string }) => p.name === 'Whey Protein E2E');
    expect(found).toBeDefined();
    expect(found.category).toBe('PROTEINA');
  });
});
