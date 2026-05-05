import { test, expect } from './fixtures';
import { API_BASE, createPatientPayload } from './helpers';

test.describe('Jornada — Food Catalog', () => {
  test('E2E-J-05: Criar alimento via UI + verificar enum mapeamento', async ({
    authenticatedPage,
    request,
  }) => {
    const { page, accessToken } = authenticatedPage;

    await page.goto('/foods');
    await expect(page.getByTestId('newfood-btn')).toBeVisible({ timeout: 10_000 });

    await page.getByTestId('newfood-btn').click();
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible({ timeout: 3_000 });

    await page.getByTestId('newfood-name').fill('Arroz Integral Jornada');
    await page.getByTestId('newfood-category').selectOption({ label: 'Carboidrato' });
    await page.getByTestId('newfood-ref').fill('100');

    await page.getByTestId('newfood-submit').click();
    await page.waitForResponse((r) => r.url().includes('/api/v1/foods') && r.status() === 201, {
      timeout: 15_000,
    });
    await expect(modal).not.toBeVisible({ timeout: 5_000 });

    // Verifica via API
    const resp = await request.get(`${API_BASE}/foods`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { search: 'Arroz Integral Jornada' },
    });
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    const food = body.data?.content?.find(
      (f: { name: string }) => f.name === 'Arroz Integral Jornada',
    );
    expect(food).toBeDefined();
    expect(food.category).toBe('CARBOIDRATO');
  });

  test('E2E-J-06: Editar alimento via UI persiste alterações', async ({
    authenticatedPage,
    request,
  }) => {
    const { page, accessToken } = authenticatedPage;

    const createResp = await request.post(`${API_BASE}/foods`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        name: 'Frango Editar UI',
        category: 'PROTEINA',
        unit: 'GRAMAS',
        referenceAmount: 100,
        kcal: 165,
        prot: 31,
        carb: 0,
        fat: 3.6,
      },
    });
    expect(createResp.status()).toBe(201);
    const foodId = (await createResp.json()).data.id as string;

    await page.goto('/foods');
    await page.getByPlaceholder(/Buscar no catálogo/i).fill('Frango Editar UI');
    await page
      .getByRole('button', { name: /^Editar$/i })
      .first()
      .click();

    await expect(page.getByText(/Editar alimento/i)).toBeVisible({ timeout: 10_000 });
    await page.locator('#edit-catalog-name').fill('Frango Editar UI Atualizado');
    await page.locator('#edit-catalog-ref').fill('150');
    const saveResp = page.waitForResponse(
      (resp) =>
        resp.url().includes(`/api/v1/foods/${foodId}`) &&
        resp.request().method() === 'PATCH' &&
        resp.status() === 200,
      { timeout: 15_000 },
    );
    await page.getByRole('button', { name: /^Salvar$/i }).click();
    await saveResp;

    const getResp = await request.get(`${API_BASE}/foods/${foodId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(getResp.status()).toBe(200);
    const body = await getResp.json();
    expect(body.data.name).toBe('Frango Editar UI Atualizado');
    expect(body.data.referenceAmount).toBe(150);
  });

  test('E2E-J-11: Foods renderiza em viewport mobile', async ({ authenticatedPage }) => {
    const { page } = authenticatedPage;

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/foods');

    await expect(page.getByRole('heading', { name: /Alimentos/i })).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByTestId('newfood-btn')).toBeVisible({ timeout: 10_000 });
    await page.getByTestId('newfood-btn').click();
    await expect(page.locator('#create-food-title')).toBeVisible({
      timeout: 10_000,
    });
  });

  test('E2E-J-14: Insights mostra estado vazio sem pacientes e estado com dados após criação', async ({
    authenticatedPage,
    request,
  }) => {
    const { page, accessToken } = authenticatedPage;

    await page.goto('/insights');
    await expect(page.getByText(/Sem dados para insights/i)).toBeVisible({ timeout: 10_000 });

    const createResp = await request.post(`${API_BASE}/patients`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: createPatientPayload({ name: 'Paciente Insights Jornada', objective: 'SAUDE_GERAL' }),
    });
    expect(createResp.status()).toBe(201);

    await page.goto('/insights');
    await expect(page.getByText(/Panorama da sua carteira/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/Pacientes na carteira/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/^1$/).first()).toBeVisible({ timeout: 10_000 });
  });

  test('E2E-J-15: Fluxo mobile crítico de navegação (home → pacientes → foods)', async ({
    authenticatedPage,
  }) => {
    const { page } = authenticatedPage;

    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto('/home');
    await expect(page.getByText(/Pacientes ativos/i)).toBeVisible({ timeout: 10_000 });

    await page.goto('/patients');
    await expect(page.getByRole('heading', { name: /Pacientes/i })).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByRole('button', { name: /Novo paciente/i })).toBeVisible({
      timeout: 10_000,
    });

    await page.goto('/foods');
    await expect(page.getByRole('heading', { name: /Alimentos/i })).toBeVisible({
      timeout: 10_000,
    });
  });
});
