import { test, expect } from '@playwright/test';
import { uniqueEmail, signupViaApi, completeOnboardingViaApi, API_BASE } from './helpers';

test.describe('Food Catalog — Page Rendering', () => {
  test('E2E-FC-01: Foods page renders heading without errors', async ({ page }) => {
    await page.goto('/foods');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1, .serif')).toContainText(/alimentos/i);
  });

  test('E2E-FC-02: Search input is visible', async ({ page }) => {
    await page.goto('/foods');
    await page.waitForLoadState('networkidle');
    const searchInput = page.locator('.page .search input');
    await expect(searchInput).toBeVisible({ timeout: 5_000 });
  });

  test('E2E-FC-03: Category filter shows options', async ({ page }) => {
    await page.goto('/foods');
    await page.waitForLoadState('networkidle');
    const select = page.locator('select').first();
    await expect(select).toBeVisible({ timeout: 5_000 });
    const options = select.locator('option');
    const count = await options.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('E2E-FC-04: Empty state shows message', async ({ page }) => {
    await page.goto('/foods');
    await page.waitForLoadState('networkidle');
    const searchInput = page.locator('.page .search input');
    await expect(searchInput).toBeVisible({ timeout: 5_000 });
    await searchInput.fill('zzznotfound123xyz');
    await expect(page.getByText(/nenhum alimento encontrado/i)).toBeVisible({ timeout: 5_000 });
  });
});

test.describe('Food Catalog — API Contract & Enum Validation', () => {
  let accessToken: string;

  test.beforeEach(async ({ request }) => {
    const email = uniqueEmail();
    const result = await signupViaApi(request, email);
    accessToken = result.accessToken;
  });

  test('E2E-FC-05: Create food with unit GRAMAS succeeds', async ({ request }) => {
    const response = await request.post(`${API_BASE}/foods`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        name: 'Arroz integral E2E',
        category: 'CARBOIDRATO',
        unit: 'GRAMAS',
        referenceAmount: 100,
        kcal: 357,
        prot: 7,
        carb: 74,
        fat: 1.5,
        fiber: 4,
      },
    });
    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('id');
    expect(body.data.name).toBe('Arroz integral E2E');
    expect(body.data.category).toBe('CARBOIDRATO');
    expect(body.data.unit).toBe('GRAMAS');
    expect(body.data.referenceAmount).toBe(100);
    expect(body.data).toHaveProperty('usedCount');
  });

  test('E2E-FC-06: Create food with unit UNIDADE succeeds', async ({ request }) => {
    const response = await request.post(`${API_BASE}/foods`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        name: 'Ovo cozido E2E',
        category: 'PROTEINA',
        unit: 'UNIDADE',
        referenceAmount: 1,
        kcal: 78,
        prot: 6,
        carb: 0.6,
        fat: 5,
        portionLabel: '1 unidade · 50g',
      },
    });
    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.data.unit).toBe('UNIDADE');
    expect(body.data.category).toBe('PROTEINA');
    expect(body.data).toHaveProperty('portionLabel');
  });

  test('E2E-FC-07: Create food with invalid unit returns 400', async ({ request }) => {
    const response = await request.post(`${API_BASE}/foods`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        name: 'Test invalid unit',
        category: 'PROTEINA',
        unit: 'grama',
        referenceAmount: 100,
        kcal: 100,
        prot: 20,
        carb: 5,
        fat: 2,
      },
    });
    expect(response.status()).toBe(400);
  });

  test('E2E-FC-08: Create food with pt-BR category label "Proteína" returns 400', async ({
    request,
  }) => {
    const response = await request.post(`${API_BASE}/foods`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        name: 'Test pt-BR category',
        category: 'Proteína',
        unit: 'GRAMAS',
        referenceAmount: 100,
        kcal: 100,
        prot: 20,
        carb: 5,
        fat: 2,
      },
    });
    expect(response.status()).toBe(400);
  });

  test('E2E-FC-09: Create food without name returns 400', async ({ request }) => {
    const response = await request.post(`${API_BASE}/foods`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        category: 'PROTEINA',
        unit: 'GRAMAS',
        referenceAmount: 100,
        kcal: 100,
        prot: 20,
        carb: 5,
        fat: 2,
      },
    });
    expect(response.status()).toBe(400);
  });

  test('E2E-FC-10: Create food without required fields returns 400', async ({ request }) => {
    const response = await request.post(`${API_BASE}/foods`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { name: 'Missing fields food', category: 'PROTEINA' },
    });
    expect(response.status()).toBe(400);
  });

  test('E2E-FC-11: List foods returns paginated contract', async ({ request }) => {
    await request.post(`${API_BASE}/foods`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        name: 'Listado E2E',
        category: 'PROTEINA',
        unit: 'GRAMAS',
        referenceAmount: 100,
        kcal: 100,
        prot: 20,
        carb: 5,
        fat: 2,
        fiber: 1,
      },
    });

    const response = await request.get(`${API_BASE}/foods`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('content');
    expect(Array.isArray(body.data.content)).toBe(true);
    expect(body.data).toHaveProperty('totalElements');
    expect(body.data).toHaveProperty('page');
  });

  test('E2E-FC-12: Update food category succeeds', async ({ request }) => {
    const createResp = await request.post(`${API_BASE}/foods`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        name: 'Update E2E',
        category: 'CARBOIDRATO',
        unit: 'GRAMAS',
        referenceAmount: 100,
        kcal: 100,
        prot: 5,
        carb: 20,
        fat: 1,
        fiber: 2,
      },
    });
    const created = await createResp.json();
    const foodId = created.data.id;

    const updateResp = await request.patch(`${API_BASE}/foods/${foodId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { category: 'PROTEINA' },
    });
    expect(updateResp.status()).toBe(200);
    const updated = await updateResp.json();
    expect(updated.data.category).toBe('PROTEINA');
  });

  test('E2E-FC-13: Delete food via API', async ({ request }) => {
    const createResp = await request.post(`${API_BASE}/foods`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        name: 'Deletar E2E',
        category: 'GORDURA',
        unit: 'GRAMAS',
        referenceAmount: 100,
        kcal: 50,
        prot: 1,
        carb: 2,
        fat: 4,
        fiber: 0,
      },
    });
    const created = await createResp.json();
    const foodId = created.data.id;

    const deleteResp = await request.delete(`${API_BASE}/foods/${foodId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(deleteResp.status()).toBe(204);

    const getResp = await request.get(`${API_BASE}/foods/${foodId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(getResp.status()).toBe(404);
  });

  test('E2E-FC-14: Unauthenticated access returns 401', async ({ request }) => {
    const response = await request.get(`${API_BASE}/foods`);
    expect(response.status()).toBe(401);
  });

  test('E2E-FC-15: Get single food returns correct contract', async ({ request }) => {
    const createResp = await request.post(`${API_BASE}/foods`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        name: 'Single E2E',
        category: 'PROTEINA',
        unit: 'GRAMAS',
        referenceAmount: 100,
        kcal: 200,
        prot: 30,
        carb: 5,
        fat: 8,
      },
    });
    const created = await createResp.json();
    const foodId = created.data.id;

    const getResp = await request.get(`${API_BASE}/foods/${foodId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(getResp.status()).toBe(200);
    const body = await getResp.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBe(foodId);
    expect(body.data.name).toBe('Single E2E');
    expect(body.data).toHaveProperty('kcal');
    expect(body.data).toHaveProperty('prot');
    expect(body.data).toHaveProperty('carb');
    expect(body.data).toHaveProperty('fat');
  });
});

