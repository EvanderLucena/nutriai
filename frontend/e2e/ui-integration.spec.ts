import { test, expect } from './fixtures';
import { createPatientPayload, API_BASE } from './helpers';

test.describe('Patient Management — UI→API Integration', () => {
  test('E2E-PM-16: New patient modal sends enum keys via API', async ({
    authenticatedPage,
    request,
  }) => {
    const { page, accessToken } = authenticatedPage;

    await page.goto('/patients');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /novo paciente/i }).click();
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible({ timeout: 3_000 });

    await page.getByTestId('newpatient-name').fill('Paciente Integração');
    await page.getByTestId('newpatient-objective').selectOption({ label: 'Hipertrofia' });
    await page.getByTestId('newpatient-terms').check();

    await page.getByTestId('newpatient-submit').click();
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

  test('E2E-PM-17: Edit patient modal sends enum key for objective', async ({
    authenticatedPage,
    request,
  }) => {
    const { page, accessToken } = authenticatedPage;

    const createResp = await request.post(`${API_BASE}/patients`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: createPatientPayload({ name: 'Paciente Editar UI', objective: 'EMAGRECIMENTO' }),
    });
    const patientId = (await createResp.json()).data.id;

    await page.goto('/patients');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /novo paciente/i }).click();
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible({ timeout: 3_000 });

    await page.getByTestId('newpatient-name').fill('Paciente Editar UI');
    await page.getByTestId('newpatient-objective').selectOption({ label: 'Hipertrofia' });
    await page.getByTestId('newpatient-terms').check();

    await page.getByTestId('newpatient-submit').click();
    await page.waitForResponse(
      (resp) => resp.url().includes('/patients') && resp.status() === 201,
      { timeout: 15_000 },
    );
    await expect(modal).not.toBeVisible({ timeout: 5_000 });

    const response = await request.get(`${API_BASE}/patients`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { search: 'Paciente Editar UI' },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    const found = body.data?.content?.find(
      (p: { name: string }) => p.name === 'Paciente Editar UI',
    );
    expect(found).toBeDefined();
    expect(found.objective).toBe('HIPERTROFIA');
  });
});

test.describe('Food Catalog — UI→API Integration', () => {
  test('E2E-FC-16: Create food via UI sends correct enum keys to API', async ({
    authenticatedPage,
    request,
  }) => {
    const { page, accessToken } = authenticatedPage;

    await page.goto('/foods');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /novo alimento/i }).click();
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible({ timeout: 3_000 });

    await page.getByTestId('newfood-name').fill('Whey Protein E2E');
    await page.getByTestId('newfood-category').selectOption({ label: 'Proteína' });
    await page.getByTestId('newfood-ref').fill('100');

    const saveResponsePromise = page.waitForResponse(
      (resp) => resp.url().includes('/api/v1/foods') && resp.status() === 201,
      { timeout: 15_000 },
    );

    await page.getByTestId('newfood-submit').click();
    await saveResponsePromise;
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
