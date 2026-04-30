import { test, expect } from '@playwright/test';
import {
  completeOnboardingViaApi,
  createPatientPayload,
  signupViaApi,
  uniqueEmail,
  API_BASE,
} from './helpers';

// Jornada completa: signup UI → login → paciente → alimento → plano → biometria → dashboard → exclusão
// Usa login/signup real via UI pra validar o fluxo end-to-end
test.use({ storageState: undefined } as { storageState: string | undefined });

test.describe('Jornada Completa — Nutricionista End-to-End', () => {
  test('E2E-J-01: signup → paciente → alimento → plano → biometria → dashboard → exclusão', async ({
    page,
    request,
  }) => {
    const email = uniqueEmail();
    const password = 'SenhaSegura123!';

    // ── 1. Signup via UI ──
    await page.goto('/signup');
    await page.waitForLoadState('networkidle');

    await page.getByTestId('signup-name').fill('Dra. Jornada E2E');
    await page.getByTestId('signup-email').fill(email);
    await page.getByTestId('signup-password').fill(password);
    await page.getByTestId('signup-password-confirm').fill(password);
    await page.getByTestId('signup-crn').fill('99999');
    await page.locator('select').first().selectOption({ label: 'SP' });

    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: /criar conta/i }).click();

    await expect(page).toHaveURL(/\/(onboarding|home)/, { timeout: 10_000 });

    if (page.url().includes('/onboarding')) {
      // Completa onboarding se necessário
      for (let i = 0; i < 5; i++) {
        const nextBtn = page.getByRole('button', { name: /próximo|começar|concluir/i });
        if (await nextBtn.isVisible().catch(() => false)) {
          await nextBtn.click();
          await page.waitForTimeout(300);
        } else break;
      }
      await expect(page).toHaveURL(/\/home/, { timeout: 10_000 });
    }

    // Obtém token via login API para chamadas posteriores
    const loginResp = await request.post(`${API_BASE}/auth/login`, {
      data: { email, password },
    });
    const accessToken = (await loginResp.json()).accessToken;

    // ── 2. Criar paciente ──
    await page.goto('/patients');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /novo paciente/i }).click();
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 3_000 });

    await page.locator('input[placeholder*="Ana Beatriz"]').fill('Paciente Jornada');
    const objectiveSelect = page.locator('select').first();
    await objectiveSelect.selectOption({ label: 'Hipertrofia' });
    await page.getByRole('checkbox').check();

    await page.getByRole('button', { name: /cadastrar/i }).click();
    await page.waitForResponse((r) => r.url().includes('/patients') && r.status() === 201, {
      timeout: 15_000,
    });
    await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 5_000 });

    // Recupera paciente criado para obter patientId
    const patientsResp = await request.get(`${API_BASE}/patients`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { search: 'Paciente Jornada' },
    });
    expect(patientsResp.status()).toBe(200);
    const listBody = await patientsResp.json();
    const patient = listBody.data?.content?.[0];
    expect(patient).toBeDefined();
    const patientId = patient.id;

    // ── 3. Criar alimento ──
    await page.goto('/foods');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /novo alimento/i }).click();
    const foodModal = page
      .locator('[class*="card"]')
      .filter({ has: page.locator('text=Novo alimento') })
      .first();
    await expect(foodModal).toBeVisible({ timeout: 3_000 });

    await page.locator('input[placeholder*="Frango"]').fill('Arroz Integral Jornada');
    const foodSelects = page.locator('select');
    await foodSelects.first().selectOption({ label: 'Carboidrato' });
    await page.locator('#create-food-ref').fill('100');

    await page
      .locator('.btn.btn-primary')
      .filter({ hasText: /salvar/i })
      .click();
    await page.waitForResponse((r) => r.url().includes('/api/v1/foods') && r.status() === 201, {
      timeout: 15_000,
    });
    await expect(foodModal).not.toBeVisible({ timeout: 5_000 });

    // ── 4. Montar plano alimentar ──
    await page.goto(`/patient/${patientId}`);
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /Plano/i }).click();
    await page.waitForLoadState('networkidle');

    await page
      .locator('.btn')
      .filter({ hasText: /Editar/i })
      .first()
      .click();

    await page.getByRole('button', { name: /adicionar refeição/i }).click();
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 3_000 });
    await page.locator('input[placeholder*="Café"]').fill('Café Jornada');
    await page
      .locator('.btn.btn-primary')
      .filter({ hasText: /adicionar/i })
      .click();
    await page.waitForResponse((r) => r.url().includes('/slots') && r.status() === 201, {
      timeout: 15_000,
    });
    await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 5_000 });

    // ── 5. Registrar biometria ──
    await page.goto(`/patient/${patientId}`);
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /Biometria/i }).click();
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /nova avaliação/i }).click();
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 3_000 });

    await page.locator('input[placeholder*="70.0"]').fill('75.5');
    await page.locator('input[placeholder*="20.0"]').fill('22.0');
    await page.getByRole('button', { name: /salvar/i }).click();
    await page.waitForResponse((r) => r.url().includes('/biometry') && r.status() === 201, {
      timeout: 15_000,
    });
    await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 5_000 });

    // ── 6. Dashboard reflete dados ──
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=Pacientes ativos')).toBeVisible({ timeout: 5_000 });

    // ── 7. Excluir paciente (jornada completa inclui deleção) ──
    await page.goto('/patients');
    await page.waitForLoadState('networkidle');

    const row = page.locator('tr, .pq-item, .card').filter({ hasText: 'Paciente Jornada' }).first();
    await expect(row).toBeVisible({ timeout: 5_000 });

    // Busca e clica no botão de menu/trash (adaptar seletor conforme UI)
    const deleteBtn = row
      .locator('button')
      .filter({ has: page.locator('svg') })
      .last();
    if (await deleteBtn.isVisible().catch(() => false)) {
      await deleteBtn.click();
      const confirmBtn = page.getByRole('button', { name: /confirmar|excluir/i });
      if (await confirmBtn.isVisible().catch(() => false)) {
        await confirmBtn.click();
      }
    }

    // Verifica que paciente sumiu da lista
    await page.waitForTimeout(500); // debounce
    await expect(page.locator('text=Paciente Jornada')).not.toBeVisible({ timeout: 5_000 });
  });
});
