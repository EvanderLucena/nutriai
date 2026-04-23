import { test, expect } from '@playwright/test';

const API = 'http://localhost:8080/api/v1';

test.describe('Food Catalog — Page Rendering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/foods');
    await page.waitForLoadState('networkidle');
  });

  test('E2E-FC-01: Foods page renders heading without errors', async ({ page }) => {
    await expect(page.locator('h1, .serif')).toContainText(/alimentos/i);
  });

  test('E2E-FC-02: Search input is visible', async ({ page }) => {
    const searchInput = page.locator('.search input');
    await expect(searchInput).toBeVisible({ timeout: 5_000 });
  });

  test('E2E-FC-03: Category filter shows enum keys with pt-BR labels', async ({ page }) => {
    const select = page.locator('select').first();
    await expect(select).toBeVisible({ timeout: 5_000 });
    const options = select.locator('option');
    const count = await options.count();
    expect(count).toBeGreaterThanOrEqual(7);
    const firstOptionText = await options.nth(1).textContent();
    expect(firstOptionText).toBeTruthy();
  });

  test('E2E-FC-04: Empty state shows message', async ({ page }) => {
    const searchInput = page.locator('.search input');
    await expect(searchInput).toBeVisible({ timeout: 5_000 });
    await searchInput.fill('zzznotfound123xyz');
    await page.waitForTimeout(1000);
    await expect(page.getByText(/nenhum alimento encontrado/i)).toBeVisible({ timeout: 5_000 });
  });
});

