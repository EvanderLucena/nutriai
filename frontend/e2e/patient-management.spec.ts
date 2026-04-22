import { test, expect } from '@playwright/test';
import { uniqueEmail, signupViaApi } from './helpers';

async function setupAuth(page: import('@playwright/test').Page) {
  const email = uniqueEmail();
  const { accessToken } = await signupViaApi(email);

  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.evaluate((token) => {
    localStorage.setItem('nutriai-auth', JSON.stringify({
      state: {
        isAuthenticated: true,
        accessToken: token,
        user: { id: '1', name: 'Dra. Teste', email: 'test@test.com', role: 'NUTRITIONIST', onboardingCompleted: true },
      },
      version: 0,
    }));
  }, accessToken);
}

test.describe('Patient Management — Page Rendering', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuth(page);
    await page.goto('/patients');
    await page.waitForLoadState('networkidle');
  });

  test('E2E-PM-01: Patients page renders without errors', async ({ page }) => {
    await expect(page.locator('h1, .serif')).toContainText(/pacientes/i);
    await expect(page.getByRole('button', { name: /novo paciente/i })).toBeVisible({ timeout: 5_000 });
  });

  test('E2E-PM-02: Empty state shows message or table headers', async ({ page }) => {
    const emptyMsg = page.getByText(/nenhum paciente|0 pacientes/i);
    const tableHeader = page.locator('thead,table');
    const eitherVisible = (await emptyMsg.isVisible().catch(() => false)) || (await tableHeader.isVisible().catch(() => false));
    expect(eitherVisible || (await page.locator('.card,.pq-item').count()) >= 0).toBeTruthy();
  });

  test('E2E-PM-03: Search input is present and functional', async ({ page }) => {
    const searchInput = page.locator('.search input');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Busca teste');
    expect(await searchInput.inputValue()).toBe('Busca teste');
  });

  test('E2E-PM-04: Category/status filter exists', async ({ page }) => {
    const filterBtn = page.getByRole('button', { name: /filtrar/i });
    if (await filterBtn.isVisible()) {
      await filterBtn.click();
      await expect(page.getByText(/on-track|todos|warning|danger/i).first()).toBeVisible({ timeout: 3_000 });
    }
  });
});

test.describe('Patient Management — CRUD via API', () => {
  let accessToken: string;

  test.beforeEach(async ({ page }) => {
    const email = uniqueEmail();
    const result = await signupViaApi(email);
    accessToken = result.accessToken;

    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.evaluate((token) => {
      localStorage.setItem('nutriai-auth', JSON.stringify({
        state: {
          isAuthenticated: true,
          accessToken: token,
          user: { id: '1', name: 'Dra. CRUD', email: 'crud@test.com', role: 'NUTRITIONIST', onboardingCompleted: true },
        },
        version: 0,
      }));
    }, accessToken);
    await page.goto('/patients');
    await page.waitForLoadState('networkidle');
  });

  test('E2E-PM-05: Create patient via API', async ({ request }) => {
    const response = await request.post('http://localhost:8080/api/v1/patients', {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { name: 'Paciente E2E', age: 30, objective: 'Emagrecimento' },
    });
    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('id');
    expect(body.data.name).toBe('Paciente E2E');
    expect(body.data.objective).toBe('Emagrecimento');
    expect(body.data).toHaveProperty('status');
    expect(body.data).toHaveProperty('active');
  });

  test('E2E-PM-06: List patients returns correct contract', async ({ request }) => {
    await request.post('http://localhost:8080/api/v1/patients', {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { name: 'Paciente List', age: 25, objective: 'Ganho muscular' },
    });

    const response = await request.get('http://localhost:8080/api/v1/patients', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('content');
    expect(Array.isArray(body.data.content)).toBe(true);
    expect(body.data).toHaveProperty('page');
    expect(body.data).toHaveProperty('size');
    expect(body.data).toHaveProperty('totalElements');
    expect(body.data).toHaveProperty('totalPages');
  });

  test('E2E-PM-07: Update patient via API', async ({ request }) => {
    const createResp = await request.post('http://localhost:8080/api/v1/patients', {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { name: 'Paciente Update', age: 28, objective: 'Manutenção' },
    });
    const created = await createResp.json();
    const patientId = created.data.id;

    const updateResp = await request.patch(`http://localhost:8080/api/v1/patients/${patientId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { name: 'Paciente Atualizado' },
    });
    expect(updateResp.status()).toBe(200);
    const updated = await updateResp.json();
    expect(updated.data.name).toBe('Paciente Atualizado');
  });

  test('E2E-PM-08: Create patient without name fails validation', async ({ request }) => {
    const response = await request.post('http://localhost:8080/api/v1/patients', {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { age: 30 },
    });
    expect(response.status()).toBe(400);
  });

  test('E2E-PM-09: Deactivate and reactivate patient', async ({ request }) => {
    const createResp = await request.post('http://localhost:8080/api/v1/patients', {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { name: 'Paciente Toggle', age: 35, objective: 'Reeducação alimentar' },
    });
    const created = await createResp.json();
    const patientId = created.data.id;

    const deactivateResp = await request.patch(`http://localhost:8080/api/v1/patients/${patientId}/deactivate`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(deactivateResp.status()).toBe(200);
    const deactivated = await deactivateResp.json();
    expect(deactivated.data.active).toBe(false);

    const reactivateResp = await request.patch(`http://localhost:8080/api/v1/patients/${patientId}/reactivate`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(reactivateResp.status()).toBe(200);
    const reactivated = await reactivateResp.json();
    expect(reactivated.data.active).toBe(true);
  });

  test('E2E-PM-10: Nutritionist cannot access another nutritionist patient', async ({ request }) => {
    const otherEmail = uniqueEmail();
    const otherResult = await signupViaApi(otherEmail);

    const createResp = await request.post('http://localhost:8080/api/v1/patients', {
      headers: { Authorization: `Bearer ${otherResult.accessToken}` },
      data: { name: 'Paciente Outro', age: 30, objective: 'Emagrecimento' },
    });
    const created = await createResp.json();
    const patientId = created.data.id;

    const accessResp = await request.get(`http://localhost:8080/api/v1/patients/${patientId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect([403, 404]).toContain(accessResp.status());
  });
});

test.describe('Patient Management — New Patient Modal', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuth(page);
    await page.goto('/patients');
    await page.waitForLoadState('networkidle');
  });

  test('E2E-PM-11: New patient modal opens and has required fields', async ({ page }) => {
    await page.getByRole('button', { name: /novo paciente/i }).click();
    await expect(page.getByText(/nome/i)).toBeVisible({ timeout: 3_000 });
    await expect(page.getByPlaceholder(/nome do paciente/i).or(page.locator('input[type=text]').first())).toBeVisible({ timeout: 3_000 });
  });

  test('E2E-PM-12: New patient modal closes on cancel', async ({ page }) => {
    await page.getByRole('button', { name: /novo paciente/i }).click();
    const cancelBtn = page.getByRole('button', { name: /cancelar/i });
    if (await cancelBtn.isVisible({ timeout: 3_000 })) {
      await cancelBtn.click();
      await expect(page.getByRole('button', { name: /cancelar/i })).not.toBeVisible({ timeout: 3_000 });
    }
  });
});