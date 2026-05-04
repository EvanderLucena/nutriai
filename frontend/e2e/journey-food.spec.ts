import { test, expect } from './fixtures';
import { API_BASE } from './helpers';

test.describe('Jornada — Food Catalog', () => {
  test('E2E-J-05: Criar alimento via UI + verificar enum mapeamento', async ({
    authenticatedPage,
    request,
  }) => {
    const { page, accessToken } = authenticatedPage;

    await page.goto('/foods');
    await page.waitForLoadState('networkidle');

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
});
