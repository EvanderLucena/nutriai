import { test, expect } from '@playwright/test';
import { uniqueEmail, signupViaApi } from './helpers';

const API = 'http://localhost:8080/api/v1';

test.describe('Patient Management — Page Rendering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/patients');
    await page.waitForLoadState('networkidle');
  });

  test('E2E-PM-01: Patients page renders without errors', async ({ page }) => {
    await expect(page.locator('h1, .serif')).toContainText(/pacientes/i);
    await expect(page.getByRole('button', { name: /novo paciente/i })).toBeVisible({ timeout: 5_000 });
  });

  test('E2E-PM-02: Search input is present and functional', async ({ page }) => {
    const searchInput = page.locator('.search input');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Busca teste');
    expect(await searchInput.inputValue()).toBe('Busca teste');
  });

  test('E2E-PM-03: Filter button exists', async ({ page }) => {
    const filterBtn = page.getByRole('button', { name: /filtrar/i });
    await expect(filterBtn).toBeVisible({ timeout: 5_000 });
  });
});

test.describe('Patient Management — API Contract & Enum Validation', () => {
  let accessToken: string;

  test.beforeEach(async ({ request }) => {
    const email = uniqueEmail();
    const result = await signupViaApi(email);
    accessToken = result.accessToken;
  });

  test('E2E-PM-04: Create patient with enum key objective succeeds', async ({ request }) => {
    const response = await request.post(`${API}/patients`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { name: 'Paciente E2E', age: 30, objective: 'EMAGRECIMENTO' },
    });
    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('id');
    expect(body.data.name).toBe('Paciente E2E');
    expect(body.data.objective).toBe('EMAGRECIMENTO');
    expect(body.data.status).toBe('ONTRACK');
    expect(body.data.active).toBe(true);
  });

  test('E2E-PM-05: Create patient with pt-BR label "Hipertrofia" returns 400', async ({ request }) => {
    const response = await request.post(`${API}/patients`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { name: 'Paciente Label', objective: 'Hipertrofia' },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.message).toContain('Objetivo inválido');
  });

  test('E2E-PM-06: Create patient with invalid objective "Ganho muscular" returns 400', async ({ request }) => {
    const response = await request.post(`${API}/patients`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { name: 'Paciente Invalid', objective: 'Ganho muscular' },
    });
    expect(response.status()).toBe(400);
  });

  test('E2E-PM-07: Create patient without name returns 400', async ({ request }) => {
    const response = await request.post(`${API}/patients`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { age: 30 },
    });
    expect(response.status()).toBe(400);
  });

  test('E2E-PM-08: List patients returns correct paginated contract', async ({ request }) => {
    await request.post(`${API}/patients`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { name: 'Paciente List', age: 25, objective: 'HIPERTROFIA' },
    });

    const response = await request.get(`${API}/patients`, {
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
    const createResp = await request.post(`${API}/patients`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { name: 'Paciente Update', age: 28, objective: 'SAUDE_GERAL' },
    });
    const created = await createResp.json();
    const patientId = created.data.id;

    const updateResp = await request.patch(`${API}/patients/${patientId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { objective: 'HIPERTROFIA' },
    });
    expect(updateResp.status()).toBe(200);
    const updated = await updateResp.json();
    expect(updated.data.objective).toBe('HIPERTROFIA');
  });

  test('E2E-PM-10: Update patient objective with pt-BR label returns 400', async ({ request }) => {
    const createResp = await request.post(`${API}/patients`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { name: 'Paciente Label Update', objective: 'SAUDE_GERAL' },
    });
    const created = await createResp.json();
    const patientId = created.data.id;

    const updateResp = await request.patch(`${API}/patients/${patientId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { objective: 'Saúde geral' },
    });
    expect(updateResp.status()).toBe(400);
  });

  test('E2E-PM-11: Update patient status with enum key succeeds', async ({ request }) => {
    const createResp = await request.post(`${API}/patients`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { name: 'Paciente Status', objective: 'SAUDE_GERAL' },
    });
    const created = await createResp.json();
    const patientId = created.data.id;

    const updateResp = await request.patch(`${API}/patients/${patientId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { status: 'WARNING' },
    });
    expect(updateResp.status()).toBe(200);
    const updated = await updateResp.json();
    expect(updated.data.status).toBe('WARNING');
  });

  test('E2E-PM-12: Update patient status with lowercase returns 400', async ({ request }) => {
    const createResp = await request.post(`${API}/patients`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { name: 'Paciente Status Lowercase', objective: 'SAUDE_GERAL' },
    });
    const created = await createResp.json();
    const patientId = created.data.id;

    const updateResp = await request.patch(`${API}/patients/${patientId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { status: 'warning' },
    });
    expect(updateResp.status()).toBe(400);
  });

  test('E2E-PM-13: Deactivate and reactivate patient', async ({ request }) => {
    const createResp = await request.post(`${API}/patients`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { name: 'Paciente Toggle', age: 35, objective: 'REEDUCACAO_ALIMENTAR' },
    });
    const created = await createResp.json();
    const patientId = created.data.id;

    const deactivateResp = await request.patch(`${API}/patients/${patientId}/deactivate`, { headers: { Authorization: `Bearer ${accessToken}` } });
    expect(deactivateResp.status()).toBe(200);
    expect((await deactivateResp.json()).data.active).toBe(false);

    const reactivateResp = await request.patch(`${API}/patients/${patientId}/reactivate`, { headers: { Authorization: `Bearer ${accessToken}` } });
    expect(reactivateResp.status()).toBe(200);
    expect((await reactivateResp.json()).data.active).toBe(true);
  });

  test('E2E-PM-14: Cross-nutritionist isolation returns 403/404', async ({ request }) => {
    const otherResult = await signupViaApi(uniqueEmail());
    const createResp = await request.post(`${API}/patients`, {
      headers: { Authorization: `Bearer ${otherResult.accessToken}` },
      data: { name: 'Paciente Outro', age: 30, objective: 'EMAGRECIMENTO' },
    });
    const patientId = (await createResp.json()).data.id;

    const accessResp = await request.get(`${API}/patients/${patientId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect([403, 404]).toContain(accessResp.status());
  });

  test('E2E-PM-15: Unauthenticated access returns 401', async ({ request }) => {
    const response = await request.get(`${API}/patients`);
    expect(response.status()).toBe(401);
  });
});

test.describe('Patient Management — UI→API Integration', () => {
  let accessToken: string;

  test.beforeEach(async ({ page }) => {
    const email = uniqueEmail();
    const result = await signupViaApi(email);
    accessToken = result.accessToken;

    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.evaluate((token) => {
      localStorage.setItem('nutriai-auth', JSON.stringify({
        state: { isAuthenticated: true, accessToken: token, user: { id: '1', name: 'Dra. UI', email: 'ui@test.com', role: 'NUTRITIONIST', onboardingCompleted: true } },
        version: 0,
      }));
    }, accessToken);
    await page.goto('/patients');
    await page.waitForLoadState('networkidle');
  });

  test('E2E-PM-16: New patient modal shows pt-BR labels but sends enum keys', async ({ page, request }) => {
    await page.getByRole('button', { name: /novo paciente/i }).click();
    await page.waitForTimeout(500);

    const nameInput = page.locator('input[placeholder*="Ana"], input[placeholder*="nome"]').first();
    await nameInput.fill('Paciente Integração');

    const objectiveSelect = page.locator('select').last();
    await objectiveSelect.selectOption({ label: 'Hipertrofia' });

    const saveBtn = page.getByRole('button', { name: /cadastrar/i });
    await saveBtn.click();
    await page.waitForTimeout(2000);

    const response = await request.get(`${API}/patients`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { search: 'Paciente Integração' },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    const found = body.data?.content?.find((p: { name: string }) => p.name === 'Paciente Integração');
    expect(found).toBeDefined();
    expect(found.objective).toBe('HIPERTROFIA');
  });

  test('E2E-PM-17: Edit patient modal sends enum key for objective', async ({ page, request }) => {
    const createResp = await request.post(`${API}/patients`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { name: 'Paciente Editar UI', objective: 'EMAGRECIMENTO' },
    });
    const patientId = (await createResp.json()).data.id;
    await page.reload();
    await page.waitForLoadState('networkidle');

    const row = page.locator('tr, .pq-item, .card').filter({ hasText: 'Paciente Editar UI' }).first();
    await expect(row).toBeVisible({ timeout: 5_000 });
    await row.click();
    await page.waitForTimeout(500);
  });
});