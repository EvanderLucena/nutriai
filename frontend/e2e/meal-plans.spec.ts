import { test, expect } from '@playwright/test';
import { createPatientPayload, signupViaApi, uniqueEmail } from './helpers';

const API = 'http://localhost:8080/api/v1';

test.describe('Meal Plans — API Contract', () => {
  let accessToken: string;
  let patientId: string;

  test.beforeEach(async ({ request }) => {
    const email = uniqueEmail();
    const result = await signupViaApi(request, email);
    accessToken = result.accessToken;

    const createResp = await request.post(`${API}/patients`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: createPatientPayload({ name: 'Paciente API Plano', objective: 'HIPERTROFIA' }),
    });
    const created = await createResp.json();
    patientId = created.data.id;
  });

  test('E2E-MP-01: GET plan returns correct contract', async ({ request }) => {
    const response = await request.get(`${API}/patients/${patientId}/plan`, {
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
  });

  test('E2E-MP-02: Auto-created plan has default meals', async ({ request }) => {
    const planResp = await request.get(`${API}/patients/${patientId}/plan`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const plan = await planResp.json();
    expect(plan.data.meals.length).toBeGreaterThanOrEqual(1);
  });

  test('E2E-MP-03: Add meal slot with valid data succeeds', async ({ request }) => {
    const response = await request.post(`${API}/patients/${patientId}/plan/meals`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { label: 'Lanche da tarde extra', time: '15:00' },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('id');
    expect(body.data.label).toBe('Lanche da tarde extra');
    expect(body.data).toHaveProperty('options');
  });

  test('E2E-MP-04: Add meal slot without label returns 400', async ({ request }) => {
    const response = await request.post(`${API}/patients/${patientId}/plan/meals`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { time: '15:00' },
    });
    expect(response.status()).toBe(400);
  });

  test('E2E-MP-05: Add extra with valid data succeeds', async ({ request }) => {
    const response = await request.post(`${API}/patients/${patientId}/plan/extras`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { name: 'Chocolate 70%', quantity: '20g' },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.name).toBe('Chocolate 70%');
    expect(body.data).toHaveProperty('id');
  });

  test('E2E-MP-06: Update plan targets', async ({ request }) => {
    const response = await request.patch(`${API}/patients/${patientId}/plan`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { kcalTarget: 1800, protTarget: 120, carbTarget: 200, fatTarget: 60 },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.data.kcalTarget).toBe(1800);
    expect(body.data.protTarget).toBe(120);
  });

  test('E2E-MP-07: Unauthenticated plan access returns 401', async ({ request }) => {
    const response = await request.get(`${API}/patients/${patientId}/plan`);
    expect(response.status()).toBe(401);
  });

  test('E2E-MP-08: Cross-nutritionist plan access returns 403/404', async ({ request }) => {
    const otherResult = await signupViaApi(request, uniqueEmail());
    const response = await request.get(`${API}/patients/${patientId}/plan`, {
      headers: { Authorization: `Bearer ${otherResult.accessToken}` },
    });
    expect([403, 404]).toContain(response.status());
  });

  test('E2E-MP-09: Add option to existing meal slot', async ({ request }) => {
    const planResp = await request.get(`${API}/patients/${patientId}/plan`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const plan = await planResp.json();
    const mealId = plan.data.meals[0].id;

    const response = await request.post(
      `${API}/patients/${patientId}/plan/meals/${mealId}/options`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        data: { name: 'Opção 2 · Alternativa' },
      },
    );
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.data).toHaveProperty('id');
    expect(body.data.name).toBe('Opção 2 · Alternativa');
  });
});
