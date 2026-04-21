import { request } from '@playwright/test';

export function uniqueEmail(): string {
  return `e2e_${Date.now()}_${Math.random().toString(36).slice(2, 7)}@test.com`;
}

export async function signupViaApi(email: string, password = 'SenhaSegura123!') {
  const ctx = await request.newContext({ baseURL: 'http://localhost:8080/api/v1' });
  const resp = await ctx.post('/auth/signup', {
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
  return { accessToken: body.accessToken, userId: body.user?.id };
}

export async function loginViaApi(email: string, password = 'SenhaSegura123!') {
  const ctx = await request.newContext({ baseURL: 'http://localhost:8080/api/v1' });
  const resp = await ctx.post('/auth/login', { data: { email, password } });
  const body = await resp.json();
  return body.accessToken;
}