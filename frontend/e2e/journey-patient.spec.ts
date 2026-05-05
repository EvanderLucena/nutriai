import { test, expect } from './fixtures';
import { createPatientPayload, API_BASE } from './helpers';

test.describe('Jornada — Patient', () => {
  test('E2E-J-02: Criar paciente via UI + verificar enum mapeamento', async ({
    authenticatedPage,
    request,
  }) => {
    const { page, accessToken } = authenticatedPage;

    await page.goto('/patients');
    await expect(page.getByRole('button', { name: /novo paciente/i })).toBeVisible({
      timeout: 10_000,
    });

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

  test('E2E-J-03: Editar paciente modal abre e mostra dados do paciente', async ({
    authenticatedPage,
    request,
  }) => {
    const { page, accessToken } = authenticatedPage;

    // Prepara paciente via API com objetivo Hipertrofia
    const createResp = await request.post(`${API_BASE}/patients`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: createPatientPayload({ name: 'Paciente Editar Jornada', objective: 'HIPERTROFIA' }),
    });
    const patientId = (await createResp.json()).data.id;

    await page.goto(`/patient/${patientId}`);
    await expect(page.getByTestId('btn-edit-patient-header')).toBeVisible({ timeout: 10_000 });

    await page.getByTestId('btn-edit-patient-header').click();
    await expect(page.getByTestId('editpatient-objective')).toBeVisible({ timeout: 3_000 });

    // Verifica que o objetivo está selecionado corretamente
    const objectiveValue = await page.getByTestId('editpatient-objective').inputValue();
    expect(objectiveValue).toBe('HIPERTROFIA');
  });

  test('E2E-J-04: Paciente criado via API aparece na lista', async ({
    authenticatedPage,
    request,
  }) => {
    const { page, accessToken } = authenticatedPage;

    // Prepara paciente via API
    const createResp = await request.post(`${API_BASE}/patients`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: createPatientPayload({ name: 'Paciente Deletar Jornada' }),
    });
    const patientId = (await createResp.json()).data.id;

    await page.goto('/patients');
    await expect(page.getByRole('heading', { name: /Pacientes/i })).toBeVisible({
      timeout: 10_000,
    });

    // Verifica que o paciente aparece na grid/lista
    await expect(page.getByText('Paciente Deletar Jornada').first()).toBeVisible({
      timeout: 5_000,
    });

    // Verifica via API que o paciente continua existindo (não foi deletado)
    const resp = await request.get(`${API_BASE}/patients/${patientId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body.data.id).toBe(patientId);
  });
});
