import type { APIRequestContext } from '@playwright/test';

export const API_BASE = 'http://localhost:8080/api/v1';

export function uniqueEmail(): string {
  return `e2e_${Date.now()}_${Math.random().toString(36).slice(2, 7)}@test.com`;
}

export function createPatientPayload(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    name: 'Paciente E2E',
    objective: 'EMAGRECIMENTO',
    terms: true,
    ...overrides,
  };
}

export async function signupViaApi(
  request: APIRequestContext,
  email: string,
  password = 'SenhaSegura123!',
) {
  const resp = await request.post(`${API_BASE}/auth/signup`, {
    data: {
      name: 'E2E Test User',
      email,
      password,
      crn: '99999',
      crnRegional: 'SP',
      terms: true,
    },
  });
  const body = await resp.json();
  return {
    accessToken: body.accessToken,
    userId: body.user?.id,
    user: body.user,
  };
}

export async function completeOnboardingViaApi(request: APIRequestContext, accessToken: string) {
  const resp = await request.post(`${API_BASE}/auth/onboarding`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!resp.ok()) {
    const body = await resp.json().catch(() => ({}));
    throw new Error(`Onboarding failed: ${resp.status()} ${JSON.stringify(body)}`);
  }
  return resp.status();
}
