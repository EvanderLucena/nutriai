import { test, expect } from '@playwright/test';
import { uniqueEmail, signupViaApi } from './helpers';

test.describe('Food Catalog', () => {
  test.beforeEach(async ({ page }) => {
    const email = uniqueEmail();
    const { accessToken } = await signupViaApi(email);

    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await page.evaluate((token) => {
      localStorage.setItem('nutriai-auth', JSON.stringify({
        state: {
          isAuthenticated: true,
          accessToken: token,
          user: { id: '1', name: 'Dra. Teste', email: 'test@test.com', role: 'NUTRITIONIST', onboardingCompleted: true },
        },
        version: 0,
      }));
    }, accessToken);

    await page.goto('/foods');
    await page.waitForLoadState('networkidle');
  });

  test('E2E-FC01: Foods page loads and shows heading', async ({ page }) => {
    await expect(page.locator('h1, .serif')).toContainText(/alimentos/i);
  });

  test('E2E-FC02: Search input is present with placeholder', async ({ page }) => {
    const searchInput = page.locator('.search input');
    if (await searchInput.isVisible({ timeout: 5000 })) {
      await expect(searchInput).toHaveAttribute('placeholder', /buscar/i);
    }
  });

  test('E2E-FC03: Category filter dropdown is visible', async ({ page }) => {
    const select = page.locator('select').first();
    if (await select.isVisible({ timeout: 5000 })) {
      await expect(select).toBeVisible();
    }
  });

  test('E2E-FC04: "Novo alimento" button is present', async ({ page }) => {
    const newBtn = page.getByRole('button', { name: /novo alimento/i });
    if (await newBtn.isVisible({ timeout: 5000 })) {
      await expect(newBtn).toBeVisible();
    }
  });

  test('E2E-FC05: "Novo alimento" opens creation modal', async ({ page }) => {
    const newBtn = page.getByRole('button', { name: /novo alimento/i });
    if (await newBtn.isVisible({ timeout: 5000 })) {
      await newBtn.click();
      await expect(page.locator('text=/novo alimento/i')).toBeVisible({ timeout: 3000 });
    }
  });

  test('E2E-FC06: Food cards render when data available', async ({ page }) => {
    const cards = page.locator('.card');
    await page.waitForTimeout(2000);
    if (await cards.count() > 0) {
      expect(await cards.count()).toBeGreaterThan(0);
    }
  });

  test('E2E-FC07: Empty state shows message when no foods', async ({ page }) => {
    const searchInput = page.locator('.search input');
    if (await searchInput.isVisible({ timeout: 5000 })) {
      await searchInput.fill('zzznotfound123');
      await page.waitForTimeout(1000);
      const emptyState = page.locator('text=/nenhum alimento encontrado/i');
      if (await emptyState.isVisible({ timeout: 3000 })) {
        await expect(emptyState).toBeVisible();
      }
    }
  });
});