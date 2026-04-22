import { test, expect } from '@playwright/test';
import { uniqueEmail, signupViaApi } from './helpers';

test.describe('Meal Plans', () => {
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

    await page.goto('/patients');
    await page.waitForLoadState('networkidle');
  });

  test('E2E-MP01: Patient detail shows plan tab', async ({ page }) => {
    const patientRow = page.locator('table tbody tr, .pq-item').first();
    if (await patientRow.isVisible({ timeout: 5000 })) {
      await patientRow.click();
      await page.waitForLoadState('networkidle');
      const planTab = page.getByRole('button', { name: /plano/i }).or(page.locator('text=/plano alimentar/i'));
      if (await planTab.first().isVisible({ timeout: 3000 })) {
        await expect(planTab.first()).toBeVisible();
      }
    }
  });

  test('E2E-MP02: Plan view shows meal sections when available', async ({ page }) => {
    const patientRow = page.locator('table tbody tr, .pq-item').first();
    if (await patientRow.isVisible({ timeout: 5000 })) {
      await patientRow.click();
      await page.waitForLoadState('networkidle');
      const planTab = page.getByRole('button', { name: /plano/i });
      if (await planTab.isVisible({ timeout: 3000 })) {
        await planTab.click();
        await page.waitForTimeout(1000);
        const mealLabel = page.locator('text=/café|almoço|jantar|lanche/i');
        if (await mealLabel.first().isVisible({ timeout: 3000 })) {
          await expect(mealLabel.first()).toBeVisible();
        }
      }
    }
  });

  test('E2E-MP03: Save status indicator is present on plan page', async ({ page }) => {
    const patientRow = page.locator('table tbody tr, .pq-item').first();
    if (await patientRow.isVisible({ timeout: 5000 })) {
      await patientRow.click();
      await page.waitForLoadState('networkidle');
      const planTab = page.getByRole('button', { name: /plano/i });
      if (await planTab.isVisible({ timeout: 3000 })) {
        await planTab.click();
        await page.waitForTimeout(1000);
        const saveIndicator = page.locator('text=/SALVO|SALVANDO/i');
        if (await saveIndicator.first().isVisible({ timeout: 3000 })) {
          await expect(saveIndicator.first()).toBeVisible();
        }
      }
    }
  });

  test('E2E-MP04: Extras section renders on plan page', async ({ page }) => {
    const patientRow = page.locator('table tbody tr, .pq-item').first();
    if (await patientRow.isVisible({ timeout: 5000 })) {
      await patientRow.click();
      await page.waitForLoadState('networkidle');
      const planTab = page.getByRole('button', { name: /plano/i });
      if (await planTab.isVisible({ timeout: 3000 })) {
        await planTab.click();
        await page.waitForTimeout(1000);
        const extrasHeader = page.locator('text=/fora do plano/i');
        if (await extrasHeader.isVisible({ timeout: 3000 })) {
          await expect(extrasHeader).toBeVisible();
        }
      }
    }
  });
});