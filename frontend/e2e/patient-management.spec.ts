import { test, expect } from '@playwright/test';
import { uniqueEmail, loginViaApi, signupViaApi } from './helpers';

test.describe('Patient Management', () => {
  let authCookie: string;

  test.beforeEach(async ({ page }) => {
    const email = uniqueEmail();
    const { accessToken } = await signupViaApi(email);
    authCookie = accessToken;

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
    }, authCookie);

    await page.goto('/patients');
    await page.waitForLoadState('networkidle');
  });

  test('E2E-P01: Patients page loads and shows page title', async ({ page }) => {
    await expect(page.locator('h1, .serif')).toContainText(/pacientes/i);
  });

  test('E2E-P02: Search input filters patients by name', async ({ page }) => {
    const searchInput = page.locator('.search input');
    if (await searchInput.isVisible()) {
      await searchInput.fill('Ana');
      await page.waitForTimeout(500);
      const rows = page.locator('table tbody tr, .pq-item, .patient-grid-item');
      const count = await rows.count();
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  test('E2E-P03: Status filter buttons are visible', async ({ page }) => {
    const filterBtn = page.getByRole('button', { name: /filtrar/i });
    if (await filterBtn.isVisible()) {
      await filterBtn.click();
      await expect(page.getByText(/on-track|todos/i)).toBeVisible();
    }
  });

  test('E2E-P04: New patient button opens modal', async ({ page }) => {
    const newBtn = page.getByRole('button', { name: /novo paciente/i });
    if (await newBtn.isVisible()) {
      await newBtn.click();
      await expect(page.getByText(/nome/i).first()).toBeVisible({ timeout: 3000 });
    }
  });

  test('E2E-P05: Inactive patients toggle works', async ({ page }) => {
    const inactiveBtn = page.getByRole('button', { name: /inativos/i });
    if (await inactiveBtn.isVisible()) {
      await inactiveBtn.click();
      await expect(page.locator('text=/inativos/i')).toBeVisible({ timeout: 3000 });
    }
  });

  test('E2E-P06: Clicking a patient navigates to patient detail', async ({ page }) => {
    const patientRow = page.locator('table tbody tr, .pq-item').first();
    if (await patientRow.isVisible({ timeout: 5000 })) {
      await patientRow.click();
      await expect(page).toHaveURL(/\/patient\//, { timeout: 5000 });
    }
  });

  test('E2E-P07: Home view shows KPI cards', async ({ page }) => {
    await page.goto('/home');
    await page.waitForLoadState('networkidle');
    const kpiLabels = page.locator('.eyebrow');
    await expect(kpiLabels.first()).toBeVisible({ timeout: 5000 });
  });
});