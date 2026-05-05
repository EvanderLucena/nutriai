import { test, expect } from '@playwright/test';
import {
  completeOnboardingViaApi,
  createPatientPayload,
  signupViaApi,
  uniqueEmail,
  API_BASE,
} from './helpers';

test.describe('Patient Management — Page Rendering', () => {
  test('E2E-PM-01: Patients page renders heading', async ({ page }) => {
    await page.goto('/patients');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: /pacientes/i })).toBeVisible({
      timeout: 5_000,
    });
    await expect(page.getByRole('button', { name: /novo paciente/i })).toBeVisible({
      timeout: 5_000,
    });
  });

  test('E2E-PM-02: Search input is present and functional', async ({ page }) => {
    await page.goto('/patients');
    await page.waitForLoadState('networkidle');

    const searchInput = page.getByPlaceholder(/buscar por nome/i);
    await expect(searchInput).toBeVisible();

    await searchInput.fill('Busca teste');
    await expect(searchInput).toHaveValue('Busca teste');
  });

  test('E2E-PM-03: Filter button exists', async ({ page }) => {
    await page.goto('/patients');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('button', { name: /filtrar/i })).toBeVisible({ timeout: 5_000 });
  });

  test('E2E-PM-18: Filtro por status mostra apenas pacientes do status escolhido', async ({
    page,
  }) => {
    const uniqueName = `Paciente Status UI ${Date.now()}`;

    await page.goto('/patients');
    await page.getByRole('button', { name: /novo paciente/i }).click();
    await page.getByTestId('newpatient-name').fill(uniqueName);
    await page.getByTestId('newpatient-objective').selectOption({ label: 'Saúde geral' });
    await page.getByTestId('newpatient-terms').check();

    const createResponse = page.waitForResponse(
      (resp) => resp.url().includes('/api/v1/patients') && resp.request().method() === 'POST',
      { timeout: 15_000 },
    );
    await page.getByTestId('newpatient-submit').click();
    const createdResponse = await createResponse;
    expect(createdResponse.status()).toBe(201);
    const createdBody = await createdResponse.json();
    const patientId = createdBody.data.id as string;

    await page.goto(`/patient/${patientId}`);
    await page.getByTestId('patient-tab-biometry').click();
    await page.getByTestId('btn-new-biometry').click();
    await page.getByLabel(/Peso \(kg\)/i).fill('70,2');
    await page.locator('input[id*="gordura"], input[id*="body-fat"]').first().fill('21,4');
    await page.getByTestId('btn-save-biometry').click();

    await expect(page.getByText(/Revisar status/i)).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: /Atenção/i }).click();
    await page.getByRole('button', { name: /Confirmar/i }).click();
    await expect(page.getByText(/Revisar status/i)).not.toBeVisible({ timeout: 10_000 });

    await page.goto('/patients');
    await page.getByRole('button', { name: /filtrar/i }).click();
    await page.getByRole('button', { name: /Atenção/i }).click();
    await expect(page.getByRole('table').getByText(uniqueName)).toBeVisible({ timeout: 10_000 });
  });

  test('E2E-PM-19: Paginação avança para próxima página na lista de pacientes', async ({
    page,
  }) => {
    await page.goto('/patients');
    await page.waitForLoadState('networkidle');
    const activeToggle = page.getByRole('button', { name: /ver ativos/i });
    if (await activeToggle.isVisible().catch(() => false)) {
      await activeToggle.click();
    }
    await page.getByRole('button', { name: /filtrar/i }).click();
    await page
      .getByRole('button', { name: /^Todos$/i })
      .first()
      .click();

    for (let i = 0; i < 12; i++) {
      await page.getByRole('button', { name: /novo paciente/i }).click();
      await page.getByTestId('newpatient-name').fill(`Paciente Paginação ${Date.now()}-${i}`);
      await page.getByTestId('newpatient-objective').selectOption({ label: 'Saúde geral' });
      await page.getByTestId('newpatient-terms').check();

      const createResponse = page.waitForResponse(
        (resp) => resp.url().includes('/api/v1/patients') && resp.request().method() === 'POST',
        { timeout: 15_000 },
      );
      await page.getByTestId('newpatient-submit').click();
      expect((await createResponse).status()).toBe(201);
    }

    const nextPageBtn = page.getByRole('button', { name: '2' });
    await expect(nextPageBtn).toBeVisible({ timeout: 10_000 });
    await nextPageBtn.click();

    await expect(page.locator('button', { hasText: '2' })).toHaveCSS(
      'background-color',
      'rgb(11, 12, 10)',
    );
  });
});

