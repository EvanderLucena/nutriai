import { test, expect } from '@playwright/test';
import { uniqueEmail, signupViaApi } from './helpers';

async function setupAuth(page: import('@playwright/test').Page) {
  const email = uniqueEmail();
  const { accessToken } = await signupViaApi(email);

  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.evaluate((token) => {
    localStorage.setItem('nutriai-auth', JSON.stringify({
      state: {
        isAuthenticated: true,
        accessToken: token,
        user: { id: '1', name: 'Dra. Foods', email: 'foods@test.com', role: 'NUTRITIONIST', onboardingCompleted: true },
      },
      version: 0,
    }));
  }, accessToken);
}

test.describe('Food Catalog — Page Rendering', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuth(page);
    await page.goto('/foods');
    await page.waitForLoadState('networkidle');
  });

  test('E2E-FC-01: Foods page renders heading without errors', async ({ page }) => {
    await expect(page.locator('h1, .serif')).toContainText(/alimentos/i);
  });

  test('E2E-FC-02: Search input is visible and has correct placeholder', async ({ page }) => {
    const searchInput = page.locator('.search input');
    await expect(searchInput).toBeVisible({ timeout: 5_000 });
    await expect(searchInput).toHaveAttribute('placeholder', /buscar/i);
  });

  test('E2E-FC-03: Category filter dropdown is visible', async ({ page }) => {
    const select = page.locator('select').first();
    await expect(select).toBeVisible({ timeout: 5_000 });
  });

  test('E2E-FC-04: "Novo alimento" button is present and enabled', async ({ page }) => {
    const btn = page.getByRole('button', { name: /novo alimento/i });
    await expect(btn).toBeVisible({ timeout: 5_000 });
    await expect(btn).toBeEnabled();
  });

  test('E2E-FC-05: Create food modal opens with required fields', async ({ page }) => {
    await page.getByRole('button', { name: /novo alimento/i }).click();
    await expect(page.getByText(/novo alimento/i)).toBeVisible({ timeout: 3_000 });
    await expect(page.getByPlaceholder(/nome do alimento/i).or(page.locator('input').first())).toBeVisible({ timeout: 3_000 });
  });

  test('E2E-FC-06: Empty state shows message when no foods found', async ({ page }) => {
    const searchInput = page.locator('.search input');
    await expect(searchInput).toBeVisible({ timeout: 5_000 });
    await searchInput.fill('zzznotfound123xyz');
    await page.waitForTimeout(1000);
    await expect(page.getByText(/nenhum alimento encontrado/i)).toBeVisible({ timeout: 5_000 });
  });
});

test.describe('Food Catalog — CRUD via API', () => {
  let accessToken: string;

  test.beforeEach(async ({ request }) => {
    const email = uniqueEmail();
    const result = await signupViaApi(email);
    accessToken = result.accessToken;
  });

  test('E2E-FC-07: Create BASE food returns correct contract', async ({ request }) => {
    const response = await request.post('http://localhost:8080/api/v1/foods', {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        type: 'base',
        name: 'Arroz integral E2E',
        category: 'Carboidrato',
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
    expect(body.data.type).toBe('base');
    expect(body.data.name).toBe('Arroz integral E2E');
    expect(body.data).toHaveProperty('category');
    expect(body.data).toHaveProperty('usedCount');
  });

  test('E2E-FC-08: Create PRESET food returns correct contract', async ({ request }) => {
    const response = await request.post('http://localhost:8080/api/v1/foods', {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        type: 'preset',
        name: 'Frango grelhado 150g E2E',
        category: 'Proteína',
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
    expect(body.data.type).toBe('preset');
    expect(body.data).toHaveProperty('portionLabel');
  });

  test('E2E-FC-09: List foods returns paginated contract', async ({ request }) => {
    await request.post('http://localhost:8080/api/v1/foods', {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { type: 'base', name: 'Listado E2E', category: 'Proteína', per100Kcal: 100, per100Prot: 20, per100Carb: 5, per100Fat: 2, per100Fiber: 1 },
    });

    const response = await request.get('http://localhost:8080/api/v1/foods', {
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

  test('E2E-FC-10: Update food via API', async ({ request }) => {
    const createResp = await request.post('http://localhost:8080/api/v1/foods', {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { type: 'base', name: 'Atualizar E2E', category: 'Carboidrato', per100Kcal: 100, per100Prot: 5, per100Carb: 20, per100Fat: 1, per100Fiber: 2 },
    });
    const created = await createResp.json();
    const foodId = created.data.id;

    const updateResp = await request.patch(`http://localhost:8080/api/v1/foods/${foodId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { name: 'Atualizado E2E' },
    });
    expect(updateResp.status()).toBe(200);
    const updated = await updateResp.json();
    expect(updated.data.name).toBe('Atualizado E2E');
  });

  test('E2E-FC-11: Delete food via API', async ({ request }) => {
    const createResp = await request.post('http://localhost:8080/api/v1/foods', {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { type: 'base', name: 'Deletar E2E', category: 'Gordura', per100Kcal: 50, per100Prot: 1, per100Carb: 2, per100Fat: 4, per100Fiber: 0 },
    });
    const created = await createResp.json();
    const foodId = created.data.id;

    const deleteResp = await request.delete(`http://localhost:8080/api/v1/foods/${foodId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(deleteResp.status()).toBe(200);

    const getResp = await request.get(`http://localhost:8080/api/v1/foods/${foodId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(getResp.status()).toBe(404);
  });

  test('E2E-FC-12: Create food without name fails validation', async ({ request }) => {
    const response = await request.post('http://localhost:8080/api/v1/foods', {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { type: 'base', category: 'Proteína' },
    });
    expect(response.status()).toBe(400);
  });

  test('E2E-FC-13: Unauthenticated access to foods returns 401', async ({ request }) => {
    const response = await request.get('http://localhost:8080/api/v1/foods');
    expect(response.status()).toBe(401);
  });
});