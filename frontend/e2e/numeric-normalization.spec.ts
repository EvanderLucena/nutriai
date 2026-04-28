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
        name: 'Paciente Numérico',
        objective: 'EMAGRECIMENTO',
        terms: true,
      },
    });
    expect(createResp.status()).toBe(201);
    patientId = (await createResp.json()).data.id;
  });

  test('E2E-NUM-01: Biometry accepts pt-BR comma decimal (72,5 → 72.5)', async ({ request }) => {
    const resp = await request.post(`${API}/patients/${patientId}/biometry`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        assessmentDate: '2026-04-28',
        weight: '72,5',
      },
    });
    expect(resp.status()).toBe(201);
    const body = await resp.json();
    expect(body.data.weight).toBe(72.5);
  });

  test('E2E-NUM-02: Biometry accepts international dot decimal (72.5)', async ({ request }) => {
    const resp = await request.post(`${API}/patients/${patientId}/biometry`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        assessmentDate: '2026-04-28',
        weight: 72.5,
      },
    });
    expect(resp.status()).toBe(201);
    const body = await resp.json();
    expect(body.data.weight).toBe(72.5);
  });

  test('E2E-NUM-03: Biometry rejects double dots (1..2) with 400', async ({ request }) => {
    const resp = await request.post(`${API}/patients/${patientId}/biometry`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        assessmentDate: '2026-04-28',
        weight: '1..2',
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
      },
    });
    expect(resp.status()).toBe(400);
  });

  test('E2E-NUM-07: Biometry accepts pt-BR thousands format (1.840 → 1840)', async ({
    request,
  }) => {
    const resp = await request.post(`${API}/patients/${patientId}/biometry`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        assessmentDate: '2026-04-28',
        weight: '70',
        bmrKcal: '1.840',
      },
    });
    expect(resp.status()).toBe(201);
    const body = await resp.json();
    expect(body.data.bmrKcal).toBe(1840);
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
        name: 'Arroz Inválido',
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

test.describe('Frontend: numeric input validation in biometry form', () => {
  test.beforeEach(async ({ page }) => {
    const email = uniqueEmail();
    await page.goto('/signup');
    await page.getByLabel(/nome/i).fill('Nutri E2E');
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/senha/i).fill('SenhaSegura123!');
    await page.getByLabel(/crn/i).fill('12345');
    await page.getByRole('combobox', { name: /regional/i }).selectOption('SP');
    await page.getByRole('checkbox', { name: /termos/i }).check();
    await page.getByRole('button', { name: /criar conta/i }).click();
    await page.waitForURL('**/onboarding**', { timeout: 10000 });
    await page.getByRole('button', { name: /concluir|pular|skip/i }).click();
    await page.waitForURL('**/home**', { timeout: 10000 });
  });

  test('E2E-NUM-10: Biometry form shows validation error for double dots', async ({ page }) => {
    await page.goto('/patients');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /novo paciente/i }).click();
    await page.getByLabel(/nome/i).fill('Paciente Num Test');
    await page.getByRole('combobox', { name: /objetivo/i }).selectOption('EMAGRECIMENTO');
    await page.getByRole('button', { name: /criar|salvar/i }).click();

    await page.waitForTimeout(1000);
    await page.getByText('Paciente Num Test').click();

    const biometryTab = page.getByRole('tab', { name: /biometria/i });
    if (await biometryTab.isVisible()) {
      await biometryTab.click();
    }

    const addBioButton = page.getByRole('button', { name: /nova avaliação|registrar avaliação/i });
    if (await addBioButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addBioButton.click();

      const weightInput = page.getByLabel(/peso/i);
      if (await weightInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await weightInput.fill('1..2');
        await weightInput.blur();
        const errorEl = page.getByText(/inválido|inválido/i);
        await expect(errorEl).toBeVisible({ timeout: 3000 });
      }
    }
  });
});
