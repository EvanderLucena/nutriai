import { test, expect } from './fixtures';
import { createPatientPayload, API_BASE } from './helpers';

test.describe('Jornada — Biometry', () => {
  test('E2E-J-08: Registrar biometria via UI', async ({ authenticatedPage, request }) => {
    const { page, accessToken } = authenticatedPage;

    // Prepara paciente via API
    const createResp = await request.post(`${API_BASE}/patients`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: createPatientPayload({ name: 'Paciente Biometria Jornada' }),
    });
    const patientId = (await createResp.json()).data.id;

    await page.goto(`/patient/${patientId}`);
    await page.waitForLoadState('networkidle');

    await page.getByTestId('patient-tab-biometry').click();
    await page.waitForLoadState('networkidle');

    await page.getByTestId('btn-new-biometry').click();
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible({ timeout: 3_000 });

    // Preenche peso e % gordura
    await page.locator('#peso-kg').fill('75,5');
    await page.locator('#gordura').fill('22,8');
    await page.getByTestId('btn-save-biometry').click();

    await page.waitForResponse((r) => r.url().includes('/biometry') && r.status() === 201, {
      timeout: 15_000,
    });
    await expect(modal).not.toBeVisible({ timeout: 5_000 });

    // Verifica via API que a biometria foi criada
    const resp = await request.get(`${API_BASE}/patients/${patientId}/biometry`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body.data.content.length).toBeGreaterThan(0);
  });
});
