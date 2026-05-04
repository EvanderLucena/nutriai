import { test, expect } from './fixtures';
import { createPatientPayload, API_BASE } from './helpers';

test.describe('Jornada — Meal Plan', () => {
  test('E2E-J-07: Adicionar refeição ao plano via UI', async ({ authenticatedPage, request }) => {
    const { page, accessToken } = authenticatedPage;

    // Prepara paciente via API
    const createResp = await request.post(`${API_BASE}/patients`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: createPatientPayload({ name: 'Paciente Plano Jornada' }),
    });
    const patientId = (await createResp.json()).data.id;

    await page.goto(`/patient/${patientId}`);
    await page.waitForLoadState('networkidle');

    await page.getByTestId('patient-tab-plan').click();
    await page.waitForTimeout(500);

    // Clica em adicionar refeição
    await page.getByTestId('add-meal-btn').click();

    // Preenche o modal
    await page.getByTestId('addmeal-label').fill('Café Jornada');
    await page.getByTestId('addmeal-time').fill('08:00');
    await page.getByTestId('btn-add-meal').click();

    // Em vez de waitForResponse (pode variar de endpoint), espera o modal sumir e a refeição aparecer
    await expect(page.getByTestId('btn-add-meal')).not.toBeVisible({ timeout: 15_000 });

    // Verifica que a refeição aparece na UI
    await expect(page.getByText('Café Jornada')).toBeVisible({ timeout: 5_000 });
  });
});