test.describe('Food Catalog — API Contract & Enum Validation', () => {
  let accessToken: string;

  test.beforeEach(async ({ request }) => {
    const email = uniqueEmail();
    const result = await signupViaApi(email);
    accessToken = result.accessToken;
  });

  test('E2E-FC-05: Create BASE food sends uppercase type/key, returns same', async ({ request }) => {
    const response = await request.post(`${API}/foods`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        type: 'BASE',
        name: 'Arroz integral E2E',
        category: 'CARBOIDRATO',
        per100Kcal: 357,
        per100Prot: 7,
        per100Carb: 74,
        per100Fat: 1.5,
        per100Fiber: 4,
      },
    });
    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('id');
    expect(body.data.type).toBe('BASE');
    expect(body.data.name).toBe('Arroz integral E2E');
    expect(body.data.category).toBe('CARBOIDRATO');
    expect(body.data).toHaveProperty('usedCount');
  });

  test('E2E-FC-06: Create PRESET food sends uppercase type/key, returns same', async ({ request }) => {
    const response = await request.post(`${API}/foods`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        type: 'PRESET',
        name: 'Frango grelhado 150g E2E',
        category: 'PROTEINA',
        portionLabel: '1 porção · 150g',
        presetGrams: 150,
        presetKcal: 248,
        presetProt: 46,
        presetCarb: 0,
        presetFat: 6,
      },
    });
    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.data.type).toBe('PRESET');
    expect(body.data.category).toBe('PROTEINA');
    expect(body.data).toHaveProperty('portionLabel');
  });

  test('E2E-FC-07: Create food with lowercase type "base" returns 400', async ({ request }) => {
    const response = await request.post(`${API}/foods`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { type: 'base', name: 'Test lowercase', category: 'PROTEINA', per100Kcal: 100 },
    });
    expect(response.status()).toBe(400);
  });

  test('E2E-FC-08: Create food with lowercase type "preset" returns 400', async ({ request }) => {
    const response = await request.post(`${API}/foods`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { type: 'preset', name: 'Test lowercase', category: 'PROTEINA', presetGrams: 100, presetKcal: 200 },
    });
    expect(response.status()).toBe(400);
  });

  test('E2E-FC-09: Create food with pt-BR category label "Proteína" returns 400', async ({ request }) => {
    const response = await request.post(`${API}/foods`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { type: 'BASE', name: 'Test pt-BR category', category: 'Proteína', per100Kcal: 100, per100Prot: 20, per100Carb: 5, per100Fat: 2 },
    });
    expect(response.status()).toBe(400);
  });

  test('E2E-FC-10: Create food with invalid category "Cereais" returns 400', async ({ request }) => {
    const response = await request.post(`${API}/foods`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { type: 'BASE', name: 'Test invalid', category: 'Cereais', per100Kcal: 100, per100Prot: 20, per100Carb: 5, per100Fat: 2 },
    });
    expect(response.status()).toBe(400);
  });

  test('E2E-FC-11: Create food without name returns 400', async ({ request }) => {
    const response = await request.post(`${API}/foods`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { type: 'BASE', category: 'PROTEINA' },
    });
    expect(response.status()).toBe(400);
  });

  test('E2E-FC-12: List foods returns paginated contract', async ({ request }) => {
    await request.post(`${API}/foods`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { type: 'BASE', name: 'Listado E2E', category: 'PROTEINA', per100Kcal: 100, per100Prot: 20, per100Carb: 5, per100Fat: 2, per100Fiber: 1 },
    });

    const response = await request.get(`${API}/foods`, {
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

  test('E2E-FC-13: Update food with invalid category returns 400', async ({ request }) => {
    const createResp = await request.post(`${API}/foods`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { type: 'BASE', name: 'Update E2E', category: 'CARBOIDRATO', per100Kcal: 100, per100Prot: 5, per100Carb: 20, per100Fat: 1, per100Fiber: 2 },
    });
    const created = await createResp.json();
    const foodId = created.data.id;

    const updateResp = await request.patch(`${API}/foods/${foodId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { category: 'Legumes' },
    });
    expect(updateResp.status()).toBe(400);
  });

  test('E2E-FC-14: Delete food via API', async ({ request }) => {
    const createResp = await request.post(`${API}/foods`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { type: 'BASE', name: 'Deletar E2E', category: 'GORDURA', per100Kcal: 50, per100Prot: 1, per100Carb: 2, per100Fat: 4, per100Fiber: 0 },
    });
    const created = await createResp.json();
    const foodId = created.data.id;

    const deleteResp = await request.delete(`${API}/foods/${foodId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(deleteResp.status()).toBe(204);

    const getResp = await request.get(`${API}/foods/${foodId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(getResp.status()).toBe(404);
  });

  test('E2E-FC-15: Unauthenticated access returns 401', async ({ request }) => {
    const response = await request.get(`${API}/foods`);
    expect(response.status()).toBe(401);
  });
});

test.describe('Food Catalog — UI→API Integration', () => {
  let accessToken: string;

  test.beforeEach(async ({ page }) => {
    const email = uniqueEmail();
    const result = await signupViaApi(email);
    accessToken = result.accessToken;

    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.evaluate((token) => {
      localStorage.setItem('nutriai-auth', JSON.stringify({
        state: { isAuthenticated: true, accessToken: token, user: { id: '1', name: 'Dra. Foods', email: 'f@test.com', role: 'NUTRITIONIST', onboardingCompleted: true } },
        version: 0,
      }));
    }, accessToken);
    await page.goto('/foods');
    await page.waitForLoadState('networkidle');
  });

  test('E2E-FC-16: Create food via UI sends correct enum keys to API', async ({ page, request }) => {
    await page.getByRole('button', { name: /novo alimento/i }).click();
    await page.waitForTimeout(500);

    const nameInput = page.locator('input[placeholder*="Frango"], input[placeholder*="alimento"]').first();
    await nameInput.fill('Whey Protein E2E');

    const typeSelect = page.locator('select').first();
    await typeSelect.selectOption({ label: /preset/i });

    const categorySelect = page.locator('select').nth(1);
    await categorySelect.selectOption({ label: /Proteína/i });

    const saveBtn = page.getByRole('button', { name: /salvar/i });
    await saveBtn.click();
    await page.waitForTimeout(2000);

    const response = await request.get(`${API}/foods`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { search: 'Whey Protein E2E' },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    const found = body.data?.content?.find((p: { name: string }) => p.name === 'Whey Protein E2E');
    expect(found).toBeDefined();
    expect(found.type).toBe('PRESET');
    expect(found.category).toBe('PROTEINA');
  });
});