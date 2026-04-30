import { test, expect } from '@playwright/test';
import {
  completeOnboardingViaApi,
  createPatientPayload,
  signupViaApi,
  uniqueEmail,
  API_BASE,
} from './helpers';

// Esta spec nao utiliza storageState pois precisa fazer login real
// Em Docker Chromium, o localStorage sofre cross-origin errors; workaround: usar /login real
test.use({ storageState: undefined } as { storageState: string | undefined });

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
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 3_000 });

    const nameInput = page.locator('input[placeholder*="Ana Beatriz"]');
    await nameInput.fill('Paciente Integração');

    // Espera o select renderizar completamente antes de interagir
    const objectiveSelect = page.locator('select');
    await objectiveSelect.first().waitFor({ timeout: 3_000 });
    await objectiveSelect.first().selectOption({ label: 'Hipertrofia' });

    await page.getByRole('checkbox').check();

    const saveBtn = page.getByRole('button', { name: /cadastrar/i });
    await saveBtn.click();

    // Aguarda o POST completar e o modal desaparecer
    await page.waitForResponse(
      (resp) => resp.url().includes('/patients') && resp.status() === 201,
      { timeout: 15_000 },
    );
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

    await page.locator('#edit-objective').selectOption({ label: 'Hipertrofia' });

    // Preenche campos obrigatórios para permitir submit válido
    // (altura 0 e whatsapp "(" quebram validateAll() do EditPatientModal)
    if (await page.locator('#edit-height').inputValue() === '0') {
      await page.locator('#edit-height').fill('170');
    }
    if ((await page.locator('#edit-whatsapp').inputValue()).length < 3) {
      await page.locator('#edit-whatsapp').fill('11999999999');
    }

    const saveBtn = page
      .locator('.btn.btn-primary')
      .filter({ hasText: /Salvar/i });
    await saveBtn.click();

    // O modal fecha via onSuccess mutation; não usamos waitForResponse
    // porque a interceptação de erro do frontend pode mascarar o status HTTP
    await expect(page.locator('#edit-objective')).not.toBeVisible({ timeout: 10_000 });

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

    // O modal CreateFoodModal não tem role="dialog" nem .modal; usa o heading como âncora
    const modal = page
      .locator('[class*="card"]')
      .filter({ has: page.locator('text=Novo alimento') })
      .first();
    await expect(modal).toBeVisible({ timeout: 3_000 });

    const nameInput = page.locator('input[placeholder*="Frango"]');
    await nameInput.fill('Whey Protein E2E');

    const selects = page.locator('select');
    const categorySelect = selects.first();
    await categorySelect.selectOption({ label: 'Proteína' });

    const refInput = page.locator('#create-food-ref');
    await refInput.fill('100');

    const saveResponsePromise = page.waitForResponse(
      (resp) => resp.url().includes('/api/v1/foods') && resp.status() === 201,
      { timeout: 15_000 },
    );

    const saveBtn = page.getByRole('button', { name: /salvar/i });
    await saveBtn.click();

    await saveResponsePromise;
    await expect(modal).not.toBeVisible({ timeout: 5_000 });

    const response = await request.get(`${API_BASE}/foods`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { search: 'Whey Protein E2E' },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    const found = body.data?.content?.find(
      (p: { name: string }) => p.name === 'Whey Protein E2E',
    );
    expect(found).toBeDefined();
    expect(found.category).toBe('PROTEINA');
  });
});
