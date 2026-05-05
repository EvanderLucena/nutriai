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

    // O modal de biometria pode não ter role=dialog no card interno
    // Preenche peso e % gordura (os inputs têm id derivado do label)
    await page.locator('input[id*="peso"], input[id*="weight"]').first().fill('75,5');
    await page.locator('input[id*="gordura"], input[id*="body-fat"]').first().fill('22,8');
    await page.getByTestId('btn-save-biometry').click();

    // Aguarda o botão sumir (modal fechado)
    await expect(page.getByTestId('btn-save-biometry')).not.toBeVisible({ timeout: 15_000 });

    // Verifica via API que a biometria foi criada
    const resp = await request.get(`${API_BASE}/patients/${patientId}/biometry`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body.data.length).toBeGreaterThan(0);
  });

  test('E2E-J-10: Biometria registrada reflete em Histórico do paciente', async ({
    authenticatedPage,
    request,
  }) => {
    const { page, accessToken } = authenticatedPage;

    const createResp = await request.post(`${API_BASE}/patients`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: createPatientPayload({ name: 'Paciente Histórico Biometria UI' }),
    });
    const patientId = (await createResp.json()).data.id;

    await page.goto(`/patient/${patientId}`);
    await page.getByTestId('patient-tab-biometry').click();
    await page.getByTestId('btn-new-biometry').click();
    await page.locator('input[id*="peso"], input[id*="weight"]').first().fill('68,4');
    await page.locator('input[id*="gordura"], input[id*="body-fat"]').first().fill('24,1');
    await page.getByTestId('btn-save-biometry').click();
    await expect(page.getByTestId('btn-save-biometry')).not.toBeVisible({ timeout: 15_000 });
    await page.getByRole('button', { name: /Pular/i }).click();

    await page.getByTestId('patient-tab-history').click();
    await expect(page.getByText(/Nenhum episódio fechado encontrado/i)).toBeVisible({
      timeout: 10_000,
    });
  });
});