test.describe('Food Catalog — UI→API Integration', () => {
  let accessToken: string;

  test.beforeEach(async ({ page, request }) => {
    const email = uniqueEmail();
    const password = 'SenhaSegura123!';
    const result = await signupViaApi(request, email, password);
    accessToken = result.accessToken;
    await completeOnboardingViaApi(request, accessToken);

    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.getByTestId('login-email').fill(email);
    await page.getByTestId('login-password').fill(password);
    await page.getByRole('button', { name: /Entrar/i }).click();
    await expect(page).toHaveURL(/\/home/, { timeout: 10_000 });

    await page.goto('/foods');
    await page.waitForLoadState('networkidle');
  });

  test('E2E-FC-16: Create food via UI sends correct enum keys to API', async ({
    page,
    request,
  }) => {
    await page.getByRole('button', { name: /novo alimento/i }).click();
    const modal = page.locator('[role="dialog"], .modal');
    await expect(modal).toBeVisible({ timeout: 3_000 });

    const nameInput = page.locator('input[placeholder*="Frango"]');
    await nameInput.fill('Whey Protein E2E');

    const selects = page.locator('select');
    const categorySelect = selects.first();
    await categorySelect.selectOption({ label: 'Proteína' });

    const refInput = page.locator('#create-food-ref');
    await refInput.fill('100');

    const saveBtn = page.getByRole('button', { name: /salvar/i });
    await saveBtn.click();
    await expect(modal).not.toBeVisible({ timeout: 5_000 });

    const response = await request.get(`${API_BASE}/foods`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { search: 'Whey Protein E2E' },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    const found = body.data?.content?.find((p: { name: string }) => p.name === 'Whey Protein E2E');
    expect(found).toBeDefined();
    expect(found.category).toBe('PROTEINA');
  });
});
