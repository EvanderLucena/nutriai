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
    await page.waitForLoadState('networkidle');

    await page.getByTestId('btn-edit-patient-header').click();
    await expect(page.getByTestId('editpatient-objective')).toBeVisible({ timeout: 3_000 });

    // Verifica que o objetivo está selecionado corretamente
    const objectiveValue = await page.getByTestId('editpatient-objective').inputValue();
    expect(objectiveValue).toBe('HIPERTROFIA');
  });

  test('E2E-J-05: Editar paciente com altura inválida mostra erro e não fecha modal', async ({
    authenticatedPage,
    request,
  }) => {
    const { page, accessToken } = authenticatedPage;

    // Prepara paciente via API
    const createResp = await request.post(`${API_BASE}/patients`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: createPatientPayload({ name: 'Paciente Erro Altura' }),
    });
    const patientId = (await createResp.json()).data.id;

    await page.goto(`/patient/${patientId}`);
    await page.waitForLoadState('networkidle');

    // Abre edit modal
    await page.getByTestId('btn-edit-patient-header').click();
    await expect(page.getByTestId('editpatient-objective')).toBeVisible({ timeout: 3_000 });

    // Limpa altura e coloca 0
    await page.getByTestId('editpatient-height').fill('0');
    await page.getByTestId('editpatient-height').blur();

    // Tenta salvar
    await page.getByTestId('editpatient-submit').click();

    // Modal deve permanecer aberto (validação bloqueou)
    await expect(page.getByTestId('editpatient-objective')).toBeVisible({ timeout: 5_000 });

    // Mensagem de erro deve estar visível
    const heightError = page.locator('text=Altura deve estar entre 50 e 250 cm');
    await expect(heightError).toBeVisible({ timeout: 3_000 });
  });

  test('E2E-J-06: Criar paciente sem nome mantém botão desabilitado', async ({
    authenticatedPage,
  }) => {
    const { page } = authenticatedPage;

    await page.goto('/patients');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /novo paciente/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 3_000 });

    // Deixa nome vazio, seleciona objetivo e marca termos
    await page.getByTestId('newpatient-objective').selectOption({ label: 'Hipertrofia' });
    await page.getByTestId('newpatient-terms').check();

    // Botão deve estar desabilitado (nome é obrigatório)
    const submitBtn = page.getByTestId('newpatient-submit');
    await expect(submitBtn).toBeDisabled();
  });
});
