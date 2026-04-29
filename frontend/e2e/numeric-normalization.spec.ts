import { test, expect } from '@playwright/test';
import { uniqueEmail, signupViaApi, completeOnboardingViaApi } from './helpers';

const API = 'http://localhost:8080/api/v1';

test.describe('Backend: pt-BR numeric deserialization', () => {
  let accessToken: string;
  let patientId: string;

  test.beforeEach(async ({ request }) => {
    const email = uniqueEmail();
    const result = await signupViaApi(request, email);
    accessToken = result.accessToken;
    await completeOnboardingViaApi(request, accessToken);

    const createResp = await request.post(`${API}/patients`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        name: 'Paciente Numerico',
        objective: 'EMAGRECIMENTO',
        terms: true,
      },
    });
    expect(createResp.status()).toBe(201);
    patientId = (await createResp.json()).data.id;
  });

  test('E2E-NUM-01: Biometry accepts pt-BR comma decimal (72,5 -> 72.5)', async ({ request }) => {
    const resp = await request.post(`${API}/patients/${patientId}/biometry`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        assessmentDate: '2026-04-28',
        weight: '72,5',
        bodyFatPercent: '25,3',
      },
    });
    expect(resp.status()).toBe(201);
    const body = await resp.json();
    expect(body.data.weight).toBe(72.5);
    expect(body.data.bodyFatPercent).toBe(25.3);
  });

  test('E2E-NUM-02: Biometry accepts international dot decimal (72.5)', async ({ request }) => {
    const resp = await request.post(`${API}/patients/${patientId}/biometry`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        assessmentDate: '2026-04-28',
        weight: 72.5,
        bodyFatPercent: 25.3,
      },
    });
    expect(resp.status()).toBe(201);
    const body = await resp.json();
    expect(body.data.weight).toBe(72.5);
    expect(body.data.bodyFatPercent).toBe(25.3);
  });

  test('E2E-NUM-03: Biometry rejects double dots (1..2) with 400', async ({ request }) => {
    const resp = await request.post(`${API}/patients/${patientId}/biometry`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        assessmentDate: '2026-04-28',
        weight: '1..2',
        bodyFatPercent: 25.3,
      },
    });
    expect(resp.status()).toBe(400);
  });

  test('E2E-NUM-04: Biometry rejects adjacent separators (1,.2) with 400', async ({ request }) => {
    const resp = await request.post(`${API}/patients/${patientId}/biometry`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        assessmentDate: '2026-04-28',
        weight: '1,.2',
        bodyFatPercent: 25.3,
      },
    });
    expect(resp.status()).toBe(400);
  });

  test('E2E-NUM-05: Biometry rejects ambiguous mixed separators (1,2.3) with 400', async ({
    request,
  }) => {
    const resp = await request.post(`${API}/patients/${patientId}/biometry`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        assessmentDate: '2026-04-28',
        weight: '1,2.3',
        bodyFatPercent: 25.3,
      },
    });
    expect(resp.status()).toBe(400);
  });

  test('E2E-NUM-06: Biometry rejects pure text (abc) with 400', async ({ request }) => {
    const resp = await request.post(`${API}/patients/${patientId}/biometry`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        assessmentDate: '2026-04-28',
        weight: 'abc',
        bodyFatPercent: 25.3,
      },
    });
    expect(resp.status()).toBe(400);
  });

  test('E2E-NUM-07: Biometry accepts pt-BR thousands format (1.840 -> 1840)', async ({
    request,
  }) => {
    const resp = await request.post(`${API}/patients/${patientId}/biometry`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        assessmentDate: '2026-04-28',
        weight: '70',
        bodyFatPercent: '25,3',
        bmrKcal: '1.840',
      },
    });
    expect(resp.status()).toBe(201);
    const body = await resp.json();
    expect(body.data.bmrKcal).toBe(1840);
    expect(body.data.bodyFatPercent).toBe(25.3);
  });

  test('E2E-NUM-08: Food creates with pt-BR comma decimal for macros', async ({ request }) => {
    const resp = await request.post(`${API}/foods`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        name: 'Arroz E2E Num',
        category: 'CARBOIDRATO',
        unit: 'GRAMAS',
        referenceAmount: 100,
        kcal: '357,5',
        prot: '7,2',
        carb: '74,1',
        fat: '1,8',
      },
    });
    expect(resp.status()).toBe(201);
    const body = await resp.json();
    expect(body.data.kcal).toBe(357.5);
    expect(body.data.prot).toBe(7.2);
    expect(body.data.carb).toBe(74.1);
    expect(body.data.fat).toBe(1.8);
  });

  test('E2E-NUM-09: Food rejects invalid numeric format (1..2) with 400', async ({ request }) => {
    const resp = await request.post(`${API}/foods`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        name: 'Arroz Invalido',
        category: 'CARBOIDRATO',
        unit: 'GRAMAS',
        referenceAmount: 100,
        kcal: '1..2',
        prot: 7,
        carb: 74,
        fat: 1,
      },
    });
    expect(resp.status()).toBe(400);
  });
});