test.describe('Patient Management — API Contract & Enum Validation', () => {
  let accessToken: string;
  const createdPatientIds: string[] = [];

  test.beforeEach(async ({ request }) => {
    const email = uniqueEmail();
    const result = await signupViaApi(request, email);
    accessToken = result.accessToken;
  });

  test.afterEach(async ({ request }) => {
    // Cleanup: deleta todos os pacientes criados neste describe
    for (const id of createdPatientIds) {
      await request
        .delete(`${API_BASE}/patients/${id}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        .catch(() => {});
    }
    createdPatientIds.length = 0;
  });

  test('E2E-PM-04: Create patient with enum key objective succeeds', async ({ request }) => {
    const response = await request.post(`${API_BASE}/patients`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: createPatientPayload({ name: 'Paciente E2E', objective: 'EMAGRECIMENTO' }),
    });
    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('id');
    createdPatientIds.push(body.data.id);
    expect(body.data.name).toBe('Paciente E2E');
    expect(body.data.objective).toBe('EMAGRECIMENTO');
    expect(body.data.status).toBe('ONTRACK');
    expect(body.data.active).toBe(true);
  });

  test('E2E-PM-05: Create patient with pt-BR label "Hipertrofia" returns 400', async ({
    request,
  }) => {
    const response = await request.post(`${API_BASE}/patients`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: createPatientPayload({ name: 'Paciente Label', objective: 'Hipertrofia' }),
    });
    expect(response.status()).toBe(400);
  });

  test('E2E-PM-06: Create patient with invalid objective "Ganho muscular" returns 400', async ({
    request,
  }) => {
    const response = await request.post(`${API_BASE}/patients`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: createPatientPayload({ name: 'Paciente Invalid', objective: 'Ganho muscular' }),
    });
    expect(response.status()).toBe(400);
  });

  test('E2E-PM-07: Create patient without name returns 400', async ({ request }) => {
    const response = await request.post(`${API_BASE}/patients`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: createPatientPayload({ name: undefined, objective: 'EMAGRECIMENTO' }),
    });
    expect(response.status()).toBe(400);
  });

  test('E2E-PM-08: List patients returns correct paginated contract', async ({ request }) => {
    const createResp = await request.post(`${API_BASE}/patients`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: createPatientPayload({ name: 'Paciente List', objective: 'HIPERTROFIA' }),
    });
    const created = await createResp.json();
    createdPatientIds.push(created.data.id);

    const response = await request.get(`${API_BASE}/patients`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('content');
    expect(Array.isArray(body.data.content)).toBe(true);
    expect(body.data).toHaveProperty('page');
    expect(body.data).toHaveProperty('totalElements');
  });

  test('E2E-PM-09: Update patient objective with enum key succeeds', async ({ request }) => {
    const createResp = await request.post(`${API_BASE}/patients`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: createPatientPayload({ name: 'Paciente Update', objective: 'SAUDE_GERAL' }),
    });
    const created = await createResp.json();
    const patientId = created.data.id;
    createdPatientIds.push(patientId);

    const updateResp = await request.patch(`${API_BASE}/patients/${patientId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { objective: 'HIPERTROFIA' },
    });
    expect(updateResp.status()).toBe(200);
    const updated = await updateResp.json();
    expect(updated.data.objective).toBe('HIPERTROFIA');
  });

  test('E2E-PM-10: Update patient objective with pt-BR label returns 400', async ({ request }) => {
    const createResp = await request.post(`${API_BASE}/patients`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: createPatientPayload({ name: 'Paciente Label Update', objective: 'SAUDE_GERAL' }),
    });
    const created = await createResp.json();
    const patientId = created.data.id;
    createdPatientIds.push(patientId);

    const updateResp = await request.patch(`${API_BASE}/patients/${patientId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { objective: 'Saúde geral' },
    });
    expect(updateResp.status()).toBe(400);
  });

  test('E2E-PM-11: Update patient status with enum key succeeds', async ({ request }) => {
    const createResp = await request.post(`${API_BASE}/patients`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: createPatientPayload({ name: 'Paciente Status', objective: 'SAUDE_GERAL' }),
    });
    const created = await createResp.json();
    const patientId = created.data.id;
    createdPatientIds.push(patientId);

    const updateResp = await request.patch(`${API_BASE}/patients/${patientId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { status: 'WARNING' },
    });
    expect(updateResp.status()).toBe(200);
    const updated = await updateResp.json();
    expect(updated.data.status).toBe('WARNING');
  });

  test('E2E-PM-12: Update patient status with lowercase returns 400', async ({ request }) => {
    const createResp = await request.post(`${API_BASE}/patients`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: createPatientPayload({ name: 'Paciente Status Lowercase', objective: 'SAUDE_GERAL' }),
    });
    const created = await createResp.json();
    const patientId = created.data.id;
    createdPatientIds.push(patientId);

    const updateResp = await request.patch(`${API_BASE}/patients/${patientId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { status: 'warning' },
    });
    expect(updateResp.status()).toBe(400);
  });

  test('E2E-PM-13: Deactivate and reactivate patient', async ({ request }) => {
    const createResp = await request.post(`${API_BASE}/patients`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: createPatientPayload({ name: 'Paciente Toggle', objective: 'REEDUCACAO_ALIMENTAR' }),
    });
    const created = await createResp.json();
    const patientId = created.data.id;
    createdPatientIds.push(patientId);

    const deactivateResp = await request.patch(`${API_BASE}/patients/${patientId}/deactivate`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(deactivateResp.status()).toBe(200);
    expect((await deactivateResp.json()).data.active).toBe(false);

    const reactivateResp = await request.patch(`${API_BASE}/patients/${patientId}/reactivate`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(reactivateResp.status()).toBe(200);
    expect((await reactivateResp.json()).data.active).toBe(true);
  });

  test('E2E-PM-14: Cross-nutritionist isolation returns 403/404', async ({ request }) => {
    const otherResult = await signupViaApi(request, uniqueEmail());
    const createResp = await request.post(`${API_BASE}/patients`, {
      headers: { Authorization: `Bearer ${otherResult.accessToken}` },
      data: createPatientPayload({ name: 'Paciente Outro', objective: 'EMAGRECIMENTO' }),
    });
    const patientId = (await createResp.json()).data.id;

    const accessResp = await request.get(`${API_BASE}/patients/${patientId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect([403, 404]).toContain(accessResp.status());
  });

  test('E2E-PM-15: Unauthenticated access returns 401', async ({ request }) => {
    const response = await request.get(`${API_BASE}/patients`);
    expect(response.status()).toBe(401);
  });
});
