import { test, expect } from './fixtures';
import { createPatientPayload, API_BASE } from './helpers';

test.describe('Jornada — Patient', () => {
  test('E2E-J-02: Criar paciente via UI + verificar enum mapeamento', async ({
    authenticatedPage,
    request,
  }) => {
    const { page, accessToken } = authenticatedPage;

    await page.goto('/patients');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /novo paciente/i }).click();
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible({ timeout: 3_000 });

    await page.getByTestId('newpatient-name').fill('Paciente Jornada');
    await page.getByTestId('newpatient-objective').selectOption({ label: 'Hipertrofia' });
    await page.getByTestId('newpatient-terms').check();

    await page.getByTestId('newpatient-submit').click();
    await page.waitForResponse((r) => r.url().includes('/patients') && r.status() === 201, {
      timeout: 15_000,
    });
    await expect(modal).not.toBeVisible({ timeout: 5_000 });

    // Verifica via API que o enum foi convertido corretamente
    const resp = await request.get(`${API_BASE}/patients`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { search: 'Paciente Jornada' },
    });
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    const patient = body.data?.content?.[0];
    expect(patient).toBeDefined();
    expect(patient.objective).toBe('HIPERTROFIA');
  });

  test('E2E-J-03: Editar paciente + verificar enum mapeamento', async ({
    authenticatedPage,
    request,
  }) => {
    const { page, accessToken } = authenticatedPage;

    // Prepara paciente via API
    const createResp = await request.post(`${API_BASE}/patients`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: createPatientPayload({ name: 'Paciente Editar Jornada' }),
    });
    const patientId = (await createResp.json()).data.id;

    await page.goto(`/patient/${patientId}`);
    await page.waitForLoadState('networkidle');

    await page.getByTestId('btn-edit-patient-header').click();
    await expect(page.getByTestId('editpatient-objective')).toBeVisible({ timeout: 3_000 });

    await page.getByTestId('editpatient-objective').selectOption({ label: 'Hipertrofia' });
    await page.getByTestId('editpatient-submit').click();

    await page.waitForResponse(
      (r) => r.url().includes('/patients') && [200, 204].includes(r.status()),
      { timeout: 15_000 },
    );

    const resp = await request.get(`${API_BASE}/patients/${patientId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body.data.objective).toBe('HIPERTROFIA');
  });

  test('E2E-J-04: Excluir paciente via UI', async ({ authenticatedPage, request }) => {
    const { page, accessToken } = authenticatedPage;

    // Prepara paciente via API
    const createResp = await request.post(`${API_BASE}/patients`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: createPatientPayload({ name: 'Paciente Deletar Jornada' }),
    });
    const patientId = (await createResp.json()).data.id;

    await page.goto('/patients');
    await page.waitForLoadState('networkidle');

    const row = page
      .locator('tr, .pq-item, .card')
      .filter({ hasText: 'Paciente Deletar Jornada' })
      .first();
    await expect(row).toBeVisible({ timeout: 5_000 });

    // Clica no botao de menu/trash (adaptar seletor conforme UI)
    const deleteBtn = row
      .locator('button')
      .filter({ has: page.locator('svg') })
      .last();
    if (await deleteBtn.isVisible().catch(() => false)) {
      await deleteBtn.click();
      const confirmBtn = page.getByRole('button', { name: /confirmar|excluir/i });
      if (await confirmBtn.isVisible().catch(() => false)) {
        await confirmBtn.click();
      }
    }

    // Aguarda remover da tabela
    await page.waitForTimeout(1000);
    await expect(page.getByText('Paciente Deletar Jornada').first()).not.toBeVisible({
      timeout: 5_000,
    });
  });
});
