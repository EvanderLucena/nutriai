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
    await expect(page.getByRole('heading', { name: /opções equivalentes/i })).toBeVisible({
      timeout: 10_000,
    });

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

  test('E2E-J-09: Nova opção + adicionar alimento via UI persistem no plano', async ({
    authenticatedPage,
    request,
  }) => {
    const { page, accessToken } = authenticatedPage;

    const createPatientResp = await request.post(`${API_BASE}/patients`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: createPatientPayload({ name: 'Paciente Plano Opção UI' }),
    });
    const patientId = (await createPatientResp.json()).data.id as string;

    const createFoodResp = await request.post(`${API_BASE}/foods`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        name: 'Alimento Jornada Plano',
        category: 'CARBOIDRATO',
        unit: 'GRAMAS',
        referenceAmount: 100,
        kcal: 120,
        prot: 3,
        carb: 25,
        fat: 1,
      },
    });
    expect(createFoodResp.status()).toBe(201);

    await page.goto(`/patient/${patientId}`);
    await page.getByTestId('patient-tab-plan').click();

    await expect(page.getByRole('heading', { name: /opções equivalentes/i })).toBeVisible({
      timeout: 10_000,
    });
    await page.getByRole('button', { name: /Nova opção/i }).click();
    await expect(page.getByRole('heading', { name: /2 opções equivalentes/i })).toBeVisible({
      timeout: 10_000,
    });

    await page.getByRole('button', { name: /Adicionar Alimento/i }).click();
    const addFoodModal = page.getByText(/Adicionar alimento/i).first();
    await expect(addFoodModal).toBeVisible({ timeout: 10_000 });

    await page.getByPlaceholder(/Buscar no catálogo/i).fill('Alimento Jornada Plano');
    await page.getByText('Alimento Jornada Plano').first().click();
    await page.locator('#add-ref-amount').fill('120');
    await page
      .getByRole('button', { name: /Adicionar/i })
      .last()
      .click();

    await expect(page.getByText('Alimento Jornada Plano')).toBeVisible({ timeout: 10_000 });

    const planResp = await request.get(`${API_BASE}/patients/${patientId}/plan`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(planResp.status()).toBe(200);
    const planBody = await planResp.json();
    const meal = planBody.data.meals[0];
    expect(meal.options.length).toBeGreaterThanOrEqual(2);
    const hasFood = meal.options.some((o: { items: Array<{ foodName: string }> }) =>
      o.items.some((i) => i.foodName === 'Alimento Jornada Plano'),
    );
    expect(hasFood).toBe(true);
  });

  test('E2E-J-12: Remover refeição adicionada via UI persiste no backend', async ({
    authenticatedPage,
    request,
  }) => {
    const { page, accessToken } = authenticatedPage;

    const createPatientResp = await request.post(`${API_BASE}/patients`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: createPatientPayload({ name: 'Paciente Plano Remove Meal' }),
    });
    const patientId = (await createPatientResp.json()).data.id as string;

    await page.goto(`/patient/${patientId}`);
    await page.getByTestId('patient-tab-plan').click();

    await page.getByTestId('add-meal-btn').click();
    await page.getByTestId('addmeal-label').fill('Refeição Remover');
    await page.getByTestId('addmeal-time').fill('23:10');
    await page.getByTestId('btn-add-meal').click();
    await expect(page.getByText('Refeição Remover')).toBeVisible({ timeout: 10_000 });

    const mealButton = page.getByRole('button', { name: /Refeição Remover/i }).first();
    await mealButton.locator('button').first().click();
    const deleteMealResp = page.waitForResponse(
      (resp) =>
        resp.url().includes('/plan/meals/') &&
        resp.request().method() === 'DELETE' &&
        [200, 204].includes(resp.status()),
      { timeout: 15_000 },
    );
    await page.getByRole('button', { name: /Excluir/i }).click();
    await deleteMealResp;

    await expect(page.getByText('Refeição Remover')).not.toBeVisible({ timeout: 10_000 });

    const planResp = await request.get(`${API_BASE}/patients/${patientId}/plan`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(planResp.status()).toBe(200);
    const planBody = await planResp.json();
    const hasRemovedMeal = planBody.data.meals.some(
      (m: { label: string }) => m.label === 'Refeição Remover',
    );
    expect(hasRemovedMeal).toBe(false);
  });

  test('E2E-J-13: Edição inline e remoção de item no plano persistem', async ({
    authenticatedPage,
    request,
  }) => {
    const { page, accessToken } = authenticatedPage;

    const createPatientResp = await request.post(`${API_BASE}/patients`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: createPatientPayload({ name: 'Paciente Plano Inline Item' }),
    });
    const patientId = (await createPatientResp.json()).data.id as string;

    const createFoodResp = await request.post(`${API_BASE}/foods`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        name: 'Alimento Inline Plano',
        category: 'PROTEINA',
        unit: 'GRAMAS',
        referenceAmount: 100,
        kcal: 200,
        prot: 30,
        carb: 5,
        fat: 8,
      },
    });
    expect(createFoodResp.status()).toBe(201);

    await page.goto(`/patient/${patientId}`);
    await page.getByTestId('patient-tab-plan').click();

    await page.getByRole('button', { name: /Adicionar Alimento/i }).click();
    await page.getByPlaceholder(/Buscar no catálogo/i).fill('Alimento Inline Plano');
    await page.getByText('Alimento Inline Plano').first().click();
    await page.locator('#add-ref-amount').fill('100');
    await page
      .getByRole('button', { name: /Adicionar/i })
      .last()
      .click();
    await expect(page.getByText('Alimento Inline Plano')).toBeVisible({ timeout: 10_000 });

    const updateItemResp = page.waitForResponse(
      (resp) => resp.url().includes('/plan/meals/') && resp.request().method() === 'PATCH',
      { timeout: 15_000 },
    );
    await page.getByTestId('plan-food-ref-input').first().fill('130');
    await page.getByTestId('plan-food-prep-input').first().click();
    await updateItemResp;

    const updatePrepResp = page.waitForResponse(
      (resp) => resp.url().includes('/plan/meals/') && resp.request().method() === 'PATCH',
      { timeout: 15_000 },
    );
    await page.getByTestId('plan-food-prep-input').first().fill('Grelhado');
    await page.getByTestId('plan-food-ref-input').first().click();
    await updatePrepResp;

    const deleteItemResp = page.waitForResponse(
      (resp) =>
        resp.url().includes('/plan/meals/') &&
        resp.request().method() === 'DELETE' &&
        [200, 204].includes(resp.status()),
      { timeout: 15_000 },
    );
    await page.getByTestId('plan-food-remove-btn').first().click();
    await page.getByRole('button', { name: /Excluir/i }).click();
    await deleteItemResp;
    await expect(page.getByText('Alimento Inline Plano')).not.toBeVisible({ timeout: 10_000 });

    const planResp = await request.get(`${API_BASE}/patients/${patientId}/plan`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(planResp.status()).toBe(200);
    const planBody = await planResp.json();
    const firstMeal = planBody.data.meals[0];
    const remainingItems = firstMeal.options.flatMap(
      (o: { items: Array<{ foodName: string }> }) => o.items,
    );
    const hasItem = remainingItems.some(
      (i: { foodName: string }) => i.foodName === 'Alimento Inline Plano',
    );
    expect(hasItem).toBe(false);
  });
});
