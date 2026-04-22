import { test, expect } from '@playwright/test';
import { uniqueEmail, signupViaApi } from './helpers';

async function setupAuthWithPatient(page: import('@playwright/test').Page, request: import('@playwright/test').APIRequestContext) {
  const email = uniqueEmail();
  const { accessToken } = await signupViaApi(email);

  const createResp = await request.post('http://localhost:8080/api/v1/patients', {
    headers: { Authorization: `Bearer ${accessToken}` },
    data: { name: 'Paciente Plano E2E', age: 30, objective: 'Emagrecimento' },
  });
  const created = await createResp.json();
  const patientId = created.data.id;

  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.evaluate(([token, pid]) => {
    localStorage.setItem('nutriai-auth', JSON.stringify({
      state: {
        isAuthenticated: true,
        accessToken: token,
        user: { id: '1', name: 'Dra. Plano', email: 'plano@test.com', role: 'NUTRITIONIST', onboardingCompleted: true },
      },
      version: 0,
    }));
  }, [accessToken, patientId]);

  return { accessToken, patientId };
}

test.describe('Meal Plans — Page Rendering', () => {
  test.beforeEach(async ({ page, request }) => {
    await setupAuthWithPatient(page, request);
    await page.goto('/patients');
    await page.waitForLoadState('networkidle');
    const patientItem = page.locator('table tbody tr, .pq-item').first();
    await expect(patientItem).toBeVisible({ timeout: 10_000 });
    await patientItem.click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/patient\//, { timeout: 5_000 });
  });

  test('E2E-MP-01: Patient detail page renders without errors', async ({ page }) => {
    await expect(page.locator('h1, .serif, .title').first()).toBeVisible({ timeout: 5_000 });
  });

  test('E2E-MP-02: Plan tab is accessible', async ({ page }) => {
    const planTab = page.getByRole('button', { name: /plano/i }).or(page.locator('text=/plano alimentar/i').first());
    if (await planTab.first().isVisible({ timeout: 3_000 })) {
      await planTab.first().click();
      await page.waitForTimeout(1000);
      await expect(page.locator('.serif, h1, h2').first()).toBeVisible({ timeout: 5_000 });
    }
  });
});

test.describe('Meal Plans — API Contract', () => {
  let accessToken: string;
  let patientId: string;

  test.beforeEach(async ({ request }) => {
    const email = uniqueEmail();
    const result = await signupViaApi(email);
    accessToken = result.accessToken;

    const createResp = await request.post('http://localhost:8080/api/v1/patients', {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { name: 'Paciente API Plano', age: 28, objective: 'Ganho muscular' },
    });
    const created = await createResp.json();
    patientId = created.data.id;
  });

  test('E2E-MP-03: GET plan returns correct contract', async ({ request }) => {
    const response = await request.get(`http://localhost:8080/api/v1/patients/${patientId}/plan`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('id');
    expect(body.data).toHaveProperty('meals');
    expect(Array.isArray(body.data.meals)).toBe(true);
    expect(body.data).toHaveProperty('extras');
    expect(Array.isArray(body.data.extras)).toBe(true);
    expect(body.data).toHaveProperty('kcalTarget');
    expect(body.data).toHaveProperty('protTarget');
    expect(body.data).toHaveProperty('carbTarget');
    expect(body.data).toHaveProperty('fatTarget');
  });

  test('E2E-MP-04: Add meal slot', async ({ request }) => {
    const response = await request.post(`http://localhost:8080/api/v1/patients/${patientId}/plan/meals`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { label: 'Lanche da tarde', time: '15:00' },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('id');
    expect(body.data.label).toBe('Lanche da tarde');
    expect(body.data).toHaveProperty('options');
  });

  test('E2E-MP-05: Add extra', async ({ request }) => {
    const response = await request.post(`http://localhost:8080/api/v1/patients/${patientId}/plan/extras`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { name: 'Chocolate 70%', quantity: '20g' },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.name).toBe('Chocolate 70%');
    expect(body.data).toHaveProperty('id');
  });

  test('E2E-MP-06: Unauthenticated plan access returns 401', async ({ request }) => {
    const response = await request.get(`http://localhost:8080/api/v1/patients/${patientId}/plan`);
    expect(response.status()).toBe(401);
  });

  test('E2E-MP-07: Access another nutritionist patient plan returns 403/404', async ({ request }) => {
    const otherEmail = uniqueEmail();
    const otherResult = await signupViaApi(otherEmail);

    const response = await request.get(`http://localhost:8080/api/v1/patients/${patientId}/plan`, {
      headers: { Authorization: `Bearer ${otherResult.accessToken}` },
    });
    expect([403, 404]).toContain(response.status);
  });

  test('E2E-MP-08: Update plan targets', async ({ request }) => {
    const response = await request.patch(`http://localhost:8080/api/v1/patients/${patientId}/plan`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { kcalTarget: 1800, protTarget: 120, carbTarget: 200, fatTarget: 60 },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.data.kcalTarget).toBe(1800);
    expect(body.data.protTarget).toBe(120);
  });

  test('E2E-MP-09: Auto-created plan has a default meal', async ({ request }) => {
    const planResp = await request.get(`http://localhost:8080/api/v1/patients/${patientId}/plan`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const plan = await planResp.json();
    expect(plan.data.meals.length).toBeGreaterThanOrEqual(1);
  });
});